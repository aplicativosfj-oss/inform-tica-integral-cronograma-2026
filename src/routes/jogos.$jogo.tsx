import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BotaoCompartilhar } from "@/components/school/botao-compartilhar";
import { CreditoFerramenta } from "@/components/school/ferramentas/credito";
import { JOGOS, SalaDeJogos } from "@/components/school/jogos/sala-de-jogos";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { Button } from "@/components/ui/button";
import { metaCompartilhar } from "@/lib/compartilhar";

/**
 * Página própria de cada jogo da Sala de Jogos: `/jogos/corrida`, `/jogos/damas`…
 *
 * Existe para o link ser compartilhável — cada jogo tem seu endereço e, por
 * isso, seu cartão de compartilhamento com a imagem do próprio jogo. A Sala
 * abre já no jogo pedido.
 */
export const Route = createFileRoute("/jogos/$jogo")({
  component: JogoPage,
  head: ({ params }) => {
    const jogo = JOGOS.find((j) => j.id === params.jogo);
    if (!jogo) return { meta: [{ title: "Jogo · Infoteca" }] };
    return {
      meta: metaCompartilhar({
        titulo: `${jogo.nome} · Sala de Jogos da Infoteca`,
        descricao: jogo.descricao,
        imagem: `/og/jogo-${jogo.id}.jpg`,
        alt: `${jogo.nome}: jogo da Sala de Jogos da Infoteca`,
      }),
    };
  },
});

function JogoPage() {
  const { jogo: id } = Route.useParams();
  const jogo = JOGOS.find((j) => j.id === id);

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Link
            to="/ferramentas/$ferramenta"
            params={{ ferramenta: "sala-de-jogos" }}
            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Todos os jogos
          </Link>

          {jogo ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    <span aria-hidden>{jogo.emoji}</span> {jogo.nome}
                  </h1>
                  <p className="text-sm text-muted-foreground">{jogo.descricao}</p>
                </div>
                <BotaoCompartilhar
                  caminho={`/jogos/${jogo.id}`}
                  titulo={`${jogo.nome} · Sala de Jogos`}
                  texto={jogo.descricao}
                  className="border-border bg-card text-foreground hover:border-primary"
                />
              </div>
              <SalaDeJogos jogoInicial={jogo.id} />
              <CreditoFerramenta />
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Não encontramos este jogo.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/ferramentas/$ferramenta" params={{ ferramenta: "sala-de-jogos" }}>
                  Ver todos os jogos
                </Link>
              </Button>
            </div>
          )}
        </section>
        <SiteFooter />
      </div>
    </div>
  );
}
