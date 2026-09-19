/**
 * Estado do convite "instalar como app" no Android. O Chrome dispara
 * `beforeinstallprompt` uma única vez, em qualquer ponto da navegação, e o
 * evento precisa ser guardado para ser reaproveitado quando o usuário
 * realmente clicar em instalar — daí um store de módulo, fora do React.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAInstallState {
  promptEvent: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isInstalling: boolean;
}

let estado: PWAInstallState = {
  promptEvent: null,
  isInstalled: false,
  isInstalling: false,
};

const ouvintes = new Set<() => void>();

function atualizar(mudanca: Partial<PWAInstallState>) {
  estado = { ...estado, ...mudanca };
  for (const ouvinte of ouvintes) ouvinte();
}

export function subscribePWAInstall(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function getPWAInstallSnapshot(): PWAInstallState {
  return estado;
}

/** Referência fixa: no SSR nada disso existe e o React exige valor estável. */
const ESTADO_SSR: PWAInstallState = {
  promptEvent: null,
  isInstalled: false,
  isInstalling: false,
};

export function getPWAInstallServerSnapshot(): PWAInstallState {
  return ESTADO_SSR;
}

export async function triggerPWAInstall(): Promise<boolean> {
  const { promptEvent } = estado;
  if (!promptEvent) return false;

  try {
    atualizar({ isInstalling: true });
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    // O evento só pode ser usado uma vez — aceito ou não, ele já queimou.
    atualizar({ promptEvent: null });
    return outcome === "accepted";
  } catch (erro) {
    console.error("Falha ao abrir o convite de instalação:", erro);
    return false;
  } finally {
    atualizar({ isInstalling: false });
  }
}

export function initPWAInstallListener() {
  if (typeof window === "undefined") return;

  const aoReceberConvite = (e: Event) => {
    e.preventDefault();
    atualizar({ promptEvent: e as BeforeInstallPromptEvent });
  };

  const aoInstalar = () => {
    atualizar({ promptEvent: null, isInstalled: true });
  };

  window.addEventListener("beforeinstallprompt", aoReceberConvite);
  window.addEventListener("appinstalled", aoInstalar);

  if (window.matchMedia("(display-mode: standalone)").matches) {
    atualizar({ isInstalled: true });
  }

  return () => {
    window.removeEventListener("beforeinstallprompt", aoReceberConvite);
    window.removeEventListener("appinstalled", aoInstalar);
  };
}
