import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
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
import { HeroProfissional } from "@/components/school/hero-profissional";
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
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Atividade } from "@/lib/types";

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

  const cor = serieClasses(serieIndexPorNumero(turma.serie));
  const criancas = alunosDoApoio(turma, indice);
  const temDivisaoDefinida = (apoio.alunosIds?.length ?? 0) > 0;

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/mediador"
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Trocar de profissional
          </Link>

          <HeroProfissional
            etiqueta={apoio.funcao}
            EtiquetaIcon={HandHeart}
            titulo={apoio.nome}
            subtitulo={`Atendimento especializado na turma ${turma.serie} "${turma.letra}", com Prof(a). ${turma.professorRegente}. Aqui ficam os dados das crianças que você acompanha e as atividades adaptadas ao ritmo delas.`}
            indicadores={[
              { rotulo: "Crianças", valor: criancas.length, icon: Baby },
              { rotulo: "Turma", valor: `${turma.serie} ${turma.letra}`, icon: School },
              {
                rotulo: "Atividades da turma",
                valor: carregando ? "..." : atividades.length,
                icon: CalendarDays,
              },
              {
                rotulo: "Ferramentas adaptadas",
                valor: FERRAMENTAS_ADAPTADAS.length,
                icon: Sparkles,
              },
            ]}
            acoes={
              <Button variant="outline" size="sm" className="gap-1.5" onClick={sair}>
                <LogOut className="size-4" /> Sair
              </Button>
            }
          />

          {atendido ? (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Atendendo <strong>{atendido.nome}</strong> — tudo o que for feito agora fica
                    registrado na área dele(a).
                  </span>
                </p>
                <Button variant="outline" size="sm" onClick={encerrarAtendimento}>
                  Encerrar atendimento
                </Button>
              </div>

              <Link
                to="/mediador/$turmaId/$apoioIndex/ferramentas"
                params={{ turmaId, apoioIndex }}
                className={`mt-3 ${CLASSES_BARRA_FERRAMENTAS}`}
              >
                <BarraFerramentas
                  titulo="Ferramentas adaptadas"
                  descricao={`Atividades por imagem, som e repetição — abrindo para ${atendido.nome}.`}
                  acao="Abrir →"
                />
              </Link>
            </>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  Escolha quem você vai atender agora
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  As ferramentas abrem depois disso. Assim, o que a criança fizer com você é
                  guardado na área dela — junto com o que ela faz sozinha — e o professor vê tudo no
                  mesmo lugar.
                </p>
              </div>
            </div>
          )}

          <h2 className="mb-1 mt-8 text-lg font-semibold text-foreground">
            Crianças que você acompanha
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {temDivisaoDefinida
              ? "Divisão definida pela coordenação da escola, no cadastro da turma."
              : "A coordenação ainda não registrou quem acompanha quem, então o sistema dividiu as crianças com atendimento especializado entre os profissionais da turma. Peça o ajuste à coordenação se não for essa a divisão combinada."}
          </p>

          {criancas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma criança com atendimento especializado registrada nesta turma.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {criancas.map((crianca) => {
                const idade = idadeEmAnos(crianca.nascimento);
                return (
                  <Card key={crianca.id}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${cor.bg} ${cor.text}`}
                        >
                          {crianca.nome.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{crianca.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {turma.serie} &quot;{turma.letra}&quot;
                          </p>
                        </div>
                      </div>

                      <dl className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CakeSlice className="size-3.5 shrink-0 text-muted-foreground" />
                          <dt className="text-muted-foreground">Idade:</dt>
                          <dd className="text-foreground">
                            {idade !== null ? `${idade} anos` : "não informada no cadastro"}
                          </dd>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <HeartHandshake className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <dt className="text-muted-foreground">Especialidade:</dt>
                          <dd className="text-foreground">
                            {crianca.especialidade ?? "não informada no cadastro"}
                          </dd>
                        </div>
                      </dl>

                      {crianca.observacoesNecessidade ? (
                        <p className="rounded-lg bg-primary/5 p-2 text-xs text-foreground">
                          {crianca.observacoesNecessidade}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sem orientações de adaptação registradas. A coordenação pode incluí-las no
                          cadastro do aluno.
                        </p>
                      )}

                      {atendido?.id === crianca.id ? (
                        <Badge className="w-fit gap-1 bg-emerald-600 font-normal hover:bg-emerald-600">
                          <CheckCircle2 className="size-3" /> Atendendo agora
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-fit gap-1.5"
                          onClick={() => {
                            setCandidato({ id: crianca.id, nome: crianca.nome });
                            setPin("");
                            setErroPin(null);
                          }}
                        >
                          <UserRound className="size-3.5" /> Atender {crianca.nome.split(" ")[0]}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Atividades da turma</h2>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : atividades.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade cadastrada para esta turma ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {atividades.map((atividade) => (
                <Card key={atividade.id}>
                  <CardContent className="flex flex-col gap-1.5 p-4">
                    <p className="text-sm font-semibold text-foreground">{atividade.titulo}</p>
                    {atividade.descricao ? (
                      <p className="text-xs text-muted-foreground">{atividade.descricao}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${atividade.data}T12:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                    {atividade.url ? (
                      <Button asChild size="sm" variant="outline" className="mt-1 w-fit gap-1.5">
                        <a href={atividade.url} target="_blank" rel="noopener noreferrer">
                          Abrir <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Badge variant="secondary" className="mt-6 font-normal">
            Prof(a). regente: {turma.professorRegente}
          </Badge>
        </section>

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
