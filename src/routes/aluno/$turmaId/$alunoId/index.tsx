import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CakeSlice,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  History,
  LogOut,
  UserRound,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MinhaTrilha } from "@/components/school/minha-trilha";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { BarraFerramentas, CLASSES_BARRA_FERRAMENTAS } from "@/components/school/barra-ferramentas";
import { ferramentasAteSerie, numeroDaSerie } from "@/components/school/ferramentas/registro";
import { useAppStore } from "@/lib/app-store";
import { fetchAvaliacoesDoAluno, selo, type Avaliacao } from "@/lib/avaliacoes";
import {
  fetchAtividadesDaTurma,
  fetchHistoricoAcessos,
  fetchPresencasDoAluno,
  fetchStatusDoAluno,
  marcarAtividade,
} from "@/lib/aluno-area";
import { useConfirmar } from "@/lib/confirm-store";
import { encerrarAlunoSessao, lerAlunoSessao } from "@/lib/aluno-session";
import { cn } from "@/lib/utils";
import { simuladoDoAluno } from "@/lib/simulados";
import { idadeEmAnos } from "@/lib/profissional-acesso";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Atividade, AtividadeStatus, Presenca } from "@/lib/types";
import alunoPainelBgImg from "@/assets/feature-kids-learning.jpg";

export const Route = createFileRoute("/aluno/$turmaId/$alunoId/")({
  component: AlunoPainel,
  head: () => ({
    meta: [
      { title: "Minha área · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type TimelineItem =
  | { tipo: "presenca"; data: string; presenca: Presenca }
  | { tipo: "atividade"; data: string; atividade: Atividade };

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AlunoPainel() {
  const { turmaId, alunoId } = Route.useParams();
  const { turmas, config } = useAppStore();
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const turma = turmas.find((t) => t.id === turmaId);
  // A lista de ferramentas cresce com a série do aluno.
  const liberadas = ferramentasAteSerie(numeroDaSerie(turma?.serie)).length;
  const aluno = turma?.alunos.find((a) => a.id === alunoId);

  const [carregando, setCarregando] = useState(true);
  const [ultimoAcesso, setUltimoAcesso] = useState<string | null>(null);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [statusPorAtividade, setStatusPorAtividade] = useState<Map<string, AtividadeStatus>>(
    new Map(),
  );

  const sessao = lerAlunoSessao();
  const pin = sessao?.pin;
  const idade = idadeEmAnos(aluno?.nascimento);
  const [simuladoAberto, setSimuladoAberto] = useState<{ titulo: string; feito: boolean } | null>(
    null,
  );

  // Há simulado aberto para a turma? Mostra o aviso no topo da área.
  useEffect(() => {
    if (!pin) return;
    simuladoDoAluno({ alunoId, pin, turmaId })
      .then((s) =>
        setSimuladoAberto(s ? { titulo: s.titulo, feito: s.minha?.status === "finalizado" } : null),
      )
      .catch(() => setSimuladoAberto(null));
  }, [alunoId, turmaId, pin]);

  useEffect(() => {
    if (!sessao || sessao.alunoId !== alunoId || sessao.turmaId !== turmaId) {
      navigate({ to: "/aluno/$turmaId", params: { turmaId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, turmaId]);

  useEffect(() => {
    if (!pin) return;
    const pinConfirmado = pin;
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      try {
        const [historico, historicoPresencas, atividadesDaTurma, statusDoAluno] = await Promise.all(
          [
            fetchHistoricoAcessos(alunoId, pinConfirmado, 2),
            fetchPresencasDoAluno(alunoId),
            fetchAtividadesDaTurma(turmaId),
            fetchStatusDoAluno(alunoId, pinConfirmado),
          ],
        );
        if (cancelado) return;
        // O acesso de agora já foi registrado na tela anterior — o penúltimo
        // (índice 1) é o "último acesso" de verdade, antes deste.
        setUltimoAcesso(historico[1]?.acessado_em ?? null);
        setPresencas(historicoPresencas);
        // O retorno do professor é o que a criança mais quer ver ao entrar —
        // se falhar, o resto da área continua funcionando sem ele.
        fetchAvaliacoesDoAluno(alunoId)
          .then((lista) => {
            if (!cancelado) setAvaliacoes(lista);
          })
          .catch(() => undefined);
        setAtividades(atividadesDaTurma);
        setStatusPorAtividade(statusDoAluno);
      } catch (err) {
        if (!cancelado)
          toast.error(`Não foi possível carregar seus dados: ${(err as Error).message}`);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [alunoId, turmaId, pin]);

  const totalFaltas = useMemo(
    () => presencas.filter((p) => p.status === "faltou").length,
    [presencas],
  );

  const timeline = useMemo<TimelineItem[]>(() => {
    const itens: TimelineItem[] = presencas.map((p) => ({
      tipo: "presenca",
      data: p.data,
      presenca: p,
    }));
    for (const atividade of atividades) {
      const status = statusPorAtividade.get(atividade.id);
      if (status?.status === "concluida" && status.concluidoEm) {
        itens.push({ tipo: "atividade", data: status.concluidoEm, atividade });
      }
    }
    return itens.sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 12);
  }, [presencas, atividades, statusPorAtividade]);

  async function concluirAtividade(atividadeId: string) {
    if (!pin) return;
    try {
      await marcarAtividade(atividadeId, alunoId, pin, "concluida");
      setStatusPorAtividade((mapa) => {
        const novo = new Map(mapa);
        novo.set(atividadeId, {
          atividadeId,
          alunoId,
          status: "concluida",
          concluidoEm: new Date().toISOString(),
        });
        return novo;
      });
      toast.success("Atividade marcada como concluída!");
    } catch (err) {
      toast.error(`Não foi possível salvar: ${(err as Error).message}`);
    }
  }

  if (!turma || !aluno) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Aluno não encontrado.</p>
            <Button asChild variant="outline" className="mt-4">
              <a href="/aluno">Voltar</a>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const cor = serieClasses(serieIndexPorNumero(turma.serie));
  const anoAtual = new Date().getFullYear();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        {/* Hero pessoal do aluno */}
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-xl">
            <img
              src={alunoPainelBgImg}
              alt=""
              aria-hidden
              className="h-[260px] w-full object-cover sm:h-[300px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent"
            />
            <div className="absolute inset-0 flex items-end p-4 sm:items-center sm:p-8">
              <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/25 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:max-w-xl sm:p-6">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ring-2 ring-white/40 ${cor.bg} ${cor.text}`}
                  >
                    {aluno.nome.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold text-white sm:text-xl">
                      {aluno.nome}
                    </h1>
                    <p className="text-xs text-white/85 sm:text-sm">
                      {turma.serie} &quot;{turma.letra}&quot; · Ano letivo {anoAtual}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-white/85 sm:text-sm">
                  {aluno.nascimento ? (
                    <span className="flex items-center gap-1.5">
                      <CakeSlice className="size-3.5 shrink-0" /> Nasci em{" "}
                      {new Date(`${aluno.nascimento}T12:00:00`).toLocaleDateString("pt-BR")}
                      {idade !== null ? ` · tenho ${idade} anos` : ""}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <UserRound className="size-3.5 shrink-0" /> Prof(a) regente:{" "}
                    {turma.professorRegente}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 shrink-0" /> Prof(a) de informática:{" "}
                    {config.professorInformatica}
                  </span>
                </div>
                {aluno.necessidadeEspecial &&
                turma.apoioEspecial &&
                turma.apoioEspecial.length > 0 ? (
                  <span className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/80">
                    <HeartHandshake className="size-3 shrink-0" />
                    Conta com apoio de{" "}
                    {turma.apoioEspecial.map((a) => a.nome.split(" ")[0]).join(", ")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Chips de resumo */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                <CalendarDays className="size-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">Hoje</p>
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                <Clock3 className="size-4 text-blue-600 dark:text-blue-400" />
                <p className="text-[11px] text-muted-foreground">Último acesso</p>
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  {carregando
                    ? "..."
                    : ultimoAcesso
                      ? formatarDataHora(ultimoAcesso)
                      : "1º acesso!"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                <UserX className="size-4 text-destructive" />
                <p className="text-[11px] text-muted-foreground">Faltas</p>
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  {carregando ? "..." : totalFaltas}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Ferramentas e exercícios */}
        <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-2 sm:px-6">
          {simuladoAberto && !simuladoAberto.feito ? (
            <Link
              to="/aluno/$turmaId/$alunoId/simulado"
              params={{ turmaId, alunoId }}
              className={cn(
                CLASSES_BARRA_FERRAMENTAS,
                "from-sky-800 via-blue-800 to-indigo-800 shadow-sky-500/20 hover:shadow-sky-500/30",
              )}
            >
              <BarraFerramentas
                titulo={`Simulado aberto: ${simuladoAberto.titulo}`}
                descricao="O professor iniciou um simulado para a sua turma. Entre quando ele pedir."
                acao="Fazer agora →"
              />
            </Link>
          ) : null}
          <Link
            to="/aluno/$turmaId/$alunoId/trilha"
            params={{ turmaId, alunoId }}
            className={cn(
              CLASSES_BARRA_FERRAMENTAS,
              "from-emerald-700 via-teal-700 to-sky-700 shadow-emerald-500/20 hover:shadow-emerald-500/30",
            )}
          >
            <BarraFerramentas
              titulo="Minha trilha ⭐"
              descricao="Atividades escolhidas para você a partir da Avaliação Diagnóstica. Ganhe estrelas e suba de nível!"
              acao="Continuar →"
            />
          </Link>
          <Link
            to="/aluno/$turmaId/$alunoId/ferramentas"
            params={{ turmaId, alunoId }}
            className={CLASSES_BARRA_FERRAMENTAS}
          >
            <BarraFerramentas
              titulo="Ferramentas e exercícios"
              descricao={`${liberadas} atividades liberadas para o seu ano: jogos, leitura, matemática e escrita.`}
              acao="Explorar →"
            />
          </Link>
        </section>

        {/* O que o professor achou do trabalho: selo, nota e recado. */}
        {avaliacoes.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">O que o professor achou</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Retorno dos seus trabalhos — o mais recente primeiro.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {avaliacoes.map((avaliacao) => {
                const info = selo(avaliacao.selo);
                return (
                  <Card key={avaliacao.id}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {info ? (
                          <Badge className={`font-normal hover:bg-inherit ${info.cor}`}>
                            {info.rotulo}
                          </Badge>
                        ) : null}
                        {avaliacao.nota !== undefined ? (
                          <Badge variant="secondary" className="font-normal">
                            nota {avaliacao.nota}
                          </Badge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {avaliacao.tipo === "entrega" ? "texto entregue" : "atividade"}
                        </span>
                      </div>
                      {avaliacao.comentario ? (
                        <p className="rounded-lg bg-muted/60 p-2.5 text-sm text-foreground">
                          “{avaliacao.comentario}”
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {avaliacao.avaliadoPor} ·{" "}
                        {new Date(avaliacao.atualizadoEm).toLocaleDateString("pt-BR")}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Minha trilha — o que a criança já fez por conta própria */}
        {pin && (
          <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
            {/* Nome diferente de "Minha trilha", que já é a trilha de
              recomposição vinda da Avaliação Diagnóstica. */}
            <h2 className="mb-1 text-lg font-semibold text-foreground">O que eu já pratiquei</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Tudo o que você fez sozinho nas ferramentas fica guardado aqui.
            </p>
            <MinhaTrilha alunoId={alunoId} pin={pin} />
          </section>
        )}

        {/* Atividades */}
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Suas atividades</h2>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : atividades.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade cadastrada pelo professor por enquanto.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {atividades.map((atividade) => {
                const status = statusPorAtividade.get(atividade.id);
                const concluida = status?.status === "concluida";
                return (
                  <Card key={atividade.id} className={concluida ? "border-emerald-500/40" : ""}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{atividade.titulo}</p>
                        {concluida ? (
                          <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                            <CheckCircle2 className="size-3" /> Concluída
                          </Badge>
                        ) : null}
                      </div>
                      {atividade.descricao ? (
                        <p className="text-xs text-muted-foreground">{atividade.descricao}</p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {atividade.url ? (
                          <Button asChild size="sm" variant="outline" className="gap-1.5">
                            <a href={atividade.url} target="_blank" rel="noopener noreferrer">
                              Abrir <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        ) : null}
                        {!concluida ? (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => concluirAtividade(atividade.id)}
                          >
                            <Circle className="size-3.5" /> Marcar como concluída
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <History className="size-5 text-primary" /> Linha do tempo
          </h2>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : timeline.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Ainda não há histórico — ele aparece aqui conforme as aulas acontecem.
              </CardContent>
            </Card>
          ) : (
            <ol className="relative flex flex-col gap-4 border-l border-border/60 pl-5">
              {timeline.map((item, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[1.6rem] flex size-3.5 items-center justify-center rounded-full ring-4 ring-background ${
                      item.tipo === "atividade"
                        ? "bg-emerald-500"
                        : item.presenca.status === "faltou"
                          ? "bg-destructive"
                          : "bg-blue-500"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">{formatarData(item.data)}</p>
                  {item.tipo === "atividade" ? (
                    <p className="text-sm text-foreground">
                      Concluiu a atividade <strong>{item.atividade.titulo}</strong>
                    </p>
                  ) : (
                    <p className="text-sm text-foreground">
                      {item.presenca.status === "faltou"
                        ? "Faltou na aula de informática"
                        : item.presenca.status === "substituido"
                          ? "Participou (substituindo um colega)"
                          : "Presente na aula de informática"}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              const ok = await confirmar({
                titulo: "Sair da sua área?",
                descricao: "Você vai precisar do seu PIN de novo para entrar da próxima vez.",
              });
              if (!ok) return;
              encerrarAlunoSessao();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
