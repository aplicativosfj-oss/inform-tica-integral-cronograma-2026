import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Calculator,
  Info,
  Users2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { turmasDisponiveis } from "@/lib/diagnostica/analise";
import {
  FAIXAS,
  faixaDe,
  mapaDaTurma,
  type AlunoNoMapa,
  type EixoDoMapa,
  type Faixa,
} from "@/lib/diagnostica/mapa";
import type { ProvaII } from "@/lib/diagnostica/tipos";
import { cn } from "@/lib/utils";

/**
 * Mapa de classe por turma — a turma desenhada, em vez de tabelada.
 *
 * São dois mapas sobre a mesma sala: um de leitura e escrita e um de
 * matemática. Cada criança é uma carteira, pintada pela faixa em que ficou,
 * e abaixo vêm os eixos de conteúdo da prova, do mais frágil para o mais
 * forte. A comparação com a avaliação anterior fica no alto, no nível da
 * turma — que é o único nível em que ela existe (a I Avaliação não traz
 * aluno, só o fechamento da turma).
 */

const CORES_FAIXA: Record<
  Faixa,
  { carteira: string; texto: string; barra: string; ponto: string }
> = {
  apoio: {
    carteira: "fill-rose-500/15 stroke-rose-500/60 dark:fill-rose-400/15 dark:stroke-rose-400/50",
    texto: "text-rose-700 dark:text-rose-300",
    barra: "bg-rose-500 dark:bg-rose-400",
    ponto: "bg-rose-500",
  },
  atencao: {
    carteira:
      "fill-amber-500/15 stroke-amber-500/60 dark:fill-amber-400/15 dark:stroke-amber-400/50",
    texto: "text-amber-800 dark:text-amber-300",
    barra: "bg-amber-500 dark:bg-amber-400",
    ponto: "bg-amber-500",
  },
  bom: {
    carteira: "fill-blue-500/15 stroke-blue-500/60 dark:fill-blue-400/15 dark:stroke-blue-400/50",
    texto: "text-blue-700 dark:text-blue-300",
    barra: "bg-blue-500 dark:bg-blue-400",
    ponto: "bg-blue-500",
  },
  otimo: {
    carteira:
      "fill-emerald-500/15 stroke-emerald-500/60 dark:fill-emerald-400/15 dark:stroke-emerald-400/50",
    texto: "text-emerald-700 dark:text-emerald-300",
    barra: "bg-emerald-500 dark:bg-emerald-400",
    ponto: "bg-emerald-500",
  },
};

const SEM_DADO = {
  carteira: "fill-muted stroke-border",
  texto: "text-muted-foreground",
  barra: "bg-muted-foreground/40",
  ponto: "bg-muted-foreground/40",
};

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;

/**
 * Uma carteira da sala: o desenho é o mesmo para todo mundo, só a cor muda.
 * O tampo leva o percentual porque a cor sozinha não serve a quem não
 * distingue vermelho de verde.
 */
function Carteira({ aluno, valor }: { aluno: AlunoNoMapa; valor: number | null }) {
  const faixa = faixaDe(valor);
  const c = faixa ? CORES_FAIXA[faixa.id] : SEM_DADO;
  const rotulo = `${aluno.nome}: ${valor == null ? "não fez esta prova" : `${Math.round(valor * 100)}% de acerto`}`;

  return (
    <li className="flex flex-col items-center gap-1" title={rotulo}>
      <svg viewBox="0 0 72 56" className="w-full max-w-[86px]" role="img" aria-label={rotulo}>
        {/* cadeira, atrás da carteira */}
        <rect x="26" y="2" width="20" height="12" rx="4" className={cn("stroke-2", c.carteira)} />
        {/* tampo */}
        <rect x="4" y="16" width="64" height="28" rx="6" className={cn("stroke-2", c.carteira)} />
        {/* pés */}
        <rect x="12" y="44" width="5" height="10" rx="2" className={cn("stroke-0", c.carteira)} />
        <rect x="55" y="44" width="5" height="10" rx="2" className={cn("stroke-0", c.carteira)} />
        <text
          x="36"
          y="34"
          textAnchor="middle"
          className={cn("fill-current text-[15px] font-bold", c.texto)}
        >
          {valor == null ? "—" : Math.round(valor * 100)}
        </text>
      </svg>
      <span className="w-full truncate text-center text-[11px] font-medium text-muted-foreground">
        {primeiroNome(aluno.nome)}
      </span>
    </li>
  );
}

/** O mapa da sala inteira, com o quadro na frente para orientar a leitura. */
function MapaDaSala({
  alunos,
  valorDe,
  vazio,
}: {
  alunos: AlunoNoMapa[];
  valorDe: (a: AlunoNoMapa) => number | null;
  vazio: string;
}) {
  const comDado = alunos.filter((a) => valorDe(a) != null);
  if (comDado.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {vazio}
      </p>
    );
  }

  // Quem foi pior vem na frente: é a fila que o professor olha primeiro.
  const ordenados = [...alunos].sort((a, b) => (valorDe(a) ?? 2) - (valorDe(b) ?? 2));

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="mx-auto mb-4 w-full max-w-md rounded-lg bg-foreground/85 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-background">
        Quadro · frente da sala
      </div>
      <ul className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-5 lg:grid-cols-6">
        {ordenados.map((a) => (
          <Carteira key={a.nome} aluno={a} valor={valorDe(a)} />
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        As carteiras estão em ordem de acerto — quem precisa de mais apoio vem primeiro, não é a
        posição real na sala.
      </p>
    </div>
  );
}

/** Legenda das quatro faixas, com a régua escrita por extenso. */
function LegendaFaixas({
  alunos,
  valorDe,
}: {
  alunos: AlunoNoMapa[];
  valorDe: (a: AlunoNoMapa) => number | null;
}) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {FAIXAS.map((f) => {
        const n = alunos.filter((a) => faixaDe(valorDe(a))?.id === f.id).length;
        return (
          <li key={f.id} className="flex items-center gap-2 text-sm">
            <span className={cn("size-3 shrink-0 rounded-sm", CORES_FAIXA[f.id].ponto)} />
            <span className="text-foreground">
              <b>{f.nome}</b>{" "}
              <span className="text-muted-foreground">
                ({f.explica}) — {n} {n === 1 ? "aluno" : "alunos"}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Eixos de conteúdo da prova, em barra, do mais frágil para o mais forte. */
function Eixos({ eixos, vazio }: { eixos: EixoDoMapa[]; vazio: string }) {
  if (eixos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {vazio}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {eixos.map((e) => {
        const faixa = faixaDe(e.acerto);
        const c = faixa ? CORES_FAIXA[faixa.id] : SEM_DADO;
        const Icone = e.dominio.icon;
        return (
          <li key={e.dominio.id} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card",
                c.texto,
              )}
            >
              <Icone className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {e.dominio.id}
                </span>
                <span className={cn("shrink-0 text-sm font-bold", c.texto)}>{pct(e.acerto)}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", c.barra)}
                  style={{ width: `${Math.max(2, Math.round(e.acerto * 100))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.questoes} {e.questoes === 1 ? "questão" : "questões"} da prova ·{" "}
                {e.dominio.expectativa}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Comparação com a avaliação anterior, no nível da turma. */
function Evolucao({
  rotulo,
  i,
  ii,
  delta,
}: {
  rotulo: string;
  i: number | null;
  ii: number | null;
  delta: number | null;
}) {
  const subiu = delta != null && delta > 0.005;
  const caiu = delta != null && delta < -0.005;
  const Seta = subiu ? ArrowUpRight : caiu ? ArrowDownRight : ArrowRight;
  const cor = subiu
    ? "text-emerald-700 dark:text-emerald-300"
    : caiu
      ? "text-rose-700 dark:text-rose-300"
      : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <p className="mt-1 flex items-baseline gap-1.5 text-sm text-muted-foreground">
          <span>{pct(i)}</span>
          <ArrowRight className="size-3.5 shrink-0" />
          <span className="text-xl font-bold text-foreground">{pct(ii)}</span>
        </p>
      </div>
      <span className={cn("flex shrink-0 items-center gap-1 text-sm font-bold", cor)}>
        <Seta className="size-4" />
        {delta == null ? "sem comparação" : `${delta > 0 ? "+" : ""}${Math.round(delta * 100)} pts`}
      </span>
    </div>
  );
}

export function MapaDaTurma({ provas }: { provas: ProvaII[] }) {
  const turmas = useMemo(() => turmasDisponiveis(provas), [provas]);
  const [chave, setChave] = useState(() =>
    turmas[0] ? `${turmas[0].ano}|${turmas[0].turma}` : "",
  );
  const [ano, turma] = chave.split("|");
  const mapa = useMemo(
    () => (chave ? mapaDaTurma(provas, Number(ano), turma ?? "") : null),
    [provas, chave, ano, turma],
  );

  if (!mapa) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhuma turma disponível nesta avaliação.
      </p>
    );
  }

  const evLP = mapa.evolucao.find((e) => e.disc === "LP");
  const evMAT = mapa.evolucao.find((e) => e.disc === "MAT");
  const alfabeticos = mapa.escrita?.filter((d) => d.alfabetico).reduce((s, d) => s + d.n, 0) ?? 0;
  const totalEscrita = mapa.escrita?.reduce((s, d) => s + d.n, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Abertura + escolha da turma */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Users2 className="size-3.5" /> Mapa de classe
            </span>
            <h2 className="mt-2.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              A turma desenhada, criança por criança
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Cada carteira é um aluno da turma, pintada pela faixa em que ele ficou na 2ª
              avaliação. Abaixo, os eixos de conteúdo que a prova cobrou, do mais frágil para o mais
              forte.
            </p>
          </div>
          <div className="shrink-0">
            <label
              htmlFor="mapa-turma"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground"
            >
              Turma
            </label>
            <Select value={chave} onValueChange={setChave}>
              <SelectTrigger id="mapa-turma" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={`${t.ano}|${t.turma}`} value={`${t.ano}|${t.turma}`}>
                    {t.ano}º ano {t.turma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Users2 className="size-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">{mapa.alunos.length}</p>
              <p className="text-xs text-muted-foreground">alunos na turma</p>
            </div>
          </div>
          <Evolucao
            rotulo="Português · 1ª → 2ª"
            i={evLP?.i ?? null}
            ii={evLP?.ii ?? mapa.turmaLP}
            delta={evLP?.delta ?? null}
          />
          <Evolucao
            rotulo="Matemática · 1ª → 2ª"
            i={evMAT?.i ?? null}
            ii={evMAT?.ii ?? mapa.turmaMAT}
            delta={evMAT?.delta ?? null}
          />
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />A comparação entre as duas avaliações existe
          só no total da turma: a 1ª avaliação chegou fechada por turma, sem resposta de aluno,
          então não há como dizer quanto cada criança avançou.
        </p>
      </section>

      {/* Mapa 1 — leitura e escrita */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex items-start gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-rose-400/35 bg-rose-500/15 text-rose-700 shadow-sm dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300">
              <BookOpenText className="size-6" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Mapa de leitura e escrita
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Como cada criança foi na prova de Língua Portuguesa e o que a turma já domina em
                leitura, escrita e interpretação.
              </p>
            </div>
          </div>

          <LegendaFaixas alunos={mapa.alunos} valorDe={(a) => a.lp} />
          <MapaDaSala
            alunos={mapa.alunos}
            valorDe={(a) => a.lp}
            vazio="Esta turma não tem prova de Língua Portuguesa com questões nesta avaliação — no 1º e no 2º ano, a leitura é feita pelo nível de escrita, logo abaixo."
          />

          {mapa.escrita ? (
            <div>
              <p className="mb-1 text-sm font-bold text-foreground">Escada da escrita</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Em que ponto da alfabetização cada criança está. {alfabeticos} de {totalEscrita} já
                escrevem de forma alfabética, ou seja, usando as letras certas para os sons que
                ouvem.
              </p>
              <ul className="flex flex-col-reverse gap-1.5">
                {mapa.escrita.map((d) => (
                  <li key={d.nivel} className="flex items-center gap-2.5">
                    <span className="w-8 shrink-0 text-center text-xs font-bold text-muted-foreground">
                      {d.nivel}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div
                        className={cn(
                          "h-7 rounded-md",
                          d.alfabetico
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-amber-500 dark:bg-amber-400",
                        )}
                        style={{
                          width: `${Math.max(6, Math.round((100 * d.n) / Math.max(1, totalEscrita)))}%`,
                        }}
                      />
                      <span className="shrink-0 text-sm font-bold text-foreground">{d.n}</span>
                      <span className="truncate text-xs text-muted-foreground">{d.nome}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="mb-3 text-sm font-bold text-foreground">
              Eixos de Língua Portuguesa cobrados na prova
            </p>
            <Eixos
              eixos={mapa.eixosLP}
              vazio="A prova desta turma não teve questões de Língua Portuguesa classificadas por eixo."
            />
          </div>
        </CardContent>
      </Card>

      {/* Mapa 2 — matemática */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex items-start gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-blue-400/35 bg-blue-500/15 text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300">
              <Calculator className="size-6" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Mapa de matemática
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Como cada criança foi na prova de Matemática e como a turma está nos eixos da prova
                — números, as quatro operações, medidas, geometria.
              </p>
            </div>
          </div>

          <LegendaFaixas alunos={mapa.alunos} valorDe={(a) => a.mat} />
          <MapaDaSala
            alunos={mapa.alunos}
            valorDe={(a) => a.mat}
            vazio="Esta turma não tem prova de Matemática nesta avaliação."
          />

          <div>
            <p className="mb-3 text-sm font-bold text-foreground">
              Eixos de Matemática cobrados na prova
            </p>
            <Eixos
              eixos={mapa.eixosMAT}
              vazio="A prova desta turma não teve questões de Matemática classificadas por eixo."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
