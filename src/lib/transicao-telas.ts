import type { ParsedLocation } from "@tanstack/react-router";

type ViewTransitionOptions = { types: typeof tiposDaTransicao };

/**
 * Transição entre telas no jeito de aplicativo (só no celular/tablet):
 *
 * - "avancar": abrir uma tela nova — ela entra deslizando da direita.
 * - "voltar": voltar (botão, gesto ou tecla do Android) — a tela atual sai
 *   pela direita e a anterior reaparece.
 * - "aba": trocar de aba na barra inferior — um esmaecer rápido.
 *
 * As animações ficam no CSS (styles.css, bloco "Transição entre telas").
 */

/** As abas da barra inferior: trocar entre elas não é "entrar" numa tela. */
export const ABAS_RAIZ = new Set(["/", "/agenda", "/resultados", "/infoteca", "/aluno"]);

function caminho(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function indice(loc?: ParsedLocation): number | undefined {
  const v = (loc?.state as Record<string, unknown> | undefined)?.["__TSR_index"];
  return typeof v === "number" ? v : undefined;
}

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

export function tiposDaTransicao({
  fromLocation,
  toLocation,
  pathChanged,
}: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}): string[] | false {
  // Só troca de tela de verdade: filtros, abas internas (?aba=) e âncoras não animam.
  if (!fromLocation || !pathChanged) return false;
  // Computador segue como site; e quem pediu menos movimento não vê animação.
  if (window.innerWidth >= 1280) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const de = caminho(fromLocation.pathname);
  const para = caminho(toLocation.pathname);
  const iDe = indice(fromLocation);
  const iPara = indice(toLocation);

  if (ABAS_RAIZ.has(de) && ABAS_RAIZ.has(para)) return ["aba"];

  if (iDe !== undefined && iPara !== undefined) {
    if (iPara < iDe) {
      // No Safari (fora do app instalado) o próprio gesto de voltar já anima;
      // animar de novo deixaria a tela "pulando" duas vezes.
      if (ehIOS() && !ehAppInstalado()) return false;
      return ["voltar"];
    }
    // Redirecionamentos (replace) não são uma tela nova.
    if (iPara === iDe) return false;
  }
  return ["avancar"];
}

/**
 * Liga a transição só onde o navegador sabe separar os tipos (Chrome/Android
 * 125+, Safari 18.2+). Nos outros, a troca segue instantânea como antes — sem
 * isso o navegador esmaeceria a página inteira até ao mudar um filtro.
 */
export function transicaoPadrao(): ViewTransitionOptions | false {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  if (typeof document.startViewTransition !== "function") return false;
  if (!window.CSS?.supports?.("selector(:active-view-transition-type(a))")) return false;
  return { types: tiposDaTransicao };
}
