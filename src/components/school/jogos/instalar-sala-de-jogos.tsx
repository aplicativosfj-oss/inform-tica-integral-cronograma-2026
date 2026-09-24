import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/lib/use-pwa-install";

/**
 * Convite para instalar a Sala de Jogos como app (celular ou computador), com
 * ícone próprio, funcionando sem internet. Só vale na página `/sala-de-jogos`,
 * que é a única com o manifesto do app de jogos — em outras páginas o
 * navegador ofereceria instalar o site inteiro.
 */
export function InstalarSalaDeJogos() {
  const { isInstalled, canInstall, isInstalling, triggerInstall } = usePWAInstall();
  const [plataforma, setPlataforma] = useState<"ios" | "outra">("outra");

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setPlataforma(ios ? "ios" : "outra");
  }, []);

  if (isInstalled) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="size-4 shrink-0" />
        Sala de Jogos instalada neste aparelho. Ela abre pelo ícone e funciona sem internet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          <Smartphone className="size-4" />
          Instalar a Sala de Jogos neste aparelho
        </span>
        {canInstall ? (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={isInstalling}
            onClick={() => void triggerInstall()}
          >
            <Download className="size-4" /> Instalar
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Fica com o ícone da Sala de Jogos na tela e joga sem internet, depois de abrir uma vez com
        conexão.
      </p>
      {!canInstall ? (
        <p className="text-xs text-foreground">
          {plataforma === "ios"
            ? "No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”."
            : "No celular: menu ⋮ do navegador → “Instalar app” ou “Adicionar à tela inicial”. No computador: ícone de instalar na barra de endereço (Chrome/Edge)."}
        </p>
      ) : null}
    </div>
  );
}
