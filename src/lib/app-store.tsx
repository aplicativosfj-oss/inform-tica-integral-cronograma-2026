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

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("app_state")
      .select("turmas, config")
      .eq("id", ROW_ID)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error(`Não foi possível carregar os dados: ${error.message}`);
        } else if (data) {
          setTurmas((data.turmas as Turma[] | null) ?? SEED_TURMAS);
          setConfig((data.config as ScheduleConfig | null) ?? SEED_CONFIG);
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
    supabase
      .from("app_state")
      .upsert({
        id: ROW_ID,
        turmas: nextTurmas,
        config: nextConfig,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) toast.error(`Não foi possível salvar: ${error.message}`);
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
