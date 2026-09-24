import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, WifiOff } from "lucide-react";

import { CreditoFerramenta } from "@/components/school/ferramentas/credito";
import { InstalarSalaDeJogos } from "@/components/school/jogos/instalar-sala-de-jogos";
import { SalaDeJogos } from "@/components/school/jogos/sala-de-jogos";
import { PageBackground } from "@/components/school/page-background";
import { useOnline } from "@/lib/use-online";

/**
 * A Sala de Jogos como app: `/sala-de-jogos`. É a página que o navegador
 * instala (manifesto próprio, escolhido em `__root.tsx`), com ícone de dado e
 * funcionamento offline — o service worker guarda os jogos na primeira visita.
 */
export const Route = createFileRoute("/sala-de-jogos")({
  component: SalaDeJogosApp,
  head: () => ({
    meta: [
      { title: "Sala de Jogos · Agenda de Informática" },
      {
        name: "description",
        content:
          "Damas, dominó, jogo da velha, memória, quebra-cabeça, digitação e mais. Instale no celular ou no computador e jogue sem internet.",
      },
    ],
  }),
});

function SalaDeJogosApp() {
  const online = useOnline();

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <header className="border-b border-border/60 bg-card/70 backdrop-blur">
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
                <h1 className="text-base font-bold leading-tight text-foreground">Sala de Jogos</h1>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  Escola Dr. Eiraldo Carneiro de França
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Agenda
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
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
