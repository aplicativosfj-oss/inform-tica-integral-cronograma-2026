import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  HandHeart,
  HeartHandshake,
  KeyRound,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeroProfissional } from "@/components/school/hero-profissional";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SenhaProfissionalDialog } from "@/components/school/senha-profissional-dialog";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import {
  alunosDoApoio,
  conferirSenhaApoio,
  conferirSenhaCoordenacaoAEE,
  idApoio,
  listarApoios,
  type ApoioComTurma,
} from "@/lib/profissional-acesso";
import {
  encerrarSessaoAEE,
  iniciarProfissionalSessao,
  iniciarSessaoAEE,
  lerSessaoAEE,
} from "@/lib/profissional-session";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";

export const Route = createFileRoute("/mediador/")({
  component: MediadorPicker,
  head: () => ({
    meta: [
      { title: "Espaço do Mediador e do Cuidador · Agenda de Informática" },
      {
        name: "description",
        content:
          "Espaço dos mediadores e cuidadores: cada profissional entra com a própria senha e encontra os dados das crianças que acompanha e as ferramentas adaptadas.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MediadorPicker() {
  const { turmas, config } = useAppStore();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<ApoioComTurma | null>(null);
  const coordenadora = config.coordenacaoAEE?.nome;
  // Coordenação do AEE já autenticada nesta aba: abre qualquer área direto.
  const [sessaoAEE, setSessaoAEE] = useState<string | null>(null);
  const [pedindoSenhaAEE, setPedindoSenhaAEE] = useState(false);
  const entrouComMestra = useRef(false);
  useEffect(() => setSessaoAEE(lerSessaoAEE()), []);

  function abrirArea(item: ApoioComTurma, via?: string) {
    iniciarProfissionalSessao({
      tipo: "apoio",
      id: idApoio(item.turma, item.indice),
      nome: item.apoio.nome,
      turmaId: item.turma.id,
      apoioIndice: item.indice,
      funcao: item.apoio.funcao,
      ...(via ? { viaCoordenacaoAEE: via } : {}),
    });
    navigate({
      to: "/mediador/$turmaId/$apoioIndex",
      params: { turmaId: item.turma.id, apoioIndex: String(item.indice) },
    });
  }

  const apoios = useMemo(() => listarApoios(turmas), [turmas]);
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return apoios;
    return apoios.filter(
      (item) =>
        item.apoio.nome.toLowerCase().includes(termo) ||
        `${item.turma.serie} ${item.turma.letra}`.toLowerCase().includes(termo),
    );
  }, [apoios, busca]);

  const mediadores = apoios.filter((item) => item.apoio.funcao === "Mediador(a)").length;
  const cuidadores = apoios.length - mediadores;
  const criancas = turmas.reduce(
    (soma, turma) => soma + turma.alunos.filter((aluno) => aluno.necessidadeEspecial).length,
    0,
  );

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <HeroProfissional
            etiqueta="Espaço do Mediador e do Cuidador"
            EtiquetaIcon={HandHeart}
            titulo="Quem acompanha de perto"
            subtitulo="Cada mediador(a) e cuidador(a) da escola entra com a própria senha e encontra aqui as crianças que acompanha — série, idade, o que consta do atendimento — e as ferramentas adaptadas ao ritmo delas."
            indicadores={[
              { rotulo: "Mediadores", valor: mediadores, icon: HeartHandshake },
              { rotulo: "Cuidadores", valor: cuidadores, icon: HandHeart },
              { rotulo: "Crianças atendidas", valor: criancas, icon: Users2 },
              { rotulo: "Entrada", valor: "Senha de 4 dígitos", icon: KeyRound },
            ]}
          />

          {coordenadora ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-5 text-white shadow-lg ring-1 ring-white/15 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <ShieldCheck className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                  Coordenação do AEE
                </p>
                <p className="text-lg font-bold">{coordenadora}</p>
                <p className="text-sm text-white/85">
                  {sessaoAEE
                    ? "Acesso liberado: clique em qualquer profissional abaixo para abrir a área dele(a)."
                    : "Com a senha mestra, a coordenação abre a área de todos os mediadores e cuidadores."}
                </p>
              </div>
              {sessaoAEE ? (
                <Button
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white"
                  onClick={() => {
                    encerrarSessaoAEE();
                    setSessaoAEE(null);
                  }}
                >
                  Sair da coordenação
                </Button>
              ) : (
                <Button
                  className="bg-white text-emerald-800 hover:bg-white/90"
                  onClick={() => setPedindoSenhaAEE(true)}
                >
                  <KeyRound className="size-4" /> Entrar com a senha mestra
                </Button>
              )}
            </div>
          ) : null}

          <h2 className="mb-1 mt-8 text-lg font-semibold text-foreground">Encontre seu nome</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Clique em você e digite a senha que a coordenação entregou.
          </p>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome ou pela turma..."
            className="mb-5 max-w-sm"
          />

          {filtrados.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {apoios.length === 0
                ? "Nenhum mediador ou cuidador cadastrado ainda."
                : "Nenhum nome encontrado com esse termo."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((item) => {
                const cor = serieClasses(serieIndexPorNumero(item.turma.serie));
                const quantos = alunosDoApoio(item.turma, item.indice).length;
                return (
                  <button
                    key={`${item.turma.id}-${item.indice}`}
                    type="button"
                    onClick={() => (sessaoAEE ? abrirArea(item, sessaoAEE) : setEscolhido(item))}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold ring-1 ring-inset ring-black/5 dark:ring-white/10 ${cor.bg} ${cor.text}`}
                    >
                      {item.turma.letra}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                        {item.apoio.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.apoio.funcao} · {item.turma.serie} &quot;{item.turma.letra}&quot;
                      </p>
                      <Badge variant="secondary" className="mt-1 font-normal">
                        {quantos} criança(s)
                      </Badge>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <SiteFooter />
      </div>

      {escolhido ? (
        <SenhaProfissionalDialog
          aberto
          aoFechar={() => setEscolhido(null)}
          nome={escolhido.apoio.nome}
          contexto={`${escolhido.apoio.funcao} · ${escolhido.turma.serie} "${escolhido.turma.letra}"`}
          verificar={(senha) => {
            // A senha mestra da coordenação do AEE também abre qualquer área.
            entrouComMestra.current = conferirSenhaCoordenacaoAEE(coordenadora, senha);
            return (
              entrouComMestra.current ||
              conferirSenhaApoio(escolhido.turma, escolhido.indice, senha)
            );
          }}
          aoEntrar={() => {
            if (entrouComMestra.current && coordenadora) {
              iniciarSessaoAEE(coordenadora);
              abrirArea(escolhido, coordenadora);
            } else {
              abrirArea(escolhido);
            }
          }}
        />
      ) : null}

      {pedindoSenhaAEE && coordenadora ? (
        <SenhaProfissionalDialog
          aberto
          aoFechar={() => setPedindoSenhaAEE(false)}
          nome={coordenadora}
          contexto="Coordenação do AEE · senha mestra"
          verificar={(senha) => conferirSenhaCoordenacaoAEE(coordenadora, senha)}
          aoEntrar={() => {
            iniciarSessaoAEE(coordenadora);
            setSessaoAEE(coordenadora);
            setPedindoSenhaAEE(false);
          }}
        />
      ) : null}
    </div>
  );
}
