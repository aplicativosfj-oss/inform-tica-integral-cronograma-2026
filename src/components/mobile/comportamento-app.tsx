import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

function ehIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function ehAppInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function temJanelaAberta() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-tela-cheia]',
    ),
  );
}

/**
 * Pequenos ajustes para o site se comportar como aplicativo no celular:
 *
 * - iPhone: o Safari dá zoom sozinho ao tocar num campo com letra menor que
 *   16px e a tela fica "torta". `maximum-scale=1` impede só esse zoom
 *   automático — no iPhone a pessoa continua podendo ampliar com os dedos.
 *   (No Android isso travaria o zoom de pinça, por isso fica só no iPhone.)
 * - App instalado no iPhone: não existe o gesto de voltar do Safari. Arrastar
 *   da borda esquerda para a direita volta uma tela, como nos apps.
 * - Marca o <html> com `app-instalado` quando aberto pelo ícone da tela inicial.
 */
export function ComportamentoApp() {
  const router = useRouter();

  useEffect(() => {
    const ios = ehIOS();
    const instalado = ehAppInstalado();
    if (instalado) document.documentElement.classList.add("app-instalado");

    if (ios) {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
      if (meta && !meta.content.includes("maximum-scale")) {
        meta.content = `${meta.content}, maximum-scale=1`;
      }
    }

    if (!(ios && instalado)) return;

    let inicio: { x: number; y: number; t: number } | null = null;

    const aoTocar = (e: TouchEvent) => {
      const toque = e.touches[0];
      inicio =
        toque && e.touches.length === 1 && toque.clientX <= 24 && !temJanelaAberta()
          ? { x: toque.clientX, y: toque.clientY, t: Date.now() }
          : null;
    };
    const aoSoltar = (e: TouchEvent) => {
      const toque = e.changedTouches[0];
      if (!inicio || !toque) return;
      const dx = toque.clientX - inicio.x;
      const dy = Math.abs(toque.clientY - inicio.y);
      const rapido = Date.now() - inicio.t < 700;
      inicio = null;
      if (dx > 70 && dy < 50 && rapido && router.history.canGoBack()) router.history.back();
    };

    window.addEventListener("touchstart", aoTocar, { passive: true });
    window.addEventListener("touchend", aoSoltar, { passive: true });
    return () => {
      window.removeEventListener("touchstart", aoTocar);
      window.removeEventListener("touchend", aoSoltar);
    };
  }, [router]);

  return null;
}
