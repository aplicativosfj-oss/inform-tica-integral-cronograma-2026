import { describe, expect, test } from "bun:test";

import {
  buildDailySlots,
  buildGrupos,
  buildSubBlocos,
  buildWeeklySchedule,
  currentWeekdayLabel,
  findSessaoAtual,
  formatCountdown,
  getWeekIndex,
  proximasDatasDoDia,
} from "@/lib/schedule-engine";
import type { Aluno, ScheduleConfig, Turma } from "@/lib/types";

function makeConfig(overrides: Partial<ScheduleConfig> = {}): ScheduleConfig {
  return {
    nomeEscola: "Escola Teste",
    inep: "0",
    endereco: "",
    professorInformatica: "Prof. Teste",
    diasSemana: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    horaInicio: "08:00",
    horaFim: "15:00",
    intervaloInicio: "12:00",
    intervaloFim: "13:00",
    duracaoSlotMinutos: 60,
    duracaoGrupoMinutos: 30,
    numeroComputadores: 7,
    ...overrides,
  };
}

function makeTurma(id: string, alunoCount: number): Turma {
  const alunos: Aluno[] = Array.from({ length: alunoCount }, (_, i) => ({
    id: `${id}-a${i}`,
    nome: `Aluno ${id} ${i + 1}`,
  }));
  return { id, serie: "Teste", letra: id, professorRegente: "Prof.", alunos };
}

describe("buildDailySlots", () => {
  test("gera 6 janelas de 1h pulando o horário de almoço", () => {
    expect(buildDailySlots(makeConfig())).toEqual([
      { inicio: "08:00", fim: "09:00" },
      { inicio: "09:00", fim: "10:00" },
      { inicio: "10:00", fim: "11:00" },
      { inicio: "11:00", fim: "12:00" },
      { inicio: "13:00", fim: "14:00" },
      { inicio: "14:00", fim: "15:00" },
    ]);
  });

  test("com recreio configurado, a aula seguinte começa exatamente quando o intervalo termina", () => {
    const config = makeConfig({
      horaFim: "15:00",
      intervaloInicio: "11:00",
      intervaloFim: "13:10",
      recreioInicio: "09:00",
      recreioFim: "09:15",
    });
    expect(buildDailySlots(config)).toEqual([
      { inicio: "08:00", fim: "09:00" },
      { inicio: "09:15", fim: "10:15" },
      { inicio: "13:10", fim: "14:10" },
    ]);
  });
});

describe("buildWeeklySchedule", () => {
  test("distribui 10 turmas nos 30 horários semanais, 3x cada, sem repetir no mesmo dia", () => {
    const config = makeConfig();
    const turmas = Array.from({ length: 10 }, (_, i) => makeTurma(`t${i}`, 20));
    const assignments = buildWeeklySchedule(turmas, config);
    expect(assignments).toHaveLength(30);

    const counts = new Map<string, number>();
    for (const a of assignments) counts.set(a.turma.id, (counts.get(a.turma.id) ?? 0) + 1);
    for (const turma of turmas) expect(counts.get(turma.id)).toBe(3);

    for (const dia of config.diasSemana) {
      const idsDoDia = assignments.filter((a) => a.dia === dia).map((a) => a.turma.id);
      expect(new Set(idsDoDia).size).toBe(idsDoDia.length);
    }
  });

  test("cada assignment carrega o total real de sessões semanais da sua turma", () => {
    const config = makeConfig();
    // 4 turmas para 30 horários não divide igualmente -> contagens diferentes de propósito
    const turmas = Array.from({ length: 4 }, (_, i) => makeTurma(`t${i}`, 10));
    const assignments = buildWeeklySchedule(turmas, config);
    const counts = new Map<string, number>();
    for (const a of assignments) counts.set(a.turma.id, (counts.get(a.turma.id) ?? 0) + 1);
    for (const a of assignments) expect(a.sessoesPorSemana).toBe(counts.get(a.turma.id)!);
  });

  test("turma vazia não gera horários (nenhuma divisão por zero)", () => {
    expect(buildWeeklySchedule([], makeConfig())).toEqual([]);
  });
});

describe("buildGrupos", () => {
  test("divide os alunos em grupos limitados pelo número de computadores", () => {
    const turma = makeTurma("t", 16);
    const grupos = buildGrupos(turma, makeConfig({ numeroComputadores: 7 }));
    expect(grupos.map((g) => g.alunos.length)).toEqual([7, 7, 2]);
  });

  test("turma sem alunos gera um grupo vazio, nunca quebra a agenda", () => {
    expect(buildGrupos(makeTurma("t", 0), makeConfig())).toEqual([{ indice: 0, alunos: [] }]);
  });
});

describe("rodízio eletrônico entre semanas", () => {
  const config = makeConfig();
  const turmas = Array.from({ length: 10 }, (_, i) => makeTurma(`t${i}`, 25));
  const alvo = turmas[3]!; // 25 alunos / 7 computadores = 4 grupos

  test("nenhum grupo (e portanto nenhum aluno) fica de fora ao longo de várias semanas", () => {
    const gruposVistos = new Set<number>();
    for (let semana = 0; semana < 8; semana++) {
      const assignmentsDaTurma = buildWeeklySchedule(turmas, config).filter(
        (a) => a.turma.id === alvo.id,
      );
      for (const assignment of assignmentsDaTurma) {
        for (const sub of buildSubBlocos(assignment, config, semana)) {
          gruposVistos.add(sub.grupo.indice);
        }
      }
    }
    expect(gruposVistos.size).toBe(buildGrupos(alvo, config).length);
  });

  test("a distribuição de turnos entre grupos é equilibrada ao longo do tempo", () => {
    const turnosPorGrupo = new Map<number, number>();
    const semanas = 12;
    for (let semana = 0; semana < semanas; semana++) {
      const assignmentsDaTurma = buildWeeklySchedule(turmas, config).filter(
        (a) => a.turma.id === alvo.id,
      );
      for (const assignment of assignmentsDaTurma) {
        for (const sub of buildSubBlocos(assignment, config, semana)) {
          turnosPorGrupo.set(sub.grupo.indice, (turnosPorGrupo.get(sub.grupo.indice) ?? 0) + 1);
        }
      }
    }
    const valores = [...turnosPorGrupo.values()];
    expect(valores).toHaveLength(buildGrupos(alvo, config).length);
    expect(Math.max(...valores) - Math.min(...valores)).toBeLessThanOrEqual(1);
  });

  test("de uma semana para a outra o rodízio continua de onde parou (sem repetir nem pular grupo)", () => {
    // uma única turma ocupa todos os 30 horários da semana -> 30 sessões, 2 subblocos cada
    const turmaSolo = makeTurma("solo", 25); // 4 grupos
    const assignments = buildWeeklySchedule([turmaSolo], config);
    expect(assignments[0]!.sessoesPorSemana).toBe(30);

    const totalGrupos = buildGrupos(turmaSolo, config).length;
    let esperado = 0;
    for (const assignment of assignments) {
      for (const sub of buildSubBlocos(assignment, config, 0)) {
        expect(sub.grupo.indice).toBe(esperado % totalGrupos);
        esperado += 1;
      }
    }
  });

  test("mesmo quando o consumo semanal é múltiplo exato do nº de grupos, o mapeamento grupo->horário muda de semana em semana", () => {
    // Caso real que travava: 2 sessões/semana x 2 sub-blocos = 4 vagas,
    // exatamente igual ao nº de grupos de uma turma com 22-28 alunos (4
    // grupos de 7). weekIndex * consumoPorSemana (4) módulo 4 é sempre 0,
    // então o grupo que abre a semana nunca mudava — mesmo alunos, mesmo
    // dia, para sempre.
    const turmas = [makeTurma("t0", 24)]; // 4 grupos, sozinha na semana
    const configSemanaCurta = makeConfig({
      diasSemana: ["Segunda", "Quarta"],
      horaInicio: "08:00",
      horaFim: "09:00", // exatamente 1 janela de 60min por dia
    });
    const assignments = buildWeeklySchedule(turmas, configSemanaCurta);
    expect(assignments).toHaveLength(2); // 1 sessão em cada um dos 2 dias -> 2 sessões/semana
    const turma = turmas[0]!;
    expect(buildGrupos(turma, configSemanaCurta)).toHaveLength(4);

    const primeiroGrupoPorSemana = new Set<number>();
    for (let semana = 0; semana < 4; semana++) {
      const segunda = assignments.find((a) => a.dia === "Segunda")!;
      const subs = buildSubBlocos(segunda, configSemanaCurta, semana);
      primeiroGrupoPorSemana.add(subs[0]!.grupo.indice);
    }
    // Em 4 semanas, o grupo que abre a segunda-feira passa pelos 4 grupos —
    // antes da correção, esse conjunto tinha sempre tamanho 1 (nunca mudava).
    expect(primeiroGrupoPorSemana.size).toBe(4);
  });
});

describe("getWeekIndex", () => {
  test("qualquer dia dentro da mesma semana (segunda a domingo) dá o mesmo índice", () => {
    const segunda = new Date(2026, 8, 14);
    const domingo = new Date(2026, 8, 20);
    expect(getWeekIndex(segunda)).toBe(getWeekIndex(domingo));
  });

  test("a semana seguinte tem índice consecutivo", () => {
    const semana1 = new Date(2026, 8, 14);
    const semana2 = new Date(2026, 8, 21);
    expect(getWeekIndex(semana2)).toBe(getWeekIndex(semana1) + 1);
  });
});

describe("proximasDatasDoDia", () => {
  test("retorna as próximas N datas reais do dia da semana, uma por semana", () => {
    const segunda14 = new Date(2026, 8, 14); // segunda-feira
    const datas = proximasDatasDoDia("Segunda", segunda14, 3);
    expect(datas.map((d) => d.getDate())).toEqual([14, 21, 28]);
    for (const d of datas) expect(currentWeekdayLabel(d)).toBe("Segunda");
  });

  test("a partir de uma data que não é o dia pedido, começa na próxima ocorrência", () => {
    const quarta16 = new Date(2026, 8, 16); // quarta-feira
    const datas = proximasDatasDoDia("Sexta", quarta16, 2);
    expect(datas.map((d) => d.getDate())).toEqual([18, 25]);
  });

  test("quantidade zero retorna lista vazia", () => {
    expect(proximasDatasDoDia("Segunda", new Date(2026, 8, 14), 0)).toEqual([]);
  });
});

describe("findSessaoAtual", () => {
  const config = makeConfig();
  const turmas = Array.from({ length: 10 }, (_, i) => makeTurma(`t${i}`, 25));
  const assignments = buildWeeklySchedule(turmas, config);

  test("retorna null fora do horário de aula", () => {
    expect(findSessaoAtual(assignments, config, new Date(2026, 8, 20, 10, 0, 0))).toBeNull(); // domingo
    expect(findSessaoAtual(assignments, config, new Date(2026, 8, 14, 3, 0, 0))).toBeNull(); // madrugada de segunda
    expect(findSessaoAtual(assignments, config, new Date(2026, 8, 14, 12, 30, 0))).toBeNull(); // intervalo
  });

  test("dentro do horário retorna a sessão e a contagem regressiva certas", () => {
    const segunda0810 = new Date(2026, 8, 14, 8, 10, 0);
    const sessao = findSessaoAtual(assignments, config, segunda0810);
    expect(sessao).not.toBeNull();
    expect(sessao!.assignment.dia).toBe("Segunda");
    expect(sessao!.subBloco.inicio).toBe("08:00");
    expect(sessao!.subBloco.fim).toBe("08:30");
    expect(sessao!.segundosRestantes).toBe(20 * 60);
  });
});

describe("formatCountdown", () => {
  test("formata segundos como mm:ss", () => {
    expect(formatCountdown(90)).toBe("01:30");
    expect(formatCountdown(5)).toBe("00:05");
    expect(formatCountdown(0)).toBe("00:00");
  });
});

describe("currentWeekdayLabel", () => {
  test("mapeia o dia da semana em português", () => {
    expect(currentWeekdayLabel(new Date(2026, 8, 14))).toBe("Segunda");
    expect(currentWeekdayLabel(new Date(2026, 8, 20))).toBe("Domingo");
  });
});

describe("encontrarHorariosParaReprogramar", () => {
  test("nunca devolve horário da própria turma nem tira a única aula de outra", async () => {
    const { encontrarHorariosParaReprogramar } = await import("@/lib/schedule-engine");
    const config = makeConfig();
    const turmas = ["A", "B", "C", "D"].map((id) => makeTurma(id, 14));
    const desde = new Date(2026, 8, 21, 7, 0); // segunda, antes da aula
    const semana = buildWeeklySchedule(turmas, config, getWeekIndex(desde));
    const opcoes = encontrarHorariosParaReprogramar(turmas, config, "A", desde);
    expect(opcoes.length).toBeGreaterThan(0);
    for (const o of opcoes) {
      expect(o.turmaDeslocada?.id).not.toBe("A");
      if (o.tipo === "extra") {
        const aulas = semana.filter((a) => a.turma.id === o.turmaDeslocada?.id).length;
        expect(aulas).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test("um horário suspenso vira horário livre", async () => {
    const { encontrarHorariosParaReprogramar, suspensaoKey } =
      await import("@/lib/schedule-engine");
    const turmas = ["A", "B"].map((id) => makeTurma(id, 7));
    const base = makeConfig({
      diasSemana: ["Segunda"],
      horaFim: "10:00",
      intervaloInicio: "12:00",
      intervaloFim: "13:00",
    });
    const desde = new Date(2026, 8, 21, 7, 0);
    const config = {
      ...base,
      suspensoes: { [suspensaoKey("2026-09-21", "Segunda", "09:00")]: true as const },
    };
    const opcoes = encontrarHorariosParaReprogramar(turmas, config, "A", desde);
    expect(opcoes[0]?.tipo).toBe("livre");
    expect(opcoes[0]?.slot.inicio).toBe("09:00");
  });
});
