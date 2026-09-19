import { useEffect, useSyncExternalStore } from "react";

import {
  getPWAInstallServerSnapshot,
  getPWAInstallSnapshot,
  initPWAInstallListener,
  subscribePWAInstall,
  triggerPWAInstall,
} from "./pwa-install-store";

/** Liga o listener do `beforeinstallprompt`. Chamar uma vez, na raiz do app. */
export function usePWAInstallInitializer() {
  useEffect(() => initPWAInstallListener(), []);
}

export function usePWAInstall() {
  const estado = useSyncExternalStore(
    subscribePWAInstall,
    getPWAInstallSnapshot,
    getPWAInstallServerSnapshot,
  );

  return {
    isInstalled: estado.isInstalled,
    isInstalling: estado.isInstalling,
    canInstall: Boolean(estado.promptEvent),
    triggerInstall: triggerPWAInstall,
  };
}
