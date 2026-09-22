import type {
  Aluno,
  Assignment,
  GrupoMisto,
  Presenca,
  ScheduleConfig,
  Slot,
  Turma,
} from "@/lib/types";

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Builds the daily time slots (e.g. 08:00-09:00), skipping the lunch break
 * and, when configured, the morning recess too.
 *
 * Rather than just discarding a slot that overlaps a break and continuing
 * the fixed grid, the cursor jumps straight to the break's end — so the
 * first class after lunch starts exactly when the break is over (e.g.
 * 13:10 after a break that ends at 13:10) instead of waiting idle until the
 * next round hour. That's what keeps the day humane: no slot ever starts
 * before kids have actually had time to eat, rest and settle back in.
 */
export function buildDailySlots(config: ScheduleConfig): Slot[] {
  const slots: Slot[] = [];
  const end = toMinutes(config.horaFim);
  const step = config.duracaoSlotMinutos;

  const pausas = [
    { inicio: toMinutes(config.intervaloInicio), fim: toMinutes(config.intervaloFim) },
    ...(config.recreioInicio && config.recreioFim
      ? [{ inicio: toMinutes(config.recreioInicio), fim: toMinutes(config.recreioFim) }]
      : []),
  ].sort((a, b) => a.inicio - b.inicio);

  let cursor = toMinutes(config.horaInicio);
  while (cursor + step <= end) {
    const slotEnd = cursor + step;
    const pausaSobreposta = pausas.find((p) => cursor < p.fim && slotEnd > p.inicio);
    if (pausaSobreposta) {
      cursor = pausaSobreposta.fim;
      continue;
    }
    slots.push({ inicio: toHHMM(cursor), fim: toHHMM(slotEnd) });
    cursor = slotEnd;
  }
  return slots;
}

/** Key used to look up a manual override or suspension for a fixed weekly slot. */
export function slotKey(dia: string, slotInicio: string): string {
  return `${dia}|${slotInicio}`;
}

/** Key used to look up a one-off suspension of a specific date's session. */
export function suspensaoKey(dateISO: string, dia: string, slotInicio: string): string {
  return `${dateISO}|${slotKey(dia, slotInicio)}`;
}

/**
 * Applies any date-specific turma exceptions (`config.excecoesPorData`) to a
 * list of assignments, swapping in the override turma for the slots that
 * match `dateISO` exactly — every other day/slot is left untouched, so the
 * exception naturally only affects that one calendar date.
 */
export function aplicarExcecoesDeData(
  assignments: Assignment[],
  config: ScheduleConfig,
  turmas: Turma[],
  dateISO: string,
): Assignment[] {
  const excecoes = config.excecoesPorData;
  if (!excecoes) return assignments;
  const turmasById = new Map(turmas.map((t) => [t.id, t]));
  return assignments.map((a) => {
    const turmaId = excecoes[suspensaoKey(dateISO, a.dia, a.slot.inicio)];
    const turma = turmaId ? turmasById.get(turmaId) : undefined;
    return turma ? { ...a, turma } : a;
  });
}

/**
 * Assigns one turma to each day+slot. Every turma first gets exactly one
 * fixed "base" session — same day, same time, every single week, like a
 * real timetable — filled in size order (largest first) across the first
 * `turmas.length` positions of the week (Monday morning first, and so on).
 *
 * When the week has more slots than turmas, the leftover ones become a
 * shared "bonus" pool: a handful of turmas get a 2nd weekly session on top
 * of their base one. Which turmas get it rotates by `weekIndex` — shifted
 * by the pool's own size each week, so e.g. 5 leftover slots among 10
 * turmas cleanly alternate between the two halves every week, and everyone
 * ends up with an equal number of bonus sessions over just two weeks.
 * Unlike the base sessions, a turma's bonus session (if any) can land on a
 * different day each time it comes around — but it always falls on one of
 * the leftover positions, which sit at the end of the week, so it never
 * collides with anyone's base day.
 *
 * The administrator can override individual slots from the Programação page
 * (`config.slotOverrides`); those take precedence over the automatic rotation.
 */
export function buildWeeklySchedule(
  turmas: Turma[],
  config: ScheduleConfig,
  weekIndex = 0,
): Assignment[] {
  if (turmas.length === 0) return [];
  const slots = buildDailySlots(config);
  const turmasById = new Map(turmas.map((t) => [t.id, t]));
  const turmasPorTamanho = [...turmas].sort((a, b) => b.alunos.length - a.alunos.length);
  const n = turmasPorTamanho.length;

  const posicoes: { dia: string; diaIndex: number; slot: Slot }[] = [];
  config.diasSemana.forEach((dia, diaIndex) => {
    slots.forEach((slot) => posicoes.push({ dia, diaIndex, slot }));
  });

  interface Pending {
    dia: string;
    diaIndex: number;
    slot: Slot;
    turma: Turma;
    conteudo?: string | undefined;
    grupoIdFixo?: string | undefined;
    misto?: GrupoMisto[] | undefined;
  }
  const pending: Pending[] = [];

  // As trocas manuais (Programação) ganham de qualquer posição, base ou não
  // — por isso são resolvidas primeiro, e a posição sai da lista de "livres"
  // usada pelo rodízio automático. Sem isso, uma troca ocupando o que seria
  // a sessão-base de uma turma a deixava sem NENHUMA sessão naquela semana
  // (o rodízio automático continuava contando com ela como se tivesse
  // recebido a sessão que, na prática, foi pro override).
  const posicoesComIndice = posicoes.map((p, index) => ({ ...p, index }));
  const overriddenIndices = new Set<number>();
  for (const p of posicoesComIndice) {
    const overrideId = config.slotOverrides?.[slotKey(p.dia, p.slot.inicio)];
    if (!overrideId) continue;
    overriddenIndices.add(p.index);
    const turma = turmasById.get(overrideId);
    if (turma) pending.push({ dia: p.dia, diaIndex: p.diaIndex, slot: p.slot, turma });
  }
  const qtdTrocasManuais = pending.length;
  const livresFixas = posicoesComIndice.filter((p) => !overriddenIndices.has(p.index));

  // Rodízio de horários (opcional): gira a grade inteira a cada semana. O
  // passo é "um dia e um horário" (slots do dia + 1), então a turma que teve
  // aula segunda 07:30 vai para terça 09:15, depois quarta 13:15… e passa por
  // todos os dias e pelos dois turnos. Semanas anteriores ao início ficam como
  // estavam, para não mexer em reposições já marcadas.
  const semanasDeRotacao = config.rotacaoHorarios
    ? weekIndex - getWeekIndex(new Date(`${config.rotacaoHorarios.aPartirDe}T12:00:00`))
    : -1;
  let livres = livresFixas;
  if (semanasDeRotacao > 0 && livresFixas.length > 0) {
    const total = livresFixas.length;
    let passo = slots.length + 1;
    const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b));
    while (mdc(passo, total) !== 1) passo += 1;
    const k = (semanasDeRotacao * passo) % total;
    livres = [...livresFixas.slice(k), ...livresFixas.slice(0, k)];
  }

  const baseSessoesPorTurma = n > 0 ? Math.floor(livres.length / n) : 0;
  const totalBase = baseSessoesPorTurma * n;
  for (let i = 0; i < totalBase; i += 1) {
    const p = livres[i]!;
    const turma = turmasPorTamanho[i % n];
    if (turma) pending.push({ dia: p.dia, diaIndex: p.diaIndex, slot: p.slot, turma });
  }

  // Com só `numeroComputadores` máquinas, uma turma grande (ex.: 24-27
  // alunos, 7 por grupo) pode precisar de mais grupos do que cabem numa
  // única visita de `baseSessoesPorTurma` sessões. Descobre, turma por
  // turma, quantos grupos ficariam de fora só com a(s) sessão(ões)-base da
  // semana — e quais índices de grupo são esses (mesma fórmula de rotação
  // de `buildSubBlocos`, pra bater exatamente com o que a base já cobre).
  // `baseSessoesPorTurma` vale igual pra toda turma (rodízio uniforme sobre
  // as posições livres), então o cálculo abaixo reflete a semana real.
  const roundsPorVisita = gruposPorVisita(config);
  const filaMisto: GrupoMisto[] = [];
  for (const turma of turmasPorTamanho) {
    const totalGrupos = buildGrupos(turma, config).length;
    const baseRounds = baseSessoesPorTurma * roundsPorVisita;
    if (baseRounds >= totalGrupos) continue;
    const cobertos = new Set<number>();
    for (let s = 0; s < baseSessoesPorTurma; s += 1) {
      const inicioGrupo = (weekIndex + s * roundsPorVisita) % totalGrupos;
      for (let i = 0; i < roundsPorVisita; i += 1) cobertos.add((inicioGrupo + i) % totalGrupos);
    }
    for (let g = 0; g < totalGrupos; g += 1) {
      if (!cobertos.has(g)) filaMisto.push({ turma, grupoIndice: g });
    }
  }

  // As posições livres que sobram do rodízio-base primeiro tapam esses
  // buracos (um horário "misto" reúne o grupo que faltou de até
  // `roundsPorVisita` turmas diferentes, 30 min cada). Só o que sobrar
  // depois disso vira bônus (2ª sessão inteira, como antes) ou fica mesmo
  // livre — reserva natural pra reposição de falta.
  const restantes = livres.slice(totalBase);
  const posicoesParaMisto =
    roundsPorVisita > 0
      ? Math.min(restantes.length, Math.ceil(filaMisto.length / roundsPorVisita))
      : 0;
  let filaIdx = 0;
  for (let i = 0; i < posicoesParaMisto; i += 1) {
    const p = restantes[i]!;
    const misto: GrupoMisto[] = [];
    for (let k = 0; k < roundsPorVisita && filaIdx < filaMisto.length; k += 1) {
      misto.push(filaMisto[filaIdx]!);
      filaIdx += 1;
    }
    pending.push({ dia: p.dia, diaIndex: p.diaIndex, slot: p.slot, turma: misto[0]!.turma, misto });
  }

  const paraBonus = restantes.slice(posicoesParaMisto);
  const inicioBonus = paraBonus.length > 0 ? (weekIndex * paraBonus.length) % n : 0;
  paraBonus.forEach((p, idx) => {
    const turma = turmasPorTamanho[(inicioBonus + idx) % n];
    if (turma) pending.push({ dia: p.dia, diaIndex: p.diaIndex, slot: p.slot, turma });
  });
  // Qualquer posição além dessas fica mesmo livre (célula vazia na grade) —
  // não sobra nenhuma neste ponto, mas o corte acima é sempre seguro.

  // Dias indisponíveis (`config.diasIndisponiveis`): se o rodízio pôs uma
  // turma num dia em que ela não pode vir ao laboratório (ex.: 5º anos às
  // terças e quartas, por causa do caderno do IDEB), troca o horário inteiro
  // com o de outro dia que sirva para as duas turmas envolvidas. Só mexe em
  // posições automáticas — trocas manuais continuam valendo como estão.
  const automaticos = pending.slice(qtdTrocasManuais);
  repararDiasIndisponiveis(automaticos, config, weekIndex);

  // Aulas cadastradas manualmente na tela "Aulas" têm prioridade: substituem
  // o horário equivalente do rodízio automático ou entram como horário novo.
  for (const aula of config.aulas ?? []) {
    const turma = turmasById.get(aula.turmaId);
    if (!turma) continue;
    const diaIndex = Math.max(0, config.diasSemana.indexOf(aula.dia));
    const slot: Slot = { inicio: aula.inicio, fim: aula.fim };
    const existente = pending.findIndex((p) => p.dia === aula.dia && p.slot.inicio === aula.inicio);
    const item: Pending = {
      dia: aula.dia,
      diaIndex,
      slot,
      turma,
      conteudo: aula.conteudo,
      grupoIdFixo: aula.grupoId,
    };
    if (existente >= 0) pending[existente] = item;
    else pending.push(item);
  }

  // Session counts are derived from the final (post-override) assignments so
  // the group rotation in buildSubBlocos stays consistent for every turma.
  // Horários mistos ficam de fora dessa contagem: eles não são "mais uma
  // sessão" de nenhuma turma específica (o rodízio deles é resolvido
  // diretamente por `grupoIndice`, sem depender de ocorrenciaIndex).
  const normais = pending.filter((p) => !p.misto);
  const mistos = pending.filter((p) => p.misto);

  const occurrenceCount = new Map<string, number>();
  const normaisComOcorrencia = normais.map((p) => {
    const ocorrenciaIndex = occurrenceCount.get(p.turma.id) ?? 0;
    occurrenceCount.set(p.turma.id, ocorrenciaIndex + 1);
    return { ...p, ocorrenciaIndex, sessoesPorSemana: 0 };
  });
  const normaisFinal = normaisComOcorrencia.map((assignment) => ({
    ...assignment,
    sessoesPorSemana: normaisComOcorrencia.filter((a) => a.turma.id === assignment.turma.id).length,
  }));
  const mistosFinal = mistos.map((p) => ({ ...p, ocorrenciaIndex: 0, sessoesPorSemana: 1 }));

  return [...normaisFinal, ...mistosFinal];
}

/** Dias configurados em `config.diasIndisponiveis` em que a turma não pode ter aula. */
export function turmaIndisponivelNoDia(
  config: ScheduleConfig,
  turmaId: string,
  dia: string,
  weekIndex?: number,
): boolean {
  const regra = config.diasIndisponiveis?.[turmaId];
  if (!regra?.dias.includes(dia)) return false;
  if (!regra.aPartirDe || weekIndex === undefined) return true;
  return weekIndex >= getWeekIndex(new Date(`${regra.aPartirDe}T12:00:00`));
}

interface PosicaoTrocavel {
  dia: string;
  turma: Turma;
  misto?: GrupoMisto[] | undefined;
}

function turmasDaPosicao(p: PosicaoTrocavel): Turma[] {
  return p.misto ? p.misto.map((m) => m.turma) : [p.turma];
}

function cabeNoDia(
  p: PosicaoTrocavel,
  dia: string,
  config: ScheduleConfig,
  weekIndex: number,
): boolean {
  return turmasDaPosicao(p).every((t) => !turmaIndisponivelNoDia(config, t.id, dia, weekIndex));
}

/**
 * Troca o conteúdo (turma ou horário misto) de posições que caíram num dia
 * indisponível com o de outra posição, de outro dia, onde as duas turmas
 * possam ficar. Prefere trocas que não deixem a mesma turma duas vezes no
 * mesmo dia. Mexe nos objetos da lista in-place.
 */
function repararDiasIndisponiveis(
  posicoes: PosicaoTrocavel[],
  config: ScheduleConfig,
  weekIndex: number,
): void {
  if (!config.diasIndisponiveis) return;
  const repeteNoDia = (turmas: Turma[], dia: string, ignorar: PosicaoTrocavel[]) =>
    posicoes.some(
      (o) =>
        !ignorar.includes(o) &&
        o.dia === dia &&
        turmasDaPosicao(o).some((t) => turmas.some((x) => x.id === t.id)),
    );
  for (const p of posicoes) {
    if (cabeNoDia(p, p.dia, config, weekIndex)) continue;
    const candidatos = posicoes.filter(
      (o) =>
        o !== p &&
        o.dia !== p.dia &&
        cabeNoDia(p, o.dia, config, weekIndex) &&
        cabeNoDia(o, p.dia, config, weekIndex),
    );
    const semRepetir = candidatos.find(
      (o) =>
        !repeteNoDia(turmasDaPosicao(p), o.dia, [p, o]) &&
        !repeteNoDia(turmasDaPosicao(o), p.dia, [p, o]),
    );
    const alvo = semRepetir ?? candidatos[0];
    if (!alvo) continue;
    const { turma, misto } = p;
    p.turma = alvo.turma;
    p.misto = alvo.misto;
    alvo.turma = turma;
    alvo.misto = misto;
  }
}

export interface GrupoRevezamento {
  indice: number;
  alunos: Aluno[];
  nome?: string | undefined;
  conteudo?: string | undefined;
}

/**
 * Returns the rotating groups of a turma.
 *
 * When the administrator registered groups manually, those are used and each
 * student is placed in the group chosen in the admin panel. Otherwise the
 * students are split automatically by the number of computers available.
 */
export function buildGrupos(turma: Turma, config: ScheduleConfig): GrupoRevezamento[] {
  const cadastrados = turma.grupos ?? [];

  if (cadastrados.length > 0) {
    const grupos: GrupoRevezamento[] = cadastrados.map((grupo, indice) => ({
      indice,
      nome: grupo.nome,
      conteudo: grupo.conteudo,
      alunos: turma.alunos.filter((aluno) => aluno.grupoId === grupo.id),
    }));
    const semGrupo = turma.alunos.filter(
      (aluno) => !aluno.grupoId || !cadastrados.some((g) => g.id === aluno.grupoId),
    );
    if (semGrupo.length > 0) {
      grupos.push({ indice: grupos.length, nome: "Sem grupo definido", alunos: semGrupo });
    }
    return grupos;
  }

  const tamanho = Math.max(1, config.numeroComputadores);
  const grupos: GrupoRevezamento[] = [];
  for (let i = 0; i < turma.alunos.length; i += tamanho) {
    grupos.push({ indice: grupos.length, alunos: turma.alunos.slice(i, i + tamanho) });
  }
  if (grupos.length === 0) grupos.push({ indice: 0, alunos: [] });
  return grupos;
}

export interface SubBloco {
  indice: number;
  inicio: string;
  fim: string;
  grupo: GrupoRevezamento;
  /** Só definido num sub-bloco de horário misto: de qual turma é esse grupo (difere de `assignment.turma`). */
  turma?: Turma | undefined;
}

/**
 * Monotonically increasing week number, stable across every day of the same
 * school week (Monday-Sunday), used as the seed for cross-week rotation.
 */
export function getWeekIndex(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Splits one hour-long slot into rotating sub-blocks (e.g. two 30min turns).
 *
 * The starting group is offset by how many sub-blocks this turma has already
 * used earlier in the same week (`ocorrenciaIndex`), so a single week always
 * walks through consecutive groups without repeats until it wraps around.
 * On top of that, the whole week's pattern shifts by exactly one group per
 * calendar week (`weekIndex`) — deliberately *not* scaled by how many
 * sub-blocks the turma consumes per week, because when that number is an
 * exact multiple of the group count (e.g. 2 sessions x 2 sub-blocks = 4,
 * matching a turma with exactly 4 groups) a scaled offset cancels out modulo
 * the group count and the same groups get stuck in the same slot forever.
 * Shifting by a flat 1 has no such blind spot: it cycles through every
 * possible group-to-slot pairing over `grupos.length` weeks no matter the
 * weekly consumption, so no group of students is ever pinned to one fixed
 * day/time indefinitely.
 */
export function buildSubBlocos(
  assignment: Assignment,
  config: ScheduleConfig,
  weekIndex = 0,
): SubBloco[] {
  // Horário misto: cada fração é o grupo que sobrou de uma turma diferente —
  // não tem rodízio semanal pra calcular, a atribuição já é a definitiva.
  if (assignment.misto && assignment.misto.length > 0) {
    const inicioMisto = toMinutes(assignment.slot.inicio);
    const passoMisto = Math.max(1, config.duracaoGrupoMinutos);
    return assignment.misto.map((m, i) => {
      const gruposDaTurma = buildGrupos(m.turma, config);
      const grupo = gruposDaTurma[m.grupoIndice] ?? gruposDaTurma[0] ?? { indice: 0, alunos: [] };
      return {
        indice: i,
        inicio: toHHMM(inicioMisto + i * passoMisto),
        fim: toHHMM(inicioMisto + (i + 1) * passoMisto),
        grupo,
        turma: m.turma,
      };
    });
  }

  const todos = buildGrupos(assignment.turma, config);
  // Aula cadastrada com um grupo fixo: esse grupo ocupa o horário inteiro.
  const fixo = assignment.grupoIdFixo
    ? todos.filter((g) =>
        (assignment.turma.grupos ?? []).some(
          (cad) => cad.id === assignment.grupoIdFixo && cad.nome === g.nome,
        ),
      )
    : [];
  const grupos = fixo.length > 0 ? fixo : todos;
  const inicio = toMinutes(assignment.slot.inicio);
  const fim = toMinutes(assignment.slot.fim);
  const passo = Math.max(1, config.duracaoGrupoMinutos);
  const totalSubBlocos = Math.max(1, Math.round((fim - inicio) / passo));
  const subBlocos: SubBloco[] = [];

  const startGrupo = (weekIndex + assignment.ocorrenciaIndex * totalSubBlocos) % grupos.length;
  for (let i = 0; i < totalSubBlocos; i += 1) {
    const grupo = grupos[(startGrupo + i) % grupos.length];
    if (!grupo) continue;
    subBlocos.push({
      indice: i,
      inicio: toHHMM(inicio + i * passo),
      fim: toHHMM(Math.min(fim, inicio + (i + 1) * passo)),
      grupo,
    });
  }
  return subBlocos;
}

/** How many 30-min rotation groups fit inside one turma visit, given its slot length. */
export function gruposPorVisita(config: ScheduleConfig): number {
  return Math.max(1, Math.round(config.duracaoSlotMinutos / config.duracaoGrupoMinutos));
}

export interface SelecaoDoDia {
  grupos: GrupoRevezamento[];
  totalSelecionado: number;
}

/**
 * Escolhe quem vai ao laboratório hoje com base em frequência real: os
 * alunos que estão há mais tempo sem participar (ou nunca participaram) vêm
 * primeiro. Retorna até `tamanhoGrupo * numGrupos` alunos, divididos em
 * `numGrupos` grupos (uma turma que caiba em menos grupos ainda funciona,
 * com grupos menores). `numGrupos` deve refletir quantos blocos de rodízio
 * cabem no horário da turma (`duracaoSlotMinutos / duracaoGrupoMinutos`) —
 * passar um valor fixo faria a prévia/chamada ignorar aulas mais longas.
 * Isso substitui o rodízio puramente matemático de `buildGrupos` quando o
 * histórico de presença (tabela `presencas`) está disponível — ele se
 * autoajusta a faltas, feriados e substituições sem precisar de reset.
 */
export function selecionarAlunosDoDia(
  turma: Turma,
  ultimaParticipacao: Map<string, string>,
  tamanhoGrupo: number,
  numGrupos = 2,
): SelecaoDoDia {
  const tamanho = Math.max(1, tamanhoGrupo);
  const grupos_qtd = Math.max(1, numGrupos);
  const ordenados = turma.alunos
    .filter((aluno) => !aluno.impedido)
    .sort((a, b) => {
      const da = ultimaParticipacao.get(a.id) ?? "";
      const db = ultimaParticipacao.get(b.id) ?? "";
      return da.localeCompare(db);
    });
  const selecionados = ordenados.slice(0, tamanho * grupos_qtd);
  const grupos: GrupoRevezamento[] = [];
  for (let i = 0; i < selecionados.length; i += tamanho) {
    grupos.push({ indice: grupos.length, alunos: selecionados.slice(i, i + tamanho) });
  }
  if (grupos.length === 0) grupos.push({ indice: 0, alunos: [] });
  return { grupos, totalSelecionado: selecionados.length };
}

/**
 * Turns a day's `presencas` rows into display groups — the same shape
 * `selecionarAlunosDoDia` produces, but reflecting whatever was actually
 * registered for that date (including any manual exception with fewer
 * students, or substitutions already applied) instead of a fresh
 * recalculation.
 */
export function gruposFromPresencas(turma: Turma, presencas: Presenca[]): GrupoRevezamento[] {
  const porGrupo = new Map<number, Aluno[]>();
  for (const p of presencas) {
    if (p.status === "faltou") continue;
    const aluno: Aluno = turma.alunos.find((a) => a.id === p.alunoId) ?? {
      id: p.alunoId,
      nome: p.alunoNome,
    };
    const lista = porGrupo.get(p.grupoIndice) ?? [];
    lista.push(aluno);
    porGrupo.set(p.grupoIndice, lista);
  }
  return [...porGrupo.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([indice, alunos]) => ({ indice, alunos }));
}

/**
 * Escolhe o próximo aluno mais justo para substituir um faltoso: entre os
 * que ainda não foram chamados hoje, o que está há mais tempo sem
 * participar. O aluno que faltou mantém sua prioridade antiga (não é
 * marcado como tendo participado), então volta a ser chamado antes dos
 * demais na próxima aula.
 */
export function escolherSubstituto(
  turma: Turma,
  ultimaParticipacao: Map<string, string>,
  jaChamadosHojeIds: ReadonlySet<string>,
): Aluno | null {
  const candidatos = turma.alunos
    .filter((aluno) => !jaChamadosHojeIds.has(aluno.id) && !aluno.impedido)
    .sort((a, b) => {
      const da = ultimaParticipacao.get(a.id) ?? "";
      const db = ultimaParticipacao.get(b.id) ?? "";
      return da.localeCompare(db);
    });
  return candidatos[0] ?? null;
}

export interface MovimentoCascata {
  alunoId: string;
  alunoNome: string;
  /** Grupo para onde o aluno vai. */
  grupoIndice: number;
  /** Grupo em que estava antes (null: entrou de fora da chamada do dia). */
  grupoOriginal: number | null;
}

/**
 * Substituição em cascata: quem faltou no grupo `g` é substituído pelo 1º
 * aluno do grupo seguinte; o buraco que ele deixa é tapado pelo 1º do grupo
 * depois dele, e assim por diante. O último buraco fica com `deFora` (o
 * próximo da fila, ainda não chamado hoje). O primeiro movimento é quem
 * entra no lugar de quem faltou.
 */
export function planejarCascata(
  presencas: Presenca[],
  grupoIndice: number,
  deFora: Aluno | null,
): MovimentoCascata[] {
  const ativos = presencas.filter((p) => p.status !== "faltou");
  const gruposSeguintes = [...new Set(ativos.map((p) => p.grupoIndice))]
    .filter((g) => g > grupoIndice)
    .sort((a, b) => a - b);
  const movimentos: MovimentoCascata[] = [];
  let buraco = grupoIndice;
  for (const g of gruposSeguintes) {
    const primeiro = ativos.find((p) => p.grupoIndice === g);
    if (!primeiro) continue;
    movimentos.push({
      alunoId: primeiro.alunoId,
      alunoNome: primeiro.alunoNome,
      grupoIndice: buraco,
      grupoOriginal: g,
    });
    buraco = g;
  }
  if (deFora) {
    movimentos.push({ alunoId: deFora.id, alunoNome: deFora.nome, grupoIndice: buraco, grupoOriginal: null });
  }
  return movimentos;
}

/**
 * Como `buildSubBlocos`, mas usa os grupos já definidos pela chamada do dia
 * (seleção justa + eventuais substituições) em vez de recalculá-los pelo
 * rodízio semanal.
 */
export function buildSubBlocosComGrupos(
  assignment: Assignment,
  config: ScheduleConfig,
  grupos: GrupoRevezamento[],
): SubBloco[] {
  const inicio = toMinutes(assignment.slot.inicio);
  const fim = toMinutes(assignment.slot.fim);
  const passo = Math.max(1, config.duracaoGrupoMinutos);
  const totalSubBlocos = Math.max(1, Math.round((fim - inicio) / passo));
  const subBlocos: SubBloco[] = [];
  for (let i = 0; i < totalSubBlocos; i += 1) {
    const grupo = grupos[i % grupos.length];
    if (!grupo) continue;
    subBlocos.push({
      indice: i,
      inicio: toHHMM(inicio + i * passo),
      fim: toHHMM(Math.min(fim, inicio + (i + 1) * passo)),
      grupo,
    });
  }
  return subBlocos;
}

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function currentWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()] ?? "";
}

export interface SessaoAtual {
  assignment: Assignment;
  subBloco: SubBloco;
  segundosRestantes: number;
  proximoSubBloco?: SubBloco | undefined;
  /** True when the administrator stopped this specific session for today. */
  suspensa: boolean;
}

/** Formats a Date as the `YYYY-MM-DD` key used to identify "today" for suspensions. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Materializa, como `Assignment`s sintéticos, as reprogramações cuja nova
 * data cai em `data` — para que o cronômetro ao vivo, a agenda pública e o
 * modo TV enxerguem a aula movida sem precisar de nenhuma lógica própria.
 */
export function reprogramacoesParaData(
  turmas: Turma[],
  config: ScheduleConfig,
  data: Date,
): Assignment[] {
  const dataKey = toDateKey(data);
  const dia = currentWeekdayLabel(data);
  const turmasById = new Map(turmas.map((t) => [t.id, t]));
  const resultado: Assignment[] = [];
  for (const r of config.reprogramacoes ?? []) {
    if (r.dataNova !== dataKey) continue;
    const turma = turmasById.get(r.turmaId);
    if (!turma) continue;
    resultado.push({
      dia,
      diaIndex: Math.max(0, config.diasSemana.indexOf(dia)),
      slot: { inicio: r.inicio, fim: r.fim },
      turma,
      ocorrenciaIndex: 0,
      sessoesPorSemana: 1,
      conteudo: r.conteudo,
    });
  }
  return resultado;
}

/** Finds the class session (if any) happening right now, and the live countdown. */
export function findSessaoAtual(
  assignments: Assignment[],
  config: ScheduleConfig,
  now: Date,
  extras: Assignment[] = [],
): SessaoAtual | null {
  const dia = currentWeekdayLabel(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowSeconds = nowMinutes * 60 + now.getSeconds();

  const assignment = [...extras, ...assignments].find((a) => {
    if (a.dia !== dia) return false;
    const start = toMinutes(a.slot.inicio);
    const end = toMinutes(a.slot.fim);
    return nowMinutes >= start && nowMinutes < end;
  });
  if (!assignment) return null;

  // Uma reposição (extra) ocupa justamente um horário marcado como suspenso
  // — o da turma que cedeu a vez. A suspensão vale para a aula original, não
  // para a reposição que entrou no lugar.
  const ehReposicao = extras.includes(assignment);
  const suspensa =
    !ehReposicao &&
    Boolean(config.suspensoes?.[suspensaoKey(toDateKey(now), dia, assignment.slot.inicio)]);

  const subBlocos = buildSubBlocos(assignment, config, getWeekIndex(now));
  const subBlocoIndex = subBlocos.findIndex((sb) => {
    const start = toMinutes(sb.inicio) * 60;
    const end = toMinutes(sb.fim) * 60;
    return nowSeconds >= start && nowSeconds < end;
  });
  const subBloco = subBlocos[subBlocoIndex] ?? subBlocos[0];
  if (!subBloco) return null;

  const fimSegundos = toMinutes(subBloco.fim) * 60;
  const segundosRestantes = Math.max(0, fimSegundos - nowSeconds);
  const proximoSubBloco = subBlocos[subBlocoIndex + 1];

  return { assignment, subBloco, segundosRestantes, proximoSubBloco, suspensa };
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function nextAssignmentsForDay(assignments: Assignment[], dia: string): Assignment[] {
  return assignments
    .filter((a) => a.dia === dia)
    .sort((a, b) => toMinutes(a.slot.inicio) - toMinutes(b.slot.inicio));
}

export interface ProximoDiaLetivo {
  data: Date;
  dia: string;
}

/**
 * Finds the next day (starting tomorrow, looking up to two weeks ahead) that
 * is one of the school's configured weekdays — so the homepage can show
 * professors which turmas are coming up, even across a weekend.
 */
export function proximoDiaLetivo(config: ScheduleConfig, from: Date): ProximoDiaLetivo | null {
  if (config.diasSemana.length === 0) return null;
  for (let i = 1; i <= 14; i += 1) {
    const data = new Date(from);
    data.setDate(data.getDate() + i);
    const dia = currentWeekdayLabel(data);
    if (config.diasSemana.includes(dia)) return { data, dia };
  }
  return null;
}

/** Nearest calendar date (today or the next 6 days) matching a given weekday label. */
export function proximaDataDoDia(dia: string, from: Date): Date {
  for (let i = 0; i < 7; i += 1) {
    const data = new Date(from);
    data.setDate(data.getDate() + i);
    if (currentWeekdayLabel(data) === dia) return data;
  }
  return from;
}

/**
 * Next `quantidade` real calendar dates for a given weekday label, one per
 * week starting from the nearest match — e.g. for "Segunda" a partir de
 * hoje: [22/09, 29/09, 06/10, ...]. Used to show the public exactly which
 * dates a turma's weekly slot falls on next, not just the recurring weekday
 * name.
 */
export function proximasDatasDoDia(dia: string, from: Date, quantidade: number): Date[] {
  const primeira = proximaDataDoDia(dia, from);
  return Array.from({ length: Math.max(0, quantidade) }, (_, i) => {
    const data = new Date(primeira);
    data.setDate(data.getDate() + i * 7);
    return data;
  });
}

export interface HorarioReprogramacao {
  data: Date;
  dataKey: string;
  dia: string;
  slot: Slot;
  /**
   * "livre": ninguém usa o laboratório nesse horário.
   * "extra": o horário é a sessão extra de outra turma (que já tem outra aula
   * na mesma semana) — ela cede a vez, mas continua com a sessão principal.
   */
  tipo: "livre" | "extra";
  /** Turma que cede a sessão extra, quando `tipo` é "extra". */
  turmaDeslocada?: Turma | undefined;
}

/**
 * Procura, a partir de `desde`, os próximos horários em que uma turma que
 * perdeu a aula pode ser reprogramada — sem tirar de nenhuma turma a sua
 * única aula da semana. Primeiro os horários livres; depois as sessões
 * extras de turmas que já têm outra aula na semana. Horários mistos, já
 * suspensos, já reprogramados ou da própria turma ficam de fora.
 */
export function encontrarHorariosParaReprogramar(
  turmas: Turma[],
  config: ScheduleConfig,
  turmaId: string,
  desde: Date,
  quantidade = 6,
  diasAFrente = 21,
): HorarioReprogramacao[] {
  const slots = buildDailySlots(config);
  const agoraMin = desde.getHours() * 60 + desde.getMinutes();
  const livres: HorarioReprogramacao[] = [];
  const extras: HorarioReprogramacao[] = [];

  for (let i = 0; i <= diasAFrente; i += 1) {
    const data = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
    const dia = currentWeekdayLabel(data);
    if (!config.diasSemana.includes(dia)) continue;
    if (turmaIndisponivelNoDia(config, turmaId, dia, getWeekIndex(data))) continue;
    const dataKey = toDateKey(data);
    const semana = aplicarExcecoesDeData(
      buildWeeklySchedule(turmas, config, getWeekIndex(data)),
      config,
      turmas,
      dataKey,
    );
    const doDia = semana.filter((a) => a.dia === dia);
    const reprogramadas = reprogramacoesParaData(turmas, config, data);

    for (const slot of slots) {
      if (i === 0 && toMinutes(slot.inicio) <= agoraMin) continue;
      const ini = toMinutes(slot.inicio);
      const fim = toMinutes(slot.fim);
      const sobrepoe = (s: Slot) => toMinutes(s.inicio) < fim && toMinutes(s.fim) > ini;
      if (reprogramadas.some((r) => sobrepoe(r.slot))) continue;

      const ocupante = doDia.find((a) => sobrepoe(a.slot));
      const suspenso = ocupante
        ? Boolean(config.suspensoes?.[suspensaoKey(dataKey, dia, ocupante.slot.inicio)])
        : false;

      if (!ocupante || suspenso) {
        livres.push({ data, dataKey, dia, slot, tipo: "livre" });
        continue;
      }
      if (ocupante.misto || ocupante.turma.id === turmaId) continue;
      const aulasDaTurmaNaSemana = semana.filter(
        (a) => !a.misto && a.turma.id === ocupante.turma.id,
      ).length;
      if (aulasDaTurmaNaSemana >= 2 && ocupante.ocorrenciaIndex > 0) {
        extras.push({ data, dataKey, dia, slot, tipo: "extra", turmaDeslocada: ocupante.turma });
      }
    }
  }

  const porData = (a: HorarioReprogramacao, b: HorarioReprogramacao) =>
    a.dataKey.localeCompare(b.dataKey) || toMinutes(a.slot.inicio) - toMinutes(b.slot.inicio);
  // O mais cedo possível; no mesmo horário, um livre vale mais que deslocar alguém.
  return [...livres, ...extras]
    .sort((a, b) => porData(a, b) || (a.tipo === b.tipo ? 0 : a.tipo === "livre" ? -1 : 1))
    .slice(0, quantidade);
}
