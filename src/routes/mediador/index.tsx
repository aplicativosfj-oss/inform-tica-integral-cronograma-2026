import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, HandHeart, HeartHandshake, KeyRound, Users2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
  idApoio,
  listarApoios,
  type ApoioComTurma,
} from "@/lib/profissional-acesso";
import { iniciarProfissionalSessao } from "@/lib/profissional-session";
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
  const { turmas } = useAppStore();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<ApoioComTurma | null>(null);

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
                    onClick={() => setEscolhido(item)}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold ${cor.bg} ${cor.text}`}
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
          verificar={(senha) => conferirSenhaApoio(escolhido.turma, escolhido.indice, senha)}
          aoEntrar={() => {
            iniciarProfissionalSessao({
              tipo: "apoio",
              id: idApoio(escolhido.turma, escolhido.indice),
              nome: escolhido.apoio.nome,
              turmaId: escolhido.turma.id,
              apoioIndice: escolhido.indice,
              funcao: escolhido.apoio.funcao,
            });
            navigate({
              to: "/mediador/$turmaId/$apoioIndex",
              params: {
                turmaId: escolhido.turma.id,
                apoioIndex: String(escolhido.indice),
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
