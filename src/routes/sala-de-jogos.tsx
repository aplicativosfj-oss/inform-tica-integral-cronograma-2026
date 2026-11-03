import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, WifiOff } from "lucide-react";

import { CreditoFerramenta } from "@/components/school/ferramentas/credito";
import { InstalarSalaDeJogos } from "@/components/school/jogos/instalar-sala-de-jogos";
import { SalaDeJogos } from "@/components/school/jogos/sala-de-jogos";
import { PageBackground } from "@/components/school/page-background";
import { metaCompartilhar } from "@/lib/compartilhar";
import { useOnline } from "@/lib/use-online";

/**
 * A Sala de Jogos como app: `/sala-de-jogos`. É a página que o navegador
 * instala (manifesto próprio, escolhido em `__root.tsx`), com ícone de dado e
 * funcionamento offline — o service worker guarda os jogos na primeira visita.
 */
export const Route = createFileRoute("/sala-de-jogos")({
  component: SalaDeJogosApp,
  head: () => ({
    meta: metaCompartilhar({
      titulo: "🎮 Sala de Jogos · Informática Dr. Eiraldo",
      descricao:
        "♟️ Damas, dominó, memória e quebra-cabeça. 📱 Instale no celular e jogue sem internet.",
      imagem: "/og/secao-sala-de-jogos.jpg",
      alt: "Sala de Jogos: instale no celular e jogue sem internet",
    }),
  }),
});

function SalaDeJogosApp() {
  const online = useOnline();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 shadow-sm backdrop-blur-2xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <img
                src="/icons/jogos-192.png"
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="size-10 rounded-xl"
              />
              <div>
                <h1 className="font-heading text-lg font-extrabold leading-tight tracking-tight text-foreground">Sala de Jogos</h1>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  Escola Dr. Eiraldo Carneiro de França
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              <ArrowLeft className="size-3.5" /> Agenda
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-card/80 px-5 py-4 shadow-sm sm:px-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-primary">Aprender brincando</p>
              <h2 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">Escolha sua próxima aventura.</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">Jogos educativos</span>
          </div>
          {!online && (
            <p className="flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-[11px] text-sky-800 dark:text-sky-200">
              <WifiOff className="size-3.5 shrink-0" />
              Você está sem internet. Os jogos continuam funcionando.
            </p>
          )}
          <InstalarSalaDeJogos />
          <SalaDeJogos />
          <CreditoFerramenta />
        </main>
      </div>
    </div>
  );
}
