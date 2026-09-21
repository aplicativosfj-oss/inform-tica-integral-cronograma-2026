import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookHeart,
  FileText,
  Baby,
  CakeSlice,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  HandHeart,
  HeartHandshake,
  KeyRound,
  Loader2,
  LogOut,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarraFerramentas, CLASSES_BARRA_FERRAMENTAS } from "@/components/school/barra-ferramentas";
import { FaleComProfessor } from "@/components/school/fale-com-professor";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { fetchAtividadesDaTurma, registrarAcesso, verificarPin } from "@/lib/aluno-area";
import { encerrarAlunoSessao, iniciarAlunoSessao } from "@/lib/aluno-session";
import { useConfirmar } from "@/lib/confirm-store";
import { FERRAMENTAS_ADAPTADAS, alunosDoApoio, idadeEmAnos } from "@/lib/profissional-acesso";
import {
  definirAlunoAtendido,
  encerrarProfissionalSessao,
  lerProfissionalSessao,
  limparAlunoAtendido,
  temSessaoDeApoio,
} from "@/lib/profissional-session";
import type { Atividade } from "@/lib/types";
import fundoInclusaoImg from "@/assets/feature-kids-learning.jpg";

export const Route = createFileRoute("/mediador/$turmaId/$apoioIndex/")({
  component: MediadorPainel,
  head: () => ({
    meta: [
      { title: "Minha área · Espaço do Mediador e do Cuidador" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MediadorPainel() {
  const { turmaId, apoioIndex } = Route.useParams();
  const indice = Number(apoioIndex);
  const { turmas } = useAppStore();
  const navigate = useNavigate();
  const confirmar = useConfirmar();

  const turma = turmas.find((t) => t.id === turmaId);
  const apoio = turma?.apoioEspecial?.[indice];

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Quem está sendo atendido agora. Enquanto ninguém for escolhido, as
  // ferramentas ficam fechadas: é a escolha do aluno que cria a sessão dele
  // e faz tudo o que for feito no atendimento cair na área daquela criança
  // — o mesmo lugar onde ela vê o que fez sozinha.
  const [atendido, setAtendido] = useState<{ id: string; nome: string } | null>(null);
  const [candidato, setCandidato] = useState<{ id: string; nome: string } | null>(null);
  const [pin, setPin] = useState("");
  const [erroPin, setErroPin] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    const sessao = lerProfissionalSessao();
    if (sessao?.alunoAtendidoId && sessao.alunoAtendidoNome) {
      setAtendido({ id: sessao.alunoAtendidoId, nome: sessao.alunoAtendidoNome });
    }
  }, []);

  async function confirmarAtendimento() {
    if (!candidato || !turma) return;
    if (pin.length !== 4) {
      setErroPin("Digite os 4 dígitos.");
      return;
    }
    setEntrando(true);
    setErroPin(null);
    try {
      const ok = await verificarPin(candidato.id, pin);
      if (!ok) {
        setErroPin("PIN incorreto. A coordenação tem a lista no painel da escola.");
        return;
      }
      // Abre a sessão do próprio aluno: daqui em diante as ferramentas
      // salvam na pasta dele, exatamente como quando ele trabalha sozinho.
      await registrarAcesso(candidato.id, turma.id, pin);
      iniciarAlunoSessao({
        alunoId: candidato.id,
        turmaId: turma.id,
        nome: candidato.nome,
        pin,
      });
      definirAlunoAtendido(candidato.id, candidato.nome);
      setAtendido(candidato);
      setCandidato(null);
      setPin("");
      toast.success(`Atendendo ${candidato.nome}. O que for feito agora fica na área dele(a).`);
    } catch (err) {
      setErroPin(`Não foi possível entrar: ${(err as Error).message}`);
    } finally {
      setEntrando(false);
    }
  }

  async function encerrarAtendimento() {
    const ok = await confirmar({
      titulo: "Encerrar o atendimento?",
      descricao:
        "O trabalho feito continua salvo na área do aluno. Para atender outra criança, é preciso o PIN dela.",
    });
    if (!ok) return;
    encerrarAlunoSessao();
    limparAlunoAtendido();
    setAtendido(null);
  }

  useEffect(() => {
    if (!temSessaoDeApoio(turmaId, indice)) navigate({ to: "/mediador" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, indice]);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      try {
        const tarefas = await fetchAtividadesDaTurma(turmaId);
        if (!cancelado) setAtividades(tarefas);
      } catch {
        if (!cancelado) setAtividades([]);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [turmaId]);

  async function sair() {
    const ok = await confirmar({
      titulo: "Sair da sua área?",
      descricao: "Você vai precisar da sua senha de novo para entrar.",
    });
    if (!ok) return;
    encerrarAlunoSessao();
    encerrarProfissionalSessao();
    navigate({ to: "/mediador" });
  }

  if (!turma || !apoio) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Profissional não encontrado.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/mediador">Voltar</Link>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const criancas = alunosDoApoio(turma, indice);
  const temDivisaoDefinida = (apoio.alunosIds?.length ?? 0) > 0;
  const iniciais = apoio.nome
    .split(" ")
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
  const viaCoordenacao = lerProfissionalSessao()?.viaCoordenacaoAEE;

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Link
            to="/mediador"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Trocar de profissional
          </Link>

          {/* Cabeçalho de perfil: o profissional em destaque */}
          <header className="relative overflow-hidden rounded-3xl text-white shadow-2xl shadow-indigo-950/30 ring-1 ring-white/10">
            <img
              src={fundoInclusaoImg}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/90 to-violet-900/60" />
            <div className="relative flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-3xl font-bold tracking-tight shadow-lg ring-4 ring-white/20 sm:size-24 sm:text-4xl">
                  {iniciais}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/25 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-100 ring-1 ring-fuchsia-300/40">
                      <HandHeart className="size-3.5" /> {apoio.funcao}
                    </span>
                    {viaCoordenacao ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/40">
                        <ShieldCheck className="size-3.5" /> Acesso da coordenação do AEE ·{" "}
                        {viaCoordenacao}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {apoio.nome}
                  </h1>
                  <p className="mt-1 text-sm text-white/75 sm:text-base">
                    Atendimento educacional especializado · {turma.serie} &ldquo;{turma.letra}
                    &rdquo; · Prof(a). regente {turma.professorRegente}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={sair}
                >
                  <LogOut className="size-4" /> Sair
                </Button>
              </div>

              <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { rotulo: "Crianças acompanhadas", valor: criancas.length, icon: Baby },
                  { rotulo: "Turma", valor: `${turma.serie} ${turma.letra}`, icon: School },
                  {
                    rotulo: "Atividades da turma",
                    valor: carregando ? "…" : atividades.length,
                    icon: CalendarDays,
                  },
                  {
                    rotulo: "Ferramentas adaptadas",
                    valor: FERRAMENTAS_ADAPTADAS.length,
                    icon: Sparkles,
                  },
                ].map(({ rotulo, valor, icon: Icone }) => (
                  <div
                    key={rotulo}
                    className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur"
                  >
                    <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/65">
                      <Icone className="size-3.5" /> {rotulo}
                    </dt>
                    <dd className="mt-0.5 text-2xl font-bold">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Coluna principal */}
            <main className="flex min-w-0 flex-col gap-6">
              {/* Atendimento */}
              {atendido ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                      <span>
                        Atendendo <strong>{atendido.nome}</strong> — o que for feito agora fica na
                        área dele(a).
                      </span>
                    </p>
                    <Button variant="outline" size="sm" onClick={encerrarAtendimento}>
                      Encerrar atendimento
                    </Button>
                  </div>
                  <Link
                    to="/mediador/$turmaId/$apoioIndex/ferramentas"
                    params={{ turmaId, apoioIndex }}
                    className={CLASSES_BARRA_FERRAMENTAS}
                  >
                    <BarraFerramentas
                      titulo="Ferramentas adaptadas"
                      descricao={`Atividades por imagem, som e repetição — abrindo para ${atendido.nome}.`}
                      acao="Abrir →"
                    />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                  <UserRound className="size-5 shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Escolha a criança que vai atender</strong>{" "}
                    para abrir as ferramentas adaptadas — o trabalho fica salvo na área dela.
                  </p>
                </div>
              )}

              {/* Crianças */}
              <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-500">
                      Atendimento especializado
                    </p>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Crianças que você acompanha
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {temDivisaoDefinida
                      ? "Divisão definida pela coordenação."
                      : "Divisão automática — peça ajuste à coordenação se precisar."}
                  </p>
                </div>

                {criancas.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma criança vinculada a você nesta turma.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {criancas.map((crianca) => {
                      const idade = idadeEmAnos(crianca.nascimento);
                      const emAtendimento = atendido?.id === crianca.id;
                      return (
                        <Card
                          key={crianca.id}
                          className={`overflow-hidden shadow-lg shadow-fuchsia-900/10 ${emAtendimento ? "border-emerald-500/60 ring-2 ring-emerald-500/40" : "border-fuchsia-500/30"}`}
                        >
                          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 px-4 py-4 text-white">
                            <div className="flex items-center gap-3">
                              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold ring-2 ring-white/40">
                                {crianca.nome
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((p) => p.charAt(0))
                                  .join("")}
                              </span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                                  Criança acompanhada
                                </p>
                                <p className="text-base font-bold leading-tight">{crianca.nome}</p>
                              </div>
                              <HeartHandshake className="ml-auto size-6 shrink-0 text-white/70" />
                            </div>
                          </div>
                          <CardContent className="flex flex-col gap-3 p-4">
                            <dl className="grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-muted/60 px-2.5 py-2">
                                <dt className="flex items-center gap-1 text-muted-foreground">
                                  <CakeSlice className="size-3.5" /> Idade
                                </dt>
                                <dd className="mt-0.5 font-semibold text-foreground">
                                  {idade !== null ? `${idade} anos` : "Não informada"}
                                </dd>
                              </div>
                              <div className="rounded-lg bg-muted/60 px-2.5 py-2">
                                <dt className="flex items-center gap-1 text-muted-foreground">
                                  <HeartHandshake className="size-3.5" /> Especialidade
                                </dt>
                                <dd className="mt-0.5 font-semibold text-foreground">
                                  {crianca.especialidade ?? "Não informada"}
                                </dd>
                              </div>
                            </dl>
                            <p
                              className={`rounded-lg p-2.5 text-xs ${crianca.observacoesNecessidade ? "bg-fuchsia-500/10 text-foreground" : "text-muted-foreground"}`}
                            >
                              {crianca.observacoesNecessidade ??
                                "Sem orientações de adaptação no cadastro. A coordenação pode incluí-las."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {emAtendimento ? (
                                <Badge className="gap-1 bg-emerald-600 font-normal hover:bg-emerald-600">
                                  <CheckCircle2 className="size-3" /> Atendendo agora
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5"
                                  onClick={() => {
                                    setCandidato({ id: crianca.id, nome: crianca.nome });
                                    setPin("");
                                    setErroPin(null);
                                  }}
                                >
                                  <UserRound className="size-3.5" /> Atender
                                </Button>
                              )}
                              <Button
                                asChild
                                size="sm"
                                className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                              >
                                <Link
                                  to="/mediador/$turmaId/$apoioIndex/relatorio"
                                  params={{ turmaId, apoioIndex }}
                                  search={{ aluno: crianca.id }}
                                >
                                  <FileText className="size-3.5" /> Elaborar relatório
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Atividades */}
              <section>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">
                  Atividades da turma
                </h2>
                {carregando ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : atividades.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma atividade cadastrada para esta turma ainda.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
                    {atividades.map((atividade) => (
                      <li key={atividade.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {atividade.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(`${atividade.data}T12:00:00`).toLocaleDateString("pt-BR")}
                            {atividade.descricao ? ` · ${atividade.descricao}` : ""}
                          </p>
                        </div>
                        {atividade.url ? (
                          <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
                            <a href={atividade.url} target="_blank" rel="noopener noreferrer">
                              Abrir <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </main>

            {/* Coluna lateral */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
              <Link
                to="/mediador/$turmaId/$apoioIndex/relatorio"
                params={{ turmaId, apoioIndex }}
                search={{}}
                className="group relative block overflow-hidden rounded-2xl text-white shadow-xl shadow-fuchsia-900/20 ring-1 ring-fuchsia-500/40"
              >
                <img
                  src={fundoInclusaoImg}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-violet-950/95 via-fuchsia-900/85 to-rose-800/70" />
                <div className="relative flex flex-col gap-3 p-5">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
                    <BookHeart className="size-6" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200">
                      Ferramenta do profissional
                    </p>
                    <p className="text-lg font-bold">Relatório de acompanhamento</p>
                    <p className="mt-1 text-sm text-white/85">
                      Especialidade, desafios, potencialidades e o seu olhar cuidadoso — com guia,
                      PDF e compartilhamento.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-violet-900">
                    Abrir <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>

              <FaleComProfessor
                compacto
                remetente={`${apoio.nome} (${apoio.funcao}) — ${turma.serie} "${turma.letra}"`}
              />
            </aside>
          </div>
        </div>

        <SiteFooter />
      </div>

      {/* O PIN é o da criança, o mesmo que ela usa para entrar sozinha. É ele
        que abre a sessão do aluno e faz o trabalho do atendimento ser salvo
        na pasta dela — sem isso, não haveria como o sistema saber de quem é
        o que foi produzido. */}
      <Dialog
        open={candidato !== null}
        onOpenChange={(estado) => (estado ? null : setCandidato(null))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" /> Atender {candidato?.nome}
            </DialogTitle>
            <DialogDescription>
              Digite o PIN do aluno para que o trabalho de hoje seja registrado na área dele(a).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pin-aluno">PIN de 4 dígitos</Label>
            <Input
              id="pin-aluno"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              placeholder="••••"
              className="text-center text-lg tracking-[0.5em]"
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setErroPin(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarAtendimento();
              }}
            />
            {erroPin ? <p className="text-xs text-destructive">{erroPin}</p> : null}
            <p className="text-xs text-muted-foreground">
              É o mesmo PIN que a criança usa na Área do Aluno. A coordenação tem a lista no painel
              da escola.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCandidato(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarAtendimento} disabled={pin.length !== 4 || entrando}>
              {entrando ? <Loader2 className="size-4 animate-spin" /> : null} Começar atendimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
