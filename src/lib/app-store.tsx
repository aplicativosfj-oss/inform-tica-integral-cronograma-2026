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
import { gravarCache, lerCache } from "@/lib/offline-queue";
import { sincronizarPresencasPendentes } from "@/lib/presencas";
import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import { slotKey, suspensaoKey } from "@/lib/schedule-engine";
import { supabase } from "@/lib/supabase-client";
import type { Aluno, AulaManual, Grupo, ScheduleConfig, Turma } from "@/lib/types";

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
  setSessaoSuspensa: (dateISO: string, dia: string, slotInicio: string, suspensa: boolean) => void;
  resetToSeed: () => void;
}

const AppContext = createContext<AppState | null>(null);

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
      setSessaoSuspensa: (dateISO, dia, slotInicio, suspensa) => {
        applyConfig((prev) => {
          const key = suspensaoKey(dateISO, dia, slotInicio);
          const next = { ...(prev.suspensoes ?? {}) };
          if (suspensa) {
            next[key] = true;
          } else {
            delete next[key];
          }
          return { ...prev, suspensoes: next };
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
