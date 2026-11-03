import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-store";
import {
  TABELA_PRIVADA,
  assinatura,
  cadastroPublico,
  chavePrivada,
  juntarDadosPrivados,
  linhasAlteradas,
  type LinhaPrivada,
} from "@/lib/dados-privados";
import { revisarCadastroNov2026 } from "@/lib/cadastro-nov2026";
import { aplicarListaOficial2026 } from "@/lib/lista-oficial-2026";
import { marcarTransferidosNov2026 } from "@/lib/transferidos-nov2026";
import { enfileirar, gravarCache, lerCache, registrarExecutor } from "@/lib/offline-queue";
import { sincronizarPresencasPendentes } from "@/lib/presencas";
import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import { turmaParticipaInformatica } from "@/lib/turmas-informatica";
import { slotKey, suspensaoKey } from "@/lib/schedule-engine";
import { supabase } from "@/lib/supabase-client";
import type { Aluno, AulaManual, Grupo, Reprogramacao, ScheduleConfig, Turma } from "@/lib/types";

const ROW_ID = "default";

interface AppState {
  /** Só quem está estudando: transferidos e desistentes ficam de fora de todas as contas. */
  turmas: Turma[];
  /** Cadastro completo, incluindo transferidos e desistentes (fichas e gestão). */
  todasTurmas: Turma[];
  config: ScheduleConfig;
  /** False while the initial data is still being loaded from Supabase. */
  isReady: boolean;
  addTurma: (turma: Omit<Turma, "id" | "alunos">) => void;
  updateTurma: (id: string, patch: Partial<Omit<Turma, "id" | "alunos">>) => void;
  removeTurma: (id: string) => void;
  addAluno: (turmaId: string, aluno: Omit<Aluno, "id">) => void;
  updateAluno: (turmaId: string, alunoId: string, patch: Partial<Omit<Aluno, "id">>) => void;
  removeAluno: (turmaId: string, alunoId: string) => void;
  /**
   * Importa dados de vários alunos de uma vez (ex.: as datas de nascimento
   * da lista de chamada). Cada entrada casa pelo id do aluno. Feito num
   * único envio ao banco — 200 chamadas de `updateAluno` seriam 200
   * gravações do cadastro inteiro.
   */
  importarAlunos: (
    patches: { turmaId: string; alunoId: string; patch: Partial<Omit<Aluno, "id">> }[],
  ) => void;
  addGrupo: (turmaId: string, grupo: Omit<Grupo, "id">) => void;
  updateGrupo: (turmaId: string, grupoId: string, patch: Partial<Omit<Grupo, "id">>) => void;
  removeGrupo: (turmaId: string, grupoId: string) => void;
  addAula: (aula: Omit<AulaManual, "id">) => void;
  updateAula: (id: string, patch: Partial<Omit<AulaManual, "id">>) => void;
  removeAula: (id: string) => void;
  updateConfig: (patch: Partial<ScheduleConfig>) => void;
  /** Overrides which turma occupies a fixed weekly slot (Programação page). Pass `null` to restore the automatic rotation. */
  setSlotOverride: (dia: string, slotInicio: string, turmaId: string | null) => void;
  /** Stops (or resumes) the class scheduled for a specific date + slot, without affecting future weeks. */
  setSessaoSuspensa: (
    dateISO: string,
    dia: string,
    slotInicio: string,
    suspensa: boolean,
    motivo?: string,
  ) => void;
  /** Grava (ou apaga, com texto vazio) a observação de uma aula específica. */
  setObservacaoAula: (dateISO: string, dia: string, slotInicio: string, texto: string) => void;
  /**
   * Reprograma uma sessão específica para outra data/horário: marca a
   * original como suspensa e registra a nova ocorrência, sem afetar o
   * rodízio automático das semanas seguintes.
   */
  reprogramarAula: (input: Omit<Reprogramacao, "id" | "criadoEm">) => void;
  removeReprogramacao: (id: string) => void;
  resetToSeed: () => void;
}

const AppContext = createContext<AppState | null>(null);

interface AppStatePayload {
  /** Cadastro já sem os dados privados (é o que o site público lê). */
  turmas: Turma[];
  config: ScheduleConfig;
  /** Dados privados que mudaram (vão para a tabela só de administradores). */
  privados?: LinhaPrivada[];
  /**
   * Cadastro com os dados privados, usado só se a tabela privada ainda não
   * existir no banco: assim nada se perde antes de o SQL ser rodado.
   */
  turmasCompletas?: Turma[];
}

const CACHE_PRIVADO = "alunos_privado";

/** A tabela privada ainda não foi criada (SQL supabase/alunos-privado.sql). */
const tabelaPrivadaAusente = (msg: string) =>
  /alunos_privado|does not exist|schema cache|42P01|PGRST205/i.test(msg);

/** Envia o cadastro (turmas, grupos, alunos, aulas) e os dados privados ao banco. */
async function enviarAppState(payload: AppStatePayload): Promise<void> {
  let turmas = payload.turmas;
  if (payload.privados?.length) {
    const { error } = await supabase.from(TABELA_PRIVADA).upsert(
      payload.privados.map((l) => ({ ...l, updated_at: new Date().toISOString() })),
      { onConflict: "turma_id,aluno_id" },
    );
    if (error) {
      if (!tabelaPrivadaAusente(error.message) || !payload.turmasCompletas) {
        throw new Error(error.message);
      }
      turmas = payload.turmasCompletas;
      toast.warning(
        "Os dados pessoais dos alunos ainda ficam no cadastro público: rode o SQL alunos-privado.sql no Supabase.",
      );
    }
  }
  const { error } = await supabase.from("app_state").upsert({
    id: ROW_ID,
    turmas,
    config: payload.config,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

// Reenvio automático do cadastro guardado enquanto a internet estava fora.
registrarExecutor("app_state", async (payload) => {
  await enviarAppState(payload as AppStatePayload);
});

/**
 * Regras que entraram no código depois de a configuração já estar salva no
 * banco (ex.: dias indisponíveis dos 5º anos). Valem até o administrador
 * salvar a configuração com a sua própria versão delas.
 */
function comRegrasPadrao(config: ScheduleConfig): ScheduleConfig {
  if (config.diasIndisponiveis) return config;
  return { ...config, diasIndisponiveis: SEED_CONFIG.diasIndisponiveis };
}

/** Todas as revisões pontuais de cadastro, em ordem. */
function revisarCadastro(turmas: Turma[], config: ScheduleConfig) {
  const a = revisarCadastroNov2026(turmas, config);
  const b = marcarTransferidosNov2026(a.turmas, a.config);
  const c = aplicarListaOficial2026(b.turmas, b.config);
  return { turmas: c.turmas, config: c.config, alterado: a.alterado || b.alterado || c.alterado };
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady: authPronto } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>(SEED_TURMAS);
  const [config, setConfig] = useState<ScheduleConfig>(SEED_CONFIG);
  const [isReady, setIsReady] = useState(false);

  // Kept in refs so every mutation can persist the *latest* full row to
  // Supabase without depending on stale closures over `turmas`/`config`.
  const turmasRef = useRef(turmas);
  // Dados privados já gravados no banco (chave → assinatura), para enviar só
  // o que mudou. `null` = ainda não carregados (ou sem login): nada é enviado.
  const privadosSalvosRef = useRef<Map<string, string> | null>(null);
  const configRef = useRef(config);
  turmasRef.current = turmas;
  configRef.current = config;

  // Sem internet, reenvia a frequência guardada assim que a conexão voltar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    async function sincronizar() {
      const { enviadas } = await sincronizarPresencasPendentes();
      if (enviadas > 0) toast.success(`${enviadas} registro(s) de frequência sincronizado(s).`);
    }
    sincronizar();
    window.addEventListener("online", sincronizar);
    return () => window.removeEventListener("online", sincronizar);
  }, []);

  // Sem login (ou depois de sair), nenhum dado pessoal fica neste aparelho.
  useEffect(() => {
    if (authPronto && !isAuthenticated) gravarCache(CACHE_PRIVADO, null);
  }, [authPronto, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    privadosSalvosRef.current = null;
    const privadosEmCache = isAuthenticated ? lerCache<LinhaPrivada[]>(CACHE_PRIVADO) : null;
    // Enquanto a rede não responde, a tela abre com a última cópia local.
    const emCache = lerCache<{ turmas: Turma[]; config: ScheduleConfig }>("app_state");
    if (emCache) {
      const recuperado = revisarCadastro(
        juntarDadosPrivados(emCache.turmas, privadosEmCache ?? []),
        comRegrasPadrao(emCache.config),
      );
      setTurmas(recuperado.turmas);
      setConfig(recuperado.config);
    }
    const privadosPromise: Promise<LinhaPrivada[] | null> = isAuthenticated
      ? Promise.resolve(
          supabase
            .from(TABELA_PRIVADA)
            .select("turma_id, aluno_id, inep, nascimento, endereco, anotacoes")
            .limit(5000),
        ).then(({ data, error }) => (error ? null : ((data ?? []) as LinhaPrivada[])))
      : Promise.resolve(null);
    Promise.all([
      supabase.from("app_state").select("turmas, config").eq("id", ROW_ID).maybeSingle(),
      privadosPromise,
    ])
      .then(([{ data, error }, privados]) => ({ data, error, privados }))
      .then(async ({ data, error, privados }) => {
        if (cancelled) return;
        if (privados) {
          privadosSalvosRef.current = new Map(
            privados.map((l) => [
              chavePrivada(l.turma_id, l.aluno_id),
              assinatura({ ...l, anotacoes: l.anotacoes ?? [] }),
            ]),
          );
          gravarCache(CACHE_PRIVADO, privados);
        }
        if (error) {
          if (!emCache) toast.error(`Não foi possível carregar os dados: ${error.message}`);
        } else if (data) {
          const revisao = revisarCadastro(
            juntarDadosPrivados((data.turmas as Turma[] | null) ?? SEED_TURMAS, privados ?? []),
            comRegrasPadrao((data.config as ScheduleConfig | null) ?? SEED_CONFIG),
          );
          const proximasTurmas = revisao.turmas;
          const proximaConfig = revisao.config;
          setTurmas(proximasTurmas);
          setConfig(proximaConfig);
          gravarCache("app_state", {
            turmas: cadastroPublico(proximasTurmas, privados !== null),
            config: proximaConfig,
          });
          // Cadastro antigo ainda com dados pessoais dentro: o administrador
          // logado os move para a tabela privada na primeira leitura.
          const temDadoPrivadoPublico = ((data.turmas as Turma[] | null) ?? []).some((t) =>
            t.alunos?.some((a) => a.inep || a.nascimento || a.endereco || a.anotacoes?.length),
          );
          // A leitura pública mostra o cadastro revisado, mas SOMENTE a sessão
          // autenticada tenta gravar os dados. A migração é idempotente e não
          // altera frequências, datas de aula ou outras turmas.
          if ((revisao.alterado || (temDadoPrivadoPublico && privados)) && isAuthenticated) {
            try {
              await enviarAppState(montarEnvio(proximasTurmas, proximaConfig));
              toast.success("Cadastro escolar atualizado.");
            } catch (e) {
              toast.error(
                "O cadastro foi corrigido na tela, mas não pôde ser salvo no banco: " +
                  (e instanceof Error ? e.message : "verifique o acesso do administrador"),
              );
            }
          }
        } else if (isAuthenticated) {
          // First run: seed the row (requires an authenticated admin session,
          // per the write RLS policy) so future reads — including the public
          // agenda page, before any admin login — find real data.
          const { error: seedError } = await supabase
            .from("app_state")
            .upsert({ id: ROW_ID, turmas: SEED_TURMAS, config: SEED_CONFIG });
          if (seedError) toast.error(`Não foi possível preparar os dados: ${seedError.message}`);
        }
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /**
   * Separa o que vai para o cadastro público e o que vai para a tabela só de
   * administradores. Marca as linhas privadas como salvas já aqui: se o envio
   * falhar, ele fica na fila offline com essas mesmas linhas.
   */
  function montarEnvio(nextTurmas: Turma[], nextConfig: ScheduleConfig): AppStatePayload {
    const salvas = privadosSalvosRef.current;
    const privados = salvas ? linhasAlteradas(nextTurmas, salvas) : [];
    if (salvas) {
      for (const l of privados) salvas.set(chavePrivada(l.turma_id, l.aluno_id), assinatura(l));
      gravarCache(
        CACHE_PRIVADO,
        linhasAlteradas(nextTurmas, new Map()), // todas as linhas com algum dado
      );
    }
    return {
      // Sem os dados privados carregados (ex.: o SQL da tabela ainda não foi
      // rodado), o cadastro vai como está, para não perder nada.
      turmas: salvas ? cadastroPublico(nextTurmas, true) : nextTurmas,
      config: nextConfig,
      privados,
      turmasCompletas: nextTurmas,
    };
  }

  function persist(nextTurmas: Turma[], nextConfig: ScheduleConfig) {
    const envio = montarEnvio(nextTurmas, nextConfig);
    // A cópia local é gravada primeiro: mesmo sem internet a tela continua
    // funcionando e os dados sobrevivem a um recarregamento.
    gravarCache("app_state", { turmas: envio.turmas, config: nextConfig });
    enviarAppState(envio).catch(() => {
      enfileirar("app_state", envio);
      toast.warning("Sem internet: as alterações foram guardadas e serão enviadas ao reconectar.");
    });
  }

  function applyTurmas(updater: (prev: Turma[]) => Turma[]) {
    const next = updater(turmasRef.current);
    setTurmas(next);
    persist(next, configRef.current);
  }

  function applyConfig(updater: (prev: ScheduleConfig) => ScheduleConfig) {
    const next = updater(configRef.current);
    setConfig(next);
    persist(turmasRef.current, next);
  }

  const value = useMemo<AppState>(
    () => ({
      turmas: turmas.filter(turmaParticipaInformatica).map((t) => ({
        ...t,
        alunos: t.alunos.filter((a) => !a.situacao || a.situacao === "ativo"),
      })),
      // A EJA permanece preservada no banco, mas não participa do módulo de informática.
      todasTurmas: turmas.filter(turmaParticipaInformatica),
      config,
      isReady,
      addTurma: (turma) => {
        applyTurmas((prev) => [...prev, { ...turma, id: generateId("turma"), alunos: [] }]);
      },
      updateTurma: (id, patch) => {
        applyTurmas((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      },
      removeTurma: (id) => {
        applyTurmas((prev) => prev.filter((t) => t.id !== id));
      },
      addAluno: (turmaId, aluno) => {
        applyTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId
              ? { ...t, alunos: [...t.alunos, { ...aluno, id: generateId("aluno") }] }
              : t,
          ),
        );
      },
      updateAluno: (turmaId, alunoId, patch) => {
        applyTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId
              ? {
                  ...t,
                  alunos: t.alunos.map((a) => (a.id === alunoId ? { ...a, ...patch } : a)),
                }
              : t,
          ),
        );
      },
      importarAlunos: (patches) => {
        const porTurma = new Map<string, Map<string, Partial<Omit<Aluno, "id">>>>();
        for (const item of patches) {
          const daTurma = porTurma.get(item.turmaId) ?? new Map();
          daTurma.set(item.alunoId, { ...(daTurma.get(item.alunoId) ?? {}), ...item.patch });
          porTurma.set(item.turmaId, daTurma);
        }
        applyTurmas((prev) =>
          prev.map((t) => {
            const daTurma = porTurma.get(t.id);
            if (!daTurma) return t;
            return {
              ...t,
              alunos: t.alunos.map((a) => {
                const patch = daTurma.get(a.id);
                return patch ? { ...a, ...patch } : a;
              }),
            };
          }),
        );
      },
      removeAluno: (turmaId, alunoId) => {
        applyTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId ? { ...t, alunos: t.alunos.filter((a) => a.id !== alunoId) } : t,
          ),
        );
      },
      addGrupo: (turmaId, grupo) => {
        applyTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId
              ? { ...t, grupos: [...(t.grupos ?? []), { ...grupo, id: generateId("grupo") }] }
              : t,
          ),
        );
      },
      updateGrupo: (turmaId, grupoId, patch) => {
        applyTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId
              ? {
                  ...t,
                  grupos: (t.grupos ?? []).map((g) => (g.id === grupoId ? { ...g, ...patch } : g)),
                }
              : t,
          ),
        );
      },
      removeGrupo: (turmaId, grupoId) => {
        applyTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId
              ? {
                  ...t,
                  grupos: (t.grupos ?? []).filter((g) => g.id !== grupoId),
                  alunos: t.alunos.map((a) =>
                    a.grupoId === grupoId ? { ...a, grupoId: undefined } : a,
                  ),
                }
              : t,
          ),
        );
      },
      addAula: (aula) => {
        applyConfig((prev) => ({
          ...prev,
          aulas: [...(prev.aulas ?? []), { ...aula, id: generateId("aula") }],
        }));
      },
      updateAula: (id, patch) => {
        applyConfig((prev) => ({
          ...prev,
          aulas: (prev.aulas ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
      },
      removeAula: (id) => {
        applyConfig((prev) => ({
          ...prev,
          aulas: (prev.aulas ?? []).filter((a) => a.id !== id),
        }));
      },
      updateConfig: (patch) => {
        applyConfig((prev) => ({ ...prev, ...patch }));
      },
      setSlotOverride: (dia, slotInicio, turmaId) => {
        applyConfig((prev) => {
          const key = slotKey(dia, slotInicio);
          const next = { ...(prev.slotOverrides ?? {}) };
          if (turmaId) {
            next[key] = turmaId;
          } else {
            delete next[key];
          }
          return { ...prev, slotOverrides: next };
        });
      },
      setSessaoSuspensa: (dateISO, dia, slotInicio, suspensa, motivo) => {
        applyConfig((prev) => {
          const key = suspensaoKey(dateISO, dia, slotInicio);
          const next = { ...(prev.suspensoes ?? {}) };
          const motivos = { ...(prev.motivosSuspensao ?? {}) };
          if (suspensa) {
            next[key] = true;
            if (motivo) motivos[key] = motivo;
          } else {
            delete next[key];
            delete motivos[key];
          }
          return { ...prev, suspensoes: next, motivosSuspensao: motivos };
        });
      },
      setObservacaoAula: (dateISO, dia, slotInicio, texto) => {
        applyConfig((prev) => {
          const key = suspensaoKey(dateISO, dia, slotInicio);
          const next = { ...(prev.observacoesAula ?? {}) };
          if (texto.trim()) next[key] = texto.trim();
          else delete next[key];
          return { ...prev, observacoesAula: next };
        });
      },
      reprogramarAula: (input) => {
        applyConfig((prev) => {
          const key = suspensaoKey(input.dataOriginal, input.diaOriginal, input.inicioOriginal);
          const nova: Reprogramacao = {
            ...input,
            id: generateId("reprog"),
            criadoEm: new Date().toISOString(),
          };
          const suspensoes = { ...(prev.suspensoes ?? {}), [key]: true as const };
          if (input.slotDeslocado) {
            const d = input.slotDeslocado;
            suspensoes[suspensaoKey(d.data, d.dia, d.inicio)] = true;
          }
          return {
            ...prev,
            suspensoes,
            reprogramacoes: [...(prev.reprogramacoes ?? []), nova],
          };
        });
      },
      removeReprogramacao: (id) => {
        applyConfig((prev) => {
          const alvo = (prev.reprogramacoes ?? []).find((r) => r.id === id);
          const nextSuspensoes = { ...(prev.suspensoes ?? {}) };
          if (alvo) {
            delete nextSuspensoes[
              suspensaoKey(alvo.dataOriginal, alvo.diaOriginal, alvo.inicioOriginal)
            ];
            if (alvo.slotDeslocado) {
              const d = alvo.slotDeslocado;
              delete nextSuspensoes[suspensaoKey(d.data, d.dia, d.inicio)];
            }
          }
          return {
            ...prev,
            suspensoes: nextSuspensoes,
            reprogramacoes: (prev.reprogramacoes ?? []).filter((r) => r.id !== id),
          };
        });
      },
      resetToSeed: () => {
        setTurmas(SEED_TURMAS);
        setConfig(SEED_CONFIG);
        persist(SEED_TURMAS, SEED_CONFIG);
      },
    }),
    [turmas, config, isReady],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
