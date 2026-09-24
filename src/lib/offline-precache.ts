/**
 * Deixa o site (principalmente a Sala de Jogos) pronto para abrir sem
 * internet: na primeira visita online, pede ao service worker que guarde as
 * páginas públicas, os arquivos que elas usam e as fontes.
 */

export const FONTES_CSS =
  "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap";

// Só páginas públicas: as áreas de aluno e de professor exigem login e
// entram no cache normalmente quando são visitadas.
const PAGINAS_OFFLINE = ["/", "/ferramentas", "/ferramentas/sala-de-jogos", "/infoteca"];

// Refaz o pré-carregamento no máximo a cada 12 horas por aparelho.
const CHAVE = "informatica:precache-offline";
const INTERVALO_MS = 12 * 60 * 60 * 1000;

function jaFeitoRecentemente(): boolean {
  try {
    const ultimo = Number(window.localStorage.getItem(CHAVE) ?? 0);
    return Date.now() - ultimo < INTERVALO_MS;
  } catch {
    return false;
  }
}

function marcarFeito(): void {
  try {
    window.localStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    // Sem storage: apenas repete na próxima visita.
  }
}

export function precarregarOffline(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!navigator.onLine || jaFeitoRecentemente()) return;

  const iniciar = () => {
    void navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({
        type: "PRECARREGAR",
        urls: PAGINAS_OFFLINE,
        fontesCss: FONTES_CSS,
      });
      marcarFeito();
    });
  };

  // Espera a página assentar para não competir com o carregamento inicial.
  window.setTimeout(iniciar, 4000);
}
