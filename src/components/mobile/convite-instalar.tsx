import { useLocation } from "@tanstack/react-router";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { MarcaLogo } from "@/components/school/marca";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/lib/use-pwa-install";

const CHAVE_DISPENSA = "convite-instalar-dispensado-em";
const DIAS_SEM_INSISTIR = 7;
const CHAVE_TOQUE = "convite-instalar-toque";

function dispensadoRecentemente(): boolean {
  try {
    const em = Number(localStorage.getItem(CHAVE_DISPENSA) ?? 0);
    return Date.now() - em < DIAS_SEM_INSISTIR * 86_400_000;
  } catch {
    return false;
  }
}

/** iPhone/iPad no Safari: não há convite automático, só "Adicionar à Tela de Início". */
function eIOSNoNavegador(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/**
 * Convite para instalar o site como app no celular. No Android (Chrome), usa
 * o convite nativo do navegador; no iPhone, ensina o caminho pelo botão
 * Compartilhar. Quem dispensa só vê de novo depois de uma semana.
 */
export function ConviteInstalar() {
  const { pathname } = useLocation();
  const { canInstall, isInstalled, isInstalling, triggerInstall } = usePWAInstall();
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (dispensadoRecentemente()) return;
    setIos(eIOSNoNavegador());
    // Na página inicial o convite aparece logo; nas outras, depois de a
    // pessoa ver a página.
    const id = window.setTimeout(() => setVisivel(true), pathname === "/" ? 600 : 2500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Na página inicial, o primeiro toque na tela já abre a instalação do
  // navegador. Instalar sozinho, sem nenhum toque, nenhum navegador permite:
  // o pedido precisa vir de um gesto da pessoa. Só uma vez por visita.
  useEffect(() => {
    if (pathname !== "/" || !canInstall || isInstalled || dispensadoRecentemente()) return;
    try {
      if (sessionStorage.getItem(CHAVE_TOQUE)) return;
    } catch {
      // Sem armazenamento: segue, o próprio evento só pode ser usado uma vez.
    }
    const aoTocar = async () => {
      try {
        sessionStorage.setItem(CHAVE_TOQUE, "1");
      } catch {
        // ignora
      }
      const ok = await triggerInstall();
      if (!ok) dispensar();
    };
    window.addEventListener("pointerup", aoTocar, { once: true });
    return () => window.removeEventListener("pointerup", aoTocar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, canInstall, isInstalled]);

  // A sala de jogos tem o próprio app e a TV não é celular.
  if (pathname.startsWith("/sala-de-jogos") || pathname.startsWith("/tv")) return null;
  if (!visivel || isInstalled || (!canInstall && !ios)) return null;

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSA, String(Date.now()));
    } catch {
      // Sem armazenamento: só fecha nesta visita.
    }
    setVisivel(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar o aplicativo"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in rounded-2xl border border-white/20 bg-background/80 p-4 shadow-2xl backdrop-blur-2xl duration-300 xl:bottom-6"
    >
      <button
        type="button"
        onClick={dispensar}
        aria-label="Agora não"
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <MarcaLogo tamanho={40} />
        <div className="min-w-0">
          <p className="font-semibold">Instale o app da Informática</p>
          {ios ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Toque em{" "}
              <Share className="inline size-4 align-text-bottom" aria-label="Compartilhar" /> e
              depois em{" "}
              <strong className="whitespace-nowrap">
                <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> Adicionar à
                Tela de Início
              </strong>
              .
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Abre direto da tela do celular, em tela cheia, como um aplicativo.
            </p>
          )}
        </div>
      </div>
      {ios ? null : (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={dispensar}>
            Agora não
          </Button>
          <Button
            size="sm"
            disabled={isInstalling}
            onClick={async () => {
              const ok = await triggerInstall();
              if (!ok) dispensar();
            }}
          >
            <Download /> Instalar
          </Button>
        </div>
      )}
    </div>
  );
}
