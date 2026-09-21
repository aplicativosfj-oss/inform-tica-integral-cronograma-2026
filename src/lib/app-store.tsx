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
import { enfileirar, gravarCache, lerCache, registrarExecutor } from "@/lib/offline-queue";
import { sincronizarPresencasPendentes } from "@/lib/presencas";
import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import { slotKey, suspensaoKey } from "@/lib/schedule-engine";
import { supabase } from "@/lib/supabase-client";
import type { Aluno, AulaManual, Grupo, Reprogramacao, ScheduleConfig, Turma } from "@/lib/types";

const ROW_ID = "default";

interface AppState {
  turmas: Turma[];
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
  turmas: Turma[];
  config: ScheduleConfig;
}

/** Envia o cadastro completo (turmas, grupos, alunos, aulas) ao banco. */
async function enviarAppState(payload: AppStatePayload): Promise<void> {
  const { error } = await supabase.from("app_state").upsert({
    id: ROW_ID,
    turmas: payload.turmas,
    config: payload.config,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

// Reenvio automático do cadastro guardado enquanto a internet estava fora.
registrarExecutor("app_state", async (payload) => {
  await enviarAppState(payload as AppStatePayload);
});

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>(SEED_TURMAS);
  const [config, setConfig] = useState<ScheduleConfig>(SEED_CONFIG);
  const [isReady, setIsReady] = useState(false);

  // Kept in refs so every mutation can persist the *latest* full row to
  // Supabase without depending on stale closures over `turmas`/`config`.
  const turmasRef = useRef(turmas);
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

  useEffect(() => {
    let cancelled = false;
    // Enquanto a rede não responde, a tela abre com a última cópia local.
    const emCache = lerCache<{ turmas: Turma[]; config: ScheduleConfig }>("app_state");
    if (emCache) {
      setTurmas(emCache.turmas);
      setConfig(emCache.config);
    }
    supabase
      .from("app_state")
      .select("turmas, config")
      .eq("id", ROW_ID)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          if (!emCache) toast.error(`Não foi possível carregar os dados: ${error.message}`);
        } else if (data) {
          const proximasTurmas = (data.turmas as Turma[] | null) ?? SEED_TURMAS;
          const proximaConfig = (data.config as ScheduleConfig | null) ?? SEED_CONFIG;
          setTurmas(proximasTurmas);
          setConfig(proximaConfig);
          gravarCache("app_state", { turmas: proximasTurmas, config: proximaConfig });
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

  function persist(nextTurmas: Turma[], nextConfig: ScheduleConfig) {
    // A cópia local é gravada primeiro: mesmo sem internet a tela continua
    // funcionando e os dados sobrevivem a um recarregamento.
    gravarCache("app_state", { turmas: nextTurmas, config: nextConfig });
    enviarAppState({ turmas: nextTurmas, config: nextConfig }).catch(() => {
      enfileirar("app_state", { turmas: nextTurmas, config: nextConfig });
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
      turmas,
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
