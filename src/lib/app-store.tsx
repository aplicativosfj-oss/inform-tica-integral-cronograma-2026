import { createContext, useContext, useMemo, type ReactNode } from "react";

import { SEED_CONFIG, SEED_TURMAS } from "@/lib/seed-data";
import { usePersistentState } from "@/lib/use-persistent-state";
import type { Aluno, Grupo, ScheduleConfig, Turma } from "@/lib/types";

interface AppState {
  turmas: Turma[];
  config: ScheduleConfig;
  addTurma: (turma: Omit<Turma, "id" | "alunos">) => void;
  updateTurma: (id: string, patch: Partial<Omit<Turma, "id" | "alunos">>) => void;
  removeTurma: (id: string) => void;
  addAluno: (turmaId: string, aluno: Omit<Aluno, "id">) => void;
  updateAluno: (turmaId: string, alunoId: string, patch: Partial<Omit<Aluno, "id">>) => void;
  removeAluno: (turmaId: string, alunoId: string) => void;
  addGrupo: (turmaId: string, grupo: Omit<Grupo, "id">) => void;
  updateGrupo: (turmaId: string, grupoId: string, patch: Partial<Omit<Grupo, "id">>) => void;
  removeGrupo: (turmaId: string, grupoId: string) => void;
  updateConfig: (patch: Partial<ScheduleConfig>) => void;
  resetToSeed: () => void;
}

const AppContext = createContext<AppState | null>(null);

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [turmas, setTurmas] = usePersistentState<Turma[]>("informatica:turmas", SEED_TURMAS);
  const [config, setConfig] = usePersistentState<ScheduleConfig>("informatica:config", SEED_CONFIG);

  const value = useMemo<AppState>(
    () => ({
      turmas,
      config,
      addTurma: (turma) => {
        setTurmas((prev) => [...prev, { ...turma, id: generateId("turma"), alunos: [] }]);
      },
      updateTurma: (id, patch) => {
        setTurmas((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      },
      removeTurma: (id) => {
        setTurmas((prev) => prev.filter((t) => t.id !== id));
      },
      addAluno: (turmaId, aluno) => {
        setTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId
              ? { ...t, alunos: [...t.alunos, { ...aluno, id: generateId("aluno") }] }
              : t,
          ),
        );
      },
      updateAluno: (turmaId, alunoId, patch) => {
        setTurmas((prev) =>
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
        setTurmas((prev) =>
          prev.map((t) =>
            t.id === turmaId ? { ...t, alunos: t.alunos.filter((a) => a.id !== alunoId) } : t,
          ),
        );
      },
      updateConfig: (patch) => {
        setConfig((prev) => ({ ...prev, ...patch }));
      },
      resetToSeed: () => {
        setTurmas(SEED_TURMAS);
        setConfig(SEED_CONFIG);
      },
    }),
    [turmas, config, setTurmas, setConfig],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
