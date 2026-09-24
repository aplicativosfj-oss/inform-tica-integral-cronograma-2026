import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardList,
  Compass,
  Lightbulb,
  ListFilter,
  Sparkles,
  Target,
  Users2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoriaHero } from "@/components/school/categoria-hero";
import { AnelPercentual } from "@/components/school/diagnostica/graficos";
import {
  DESCRITORES_CATALOGO,
  DOMINIOS_USADOS,
  useDesempenhoReal,
  type Descritor,
} from "@/lib/descritores/catalogo";
import {
  NIVEIS,
  NOME_DISC,
  type Disciplina,
  type Nivel,
  type Serie,
} from "@/lib/recomposicao/catalogo";
import { cn } from "@/lib/utils";

const DISC_OPCOES: { id: Disciplina; nome: string }[] = [
  { id: "LP", nome: NOME_DISC.LP },
  { id: "MAT", nome: NOME_DISC.MAT },
  { id: "CN", nome: NOME_DISC.CN },
];
const SERIES: Serie[] = [1, 2, 3, 4, 5];

/** Faixa de acerto que cada nível representa, escrita no próprio botão para
 *  ninguém precisar adivinhar o que "Retomada" recorta. */
const ROTULO_FAIXA: Record<Nivel, string> = {
  retomada: "· abaixo de 50%",
  pratica: "· 50 a 74%",
  desafio: "· 75% ou mais",
};

function PillFiltro<T extends string>({
  valor,
  atual,
  rotulo,
  onClick,
  desativado,
}: {
  valor: T | "";
  atual: string;
  rotulo: string;
  onClick: () => void;
  desativado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
        atual === valor
          ? "border-transparent bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground",
        desativado && "cursor-not-allowed opacity-50 hover:text-muted-foreground",
      )}
    >
      {rotulo}
    </button>
  );
}

export function GuiaDescritores() {
  const desempenho = useDesempenhoReal();
  const [disc, setDisc] = useState<Disciplina | "">("");
  const [serie, setSerie] = useState<Serie | "">("");
  const [nivel, setNivel] = useState<Nivel | "">("");
  const [turma, setTurma] = useState("");

  /**
   * "Nível" aqui é o desempenho real, não a dificuldade da atividade: como
   * toda habilidade acaba ligada a atividades dos três níveis, filtrar por
   * `d.niveis` devolvia sempre as 120 — o botão não fazia nada. O que o
   * professor quer saber nesta tela é outra coisa: o que a turma já domina
   * e o que precisa ser retomado.
   */
  const FAIXA_NIVEL: Record<Nivel, [number, number]> = {
    retomada: [0, 0.5],
    pratica: [0.5, 0.75],
    desafio: [0.75, Infinity],
  };

  const acertoDe = useCallback(
    (d: Descritor): number | null => {
      if (!desempenho) return null;
      const pct = turma ? desempenho.porTurma.get(turma)?.get(d.id) : desempenho.rede.get(d.id);
      return pct == null ? null : pct / 100;
    },
    [desempenho, turma],
  );

  const temDesempenho = desempenho != null;

  const filtrados = useMemo(
    () =>
      DESCRITORES_CATALOGO.filter((d) => {
        if (disc && d.disc !== disc) return false;
        if (serie && !d.series.includes(serie)) return false;
        if (nivel) {
          const acerto = acertoDe(d);
          if (acerto == null) return false;
          const [min, max] = FAIXA_NIVEL[nivel];
          if (acerto < min || acerto >= max) return false;
        }
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disc, serie, nivel, acertoDe],
  );

  const porDominio = useMemo(() => {
    const mapa = new Map<string, Descritor[]>();
    for (const d of filtrados) {
      const lista = mapa.get(d.dominio.id) ?? [];
      lista.push(d);
      mapa.set(d.dominio.id, lista);
    }
    return mapa;
  }, [filtrados]);

  const dominiosComItens = DOMINIOS_USADOS.filter(
    (dom) => (porDominio.get(dom.id)?.length ?? 0) > 0,
  );

  return (
    <div>
      {/* Abertura compacta: dentro da aba o título da área já foi dado pela
        TabsList, então aqui basta situar o que a lista é e de onde ela vem. */}
      <section className="mb-4">
        <Badge className="mb-3 gap-1.5 rounded-full border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
          <Compass className="size-4" /> Guia da Avaliação Diagnóstica
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          O que cada habilidade espera da criança
        </h2>
        <p className="mt-2 max-w-3xl text-pretty text-sm text-muted-foreground sm:text-base">
          Todas as habilidades (descritores) cobradas na Avaliação Diagnóstica, organizadas por
          área: o que se espera de quem já aprendeu, como perceber isso na prática e o que fazer
          para ajudar quem ainda está no caminho.
        </p>
        <p className="mt-2 flex max-w-3xl items-start gap-1.5 text-xs text-muted-foreground sm:text-[13px]">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          Orientação pedagógica geral por área de habilidade, escrita para apoiar o trabalho em sala
          — não é um documento oficial da SEME.
        </p>
      </section>

      {/* Filtros. `top-14` casa com a altura fixa (56px) da barra mínima
          que o NavBar usa fora da home. */}
      <section className="sticky top-14 z-30 -mx-4 border-y border-border/60 bg-background/85 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <ListFilter className="size-4 shrink-0 text-muted-foreground" />
            <PillFiltro valor="" atual={disc} rotulo="Todas as áreas" onClick={() => setDisc("")} />
            {DISC_OPCOES.map((d) => (
              <PillFiltro
                key={d.id}
                valor={d.id}
                atual={disc}
                rotulo={d.nome}
                onClick={() => setDisc(d.id)}
              />
            ))}
            <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
            <PillFiltro
              valor=""
              atual={String(serie)}
              rotulo="Toda série"
              onClick={() => setSerie("")}
            />
            {SERIES.map((s) => (
              <PillFiltro
                key={s}
                valor={String(s)}
                atual={String(serie)}
                rotulo={`${s}º ano`}
                onClick={() => setSerie(s)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Como a turma foi
            </span>
            <PillFiltro valor="" atual={nivel} rotulo="Tudo" onClick={() => setNivel("")} />
            {NIVEIS.map((n) => (
              <PillFiltro
                key={n.id}
                valor={n.id}
                atual={nivel}
                rotulo={`${n.emoji} ${n.nome} ${ROTULO_FAIXA[n.id]}`}
                onClick={() => setNivel(n.id)}
                desativado={!temDesempenho}
              />
            ))}
            {!temDesempenho ? (
              <span className="text-xs text-muted-foreground">
                — disponível quando os resultados da avaliação forem publicados
              </span>
            ) : null}
            {desempenho && desempenho.turmas.length > 0 ? (
              <div className="ml-auto flex items-center gap-1.5">
                <Users2 className="size-4 shrink-0 text-muted-foreground" />
                <Select
                  value={turma || "rede"}
                  onValueChange={(v) => setTurma(v === "rede" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-[168px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rede">Desempenho da rede</SelectItem>
                    {desempenho.turmas.map((t) => (
                      <SelectItem key={t} value={t}>
                        Turma {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="py-2">
        <p className="mb-6 text-sm text-muted-foreground">
          <b className="text-foreground">{filtrados.length}</b> de {DESCRITORES_CATALOGO.length}{" "}
          habilidades
          {turma
            ? ` · desempenho real da turma ${turma}`
            : desempenho
              ? " · desempenho real da rede"
              : ""}
        </p>

        {dominiosComItens.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma habilidade encontrada com esses filtros.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-10">
            {dominiosComItens.map((dominio) => {
              const itens = porDominio.get(dominio.id) ?? [];
              return (
                <section key={dominio.id} id={`dominio-${dominio.id}`}>
                  <CategoriaHero
                    icon={dominio.icon}
                    cor={dominio.cor}
                    titulo={dominio.id}
                    descricao={dominio.expectativa}
                    extra={
                      <Badge variant="secondary" className="font-normal">
                        {itens.length} {itens.length === 1 ? "habilidade" : "habilidades"}
                      </Badge>
                    }
                  />
                  <div className="mt-3 grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Como avaliar
                        </p>
                        <p className="text-sm text-foreground">{dominio.avaliar}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Estratégias
                        </p>
                        <ul className="list-disc space-y-0.5 pl-4 text-sm text-foreground">
                          {dominio.estrategias.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {itens.map((d) => {
                      const acerto = acertoDe(d);
                      const dicasEmSala = d.atividades.find((a) => a.emSala)?.emSala;
                      return (
                        <Card key={d.id} className="flex h-full flex-col">
                          <CardContent className="flex flex-1 flex-col gap-3 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                {d.codigo ? (
                                  <span className="mb-1.5 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                                    {d.codigo}
                                  </span>
                                ) : null}
                                <p className="text-base font-semibold leading-snug text-foreground">
                                  {d.texto}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {d.series.map((s) => (
                                    <span
                                      key={s}
                                      className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                    >
                                      {s}º ano
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {/* Vaga fixa para o anel: sem ela, trocar de turma
                                reflui todos os cards, porque o anel aparece em
                                umas habilidades e some em outras. */}
                              {temDesempenho ? (
                                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center">
                                  {acerto != null ? (
                                    <AnelPercentual valor={acerto} tamanho={52} espessura={6} />
                                  ) : (
                                    <span className="text-center text-[11px] leading-tight text-muted-foreground">
                                      sem
                                      <br />
                                      dado
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </div>

                            {d.atividades.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {d.atividades.slice(0, 4).map((a) => (
                                  <span
                                    key={a.titulo}
                                    className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                                    title={a.titulo}
                                  >
                                    {a.emoji} {a.titulo}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {dicasEmSala && dicasEmSala.length > 0 ? (
                              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                                {dicasEmSala.slice(0, 2).map((dica) => (
                                  <li key={dica}>{dica}</li>
                                ))}
                              </ul>
                            ) : null}

                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="mt-auto w-fit gap-1.5"
                            >
                              <Link
                                to="/ferramentas/$ferramenta"
                                params={{ ferramenta: "atividades-por-habilidade" }}
                                search={{ serie: d.series[0], disc: d.disc }}
                              >
                                <Target className="size-3.5" /> Praticar esta habilidade
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <Card className="mt-10 border-dashed">
          <CardContent className="flex items-start gap-3 py-5">
            <ClipboardList className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <b className="text-foreground">Como usar esta página:</b> escolha uma área e uma série
              para ver as habilidades cobradas na Avaliação Diagnóstica daquela turma. Cada card já
              traz as atividades do site ligadas à habilidade — é só tocar em{" "}
              <b className="text-foreground">Praticar esta habilidade</b> para abrir. Quando a
              avaliação estiver publicada, o anel ao lado de cada habilidade mostra o acerto real
              (da rede ou da turma escolhida no filtro acima).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
