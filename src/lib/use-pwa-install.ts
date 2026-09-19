import { useEffect } from "react";
import { initPWAInstallListener, usePWAInstallStore } from "./pwa-install-store";

/**
 * Hook to initialize PWA install prompt listener
 * Should be called once in the app root (e.g., in main layout/root component)
 */
export function usePWAInstallInitializer() {
  useEffect(() => {
    const cleanup = initPWAInstallListener();
    return cleanup;
  }, []);
}

/**
 * Hook to access PWA install state and trigger installation
 */
export function usePWAInstall() {
  const promptEvent = usePWAInstallStore((state) => state.promptEvent);
  const isInstalled = usePWAInstallStore((state) => state.isInstalled);
  const isInstalling = usePWAInstallStore((state) => state.isInstalling);
  const triggerInstall = usePWAInstallStore((state) => state.triggerInstall);

  return {
    promptEvent,
    isInstalled,
    isInstalling,
    canInstall: Boolean(promptEvent),
    triggerInstall,
  };
}
