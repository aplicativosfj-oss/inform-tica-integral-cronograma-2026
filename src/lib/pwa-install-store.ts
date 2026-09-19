import { create } from "zustand";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallStore {
  promptEvent: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isInstalling: boolean;
  setPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (value: boolean) => void;
  setIsInstalling: (value: boolean) => void;
  triggerInstall: () => Promise<boolean>;
}

export const usePWAInstallStore = create<PWAInstallStore>((set, get) => ({
  promptEvent: null,
  isInstalled: false,
  isInstalling: false,
  setPromptEvent: (event) => set({ promptEvent: event }),
  setIsInstalled: (value) => set({ isInstalled: value }),
  setIsInstalling: (value) => set({ isInstalling: value }),
  triggerInstall: async () => {
    const { promptEvent, setIsInstalling } = get();
    if (!promptEvent) return false;

    try {
      setIsInstalling(true);
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      const success = outcome === "accepted";
      if (success) {
        set({ promptEvent: null });
      }
      return success;
    } catch (error) {
      console.error("PWA install failed:", error);
      return false;
    } finally {
      setIsInstalling(false);
    }
  },
}));

/**
 * Initialize PWA install prompt listener
 * Call this once in app root
 */
export function initPWAInstallListener() {
  if (typeof window === "undefined") return;

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
    usePWAInstallStore.setState({ promptEvent: beforeInstallPromptEvent });
  };

  const handleAppInstalled = () => {
    usePWAInstallStore.setState({ promptEvent: null, isInstalled: true });
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);

  // Check if already installed
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  ) {
    usePWAInstallStore.setState({ isInstalled: true });
  }

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
  };
}
