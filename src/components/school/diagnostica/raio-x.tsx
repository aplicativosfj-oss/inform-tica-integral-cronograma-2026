import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Minus, Sparkles, Users2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  comoIntervir,
  lacunasComparadas,
  raioXTurma,
  type PerfilAluno,
} from "@/lib/diagnostica/analise";
import { atividadesParaHabilidade } from "@/lib/diagnostica/sugestoes";
import { NOME_DISC, type ProvaII } from "@/lib/diagnostica/tipos";
import { cn } from "@/lib/utils";

/**
 * Raio-X de uma turma e de um aluno, em janela.
 *
 * A ideia é que o professor clique no que está olhando — um cartão de turma,
 * o nome de uma criança — e receba tudo o que se sabe dela nas duas
 * avaliações, já apontando o caminho de intervenção. Nada de ir a outra
 * página e cruzar números de cabeça.
 *
 * A régua da rede (Feijó e Acre) aparece em cada questão da I porque é ela
 * que diz se a dificuldade é da turma ou da prova. E, no aluno, cada lacuna
 * vem com quanto da turma errou o mesmo: erro que metade da turma cometeu se
 * resolve em aula, erro só dele se resolve em apoio individual.
 */

const porcento = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const nomeTurma = (ano: number, turma: string) => `${ano}º ano ${turma}`;

export function RaioXTurmaDialog({
  aberto,
  aoFechar,
  provas,
  ano,
  turma,
  mostrarAlunos = false,
  aoAbrirAluno,
}: {
  aberto: boolean;
  aoFechar: () => void;
  provas: ProvaII[];
  ano: number;
  turma: string;
  mostrarAlunos?: boolean;
  aoAbrirAluno?: (perfil: PerfilAluno) => void;
}) {
  const dados = raioXTurma(provas, ano, turma);
  const abaixoDaRede = dados.questoesI.filter((q) => (q.vsRede ?? 0) < -0.1);

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[88dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Raio-X do {nomeTurma(ano, turma)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <Bloco titulo="Onde a turma está">
            <div className="grid gap-3 sm:grid-cols-3">
              {dados.disciplinas.map((d) => (
                <div key={d.disc} className="rounded-lg border border-border p-3">
                  <p className="font-semibold">{NOME_DISC[d.disc] ?? d.disc}</p>
                  <p className="text-xs text-muted-foreground">
                    1ª avaliação: <b>{porcento(d.i)}</b>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    2ª avaliação: <b>{porcento(d.ii)}</b>
                  </p>
                  <Diferenca delta={d.delta} />
                </div>
              ))}
            </div>
          </Bloco>

          {dados.linhasI.length > 0 && (
            <Bloco
              titulo="Como a turma se distribuía na 1ª avaliação"
              ajuda="Parte da turma em cada faixa de desempenho."
            >
              {dados.linhasI.map((t) => {
                const faixas = [
                  { r: "Insuficiente", v: t.faixas.insuficiente, c: "bg-rose-500" },
                  { r: "Regular", v: t.faixas.regular, c: "bg-amber-500" },
                  { r: "Bom", v: t.faixas.bom, c: "bg-sky-500" },
                  { r: "Ótimo", v: t.faixas.otimo, c: "bg-emerald-500" },
                ].filter((f) => f.v != null && f.v > 0);
                if (faixas.length === 0) return null;
                return (
                  <div key={t.disc} className="mb-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      {NOME_DISC[t.disc]}
                    </p>
                    <div className="flex h-5 overflow-hidden rounded">
                      {faixas.map((f) => (
                        <div
                          key={f.r}
                          className={cn("text-[10px] font-bold text-white", f.c)}
                          style={{ width: `${f.v! * 100}%` }}
                          title={`${f.r}: ${porcento(f.v)}`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {faixas.map((f) => `${f.r} ${porcento(f.v)}`).join(" · ")}
                    </p>
                  </div>
                );
              })}
            </Bloco>
          )}

          {abaixoDaRede.length > 0 && (
            <Bloco
              titulo="Habilidades em que a turma ficou abaixo da rede"
              ajuda="Comparação com a média do Acre na mesma questão da 1ª avaliação. Aqui a dificuldade é da turma, não da prova."
            >
              <ul className="space-y-2">
                {abaixoDaRede.slice(0, 8).map((q) => (
                  <li key={`${q.disc}${q.q}`} className="rounded-lg border border-border p-2.5">
                    <p className="leading-snug">{q.texto}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {NOME_DISC[q.disc]} · turma <b>{porcento(q.acerto)}</b> · Feijó{" "}
                      {porcento(q.feijo)} · Acre {porcento(q.acre)} ·{" "}
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {Math.round((q.vsRede ?? 0) * 100)} pontos abaixo da rede
                      </span>
                    </p>
                    <Atividades serie={ano} disc={q.disc} habilidade={q.texto} daPrimeira />
                  </li>
                ))}
              </ul>
            </Bloco>
          )}

          {dados.habilidadesII.length > 0 && (
            <Bloco
              titulo="O que retomar agora"
              ajuda="Habilidades com menor acerto na 2ª avaliação, que é a foto mais recente da turma."
            >
              <ul className="space-y-2">
                {dados.habilidadesII.slice(0, 8).map((h) => {
                  const como = comoIntervir(1 - h.acerto);
                  return (
                    <li
                      key={`${h.disc}${h.texto}`}
                      className="rounded-lg border border-border p-2.5"
                    >
                      <p className="leading-snug">{h.texto}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {NOME_DISC[h.disc]} · acerto <b>{porcento(h.acerto)}</b> · {h.erraram}{" "}
                        alunos erraram · <span className="font-semibold">{como.rotulo}</span>
                      </p>
                      <Atividades serie={ano} disc={h.disc} habilidade={h.texto} />
                    </li>
                  );
                })}
              </ul>
            </Bloco>
          )}

          {mostrarAlunos && dados.alunos.length > 0 && (
            <Bloco
              titulo={`Alunos da turma (${dados.alunos.length})`}
              ajuda="Clique num nome para abrir o raio-X da criança."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {dados.alunos.map((p) => (
                  <button
                    key={p.nome}
                    type="button"
                    onClick={() => aoAbrirAluno?.(p)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-left transition hover:border-primary hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.lacunas.length} habilidades a retomar
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{porcento(p.acerto)}</span>
                  </button>
                ))}
              </div>
            </Bloco>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RaioXAlunoDialog({
  perfil,
  provas,
  aoFechar,
}: {
  perfil: PerfilAluno | null;
  provas: ProvaII[];
  aoFechar: () => void;
}) {
  if (!perfil) return null;
  const lacunas = lacunasComparadas(perfil, provas);
  const soDele = lacunas.filter((l) => l.soDele);
  const daTurma = lacunas.filter((l) => !l.soDele);

  return (
    <Dialog open onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{perfil.nome}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {nomeTurma(perfil.ano, perfil.turma)} · 2ª Avaliação Diagnóstica
          </p>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            {perfil.porDisciplina.map((d) => (
              <div key={d.disc} className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {NOME_DISC[d.disc] ?? d.disc}
                </p>
                <p className="text-2xl font-bold tabular-nums">{porcento(d.acerto)}</p>
                <p className="text-xs text-muted-foreground">
                  {d.acertos} de {d.total} questões
                </p>
              </div>
            ))}
          </div>

          {perfil.escrita && (
            <p className="rounded-lg bg-muted/50 p-3">
              Nível de escrita registrado na prova: <b>{perfil.escrita}</b>
            </p>
          )}

          <Bloco
            titulo={`Dificuldades que são dele (${soDele.length})`}
            ajuda="A maior parte da turma acertou estas questões. Pedem apoio direto, em dupla ou no laboratório."
          >
            {soDele.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhuma: tudo o que ele errou, boa parte da turma também errou.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {soDele.map((l) => (
                  <li key={l.disc + l.texto} className="rounded-lg border border-border p-2.5">
                    <p className="leading-snug">{l.texto}</p>
                    <p className="text-xs text-muted-foreground">
                      {NOME_DISC[l.disc]} · só {porcento(l.turmaErrou)} da turma errou
                    </p>
                    <Atividades serie={perfil.ano} disc={l.disc} habilidade={l.texto} />
                  </li>
                ))}
              </ul>
            )}
          </Bloco>

          <Bloco
            titulo={`Dificuldades que a turma compartilha (${daTurma.length})`}
            ajuda="Boa parte da turma também errou. O caminho aqui é retomar em aula, não apoio individual."
          >
            {daTurma.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma.</p>
            ) : (
              <ul className="space-y-1.5">
                {daTurma.map((l) => (
                  <li key={l.disc + l.texto} className="rounded-lg border border-border p-2.5">
                    <p className="leading-snug">{l.texto}</p>
                    <p className="text-xs text-muted-foreground">
                      {NOME_DISC[l.disc]} · {porcento(l.turmaErrou)} da turma errou o mesmo
                    </p>
                    <Atividades serie={perfil.ano} disc={l.disc} habilidade={l.texto} />
                  </li>
                ))}
              </ul>
            )}
          </Bloco>

          <Bloco
            titulo={`Pontos fortes (${perfil.dominios.length})`}
            ajuda="O que ele domina — serve para escalá-lo como tutor de um colega."
          >
            <ul className="grid gap-1 text-muted-foreground sm:grid-cols-2">
              {perfil.dominios.map((d) => (
                <li key={d.disc + d.texto} className="flex items-start gap-1.5">
                  <Users2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <span className="leading-snug">{d.texto}</span>
                </li>
              ))}
            </ul>
          </Bloco>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Atividades do site que tratam a habilidade — o fim da linha do raio-X.
 * Sem encaixe no catálogo, nada é mostrado: mandar a criança para uma
 * atividade que não trata da dificuldade dela é pior do que não sugerir.
 */
function Atividades({
  serie,
  disc,
  habilidade,
  daPrimeira = false,
}: {
  serie: number;
  disc: string;
  habilidade: string;
  /** Habilidade vinda da I Avaliação: os códigos dela não valem no catálogo. */
  daPrimeira?: boolean;
}) {
  const sugestoes = atividadesParaHabilidade(serie, disc, habilidade, 3, !daPrimeira);
  if (sugestoes.length === 0) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-1 font-semibold text-primary">
        <Sparkles className="size-3.5" /> Atividades:
      </span>
      {sugestoes.map((s) => (
        <Link
          key={s.entrada.id}
          to="/ferramentas/$ferramenta"
          params={{ ferramenta: "atividades-por-habilidade" }}
          search={{ serie, disc }}
          className="rounded-full border border-border px-2 py-0.5 transition hover:border-primary hover:bg-muted/50"
          title={s.entrada.conteudo}
        >
          {s.entrada.emoji} {s.entrada.titulo}
        </Link>
      ))}
    </p>
  );
}

function Bloco({
  titulo,
  ajuda,
  children,
}: {
  titulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-bold">{titulo}</h3>
      {ajuda && <p className="mb-2 text-xs text-muted-foreground">{ajuda}</p>}
      {children}
    </section>
  );
}

function Diferenca({ delta }: { delta: number | null }) {
  if (delta == null) {
    return (
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" /> sem comparação
      </p>
    );
  }
  const subiu = delta >= 0;
  const Icone = subiu ? ArrowUp : ArrowDown;
  return (
    <p
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-xs font-bold",
        subiu ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      )}
    >
      <Icone className="size-3" />
      {subiu ? "subiu" : "caiu"} {Math.abs(Math.round(delta * 100))} pontos
    </p>
  );
}
