import { useEffect, useState } from "react";
import { detectDevice, type DeviceInfo } from "./device-detector";

/**
 * Hook to detect device type and capabilities on Android/mobile platforms.
 * Automatically detects on mount and listens for orientation changes.
 */
export function useDeviceDetector() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial detection
    const info = detectDevice();
    setDevice(info);
    setIsLoading(false);

    // Re-detect on orientation/resize changes
    const handleResize = () => {
      setDevice(detectDevice());
    };

    window.addEventListener("orientationchange", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { device, isLoading };
}

/**
 * Hook to get viewport orientation (portrait/landscape)
 */
export function useDeviceOrientation() {
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const updateOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    updateOrientation();

    window.addEventListener("orientationchange", updateOrientation);
    window.addEventListener("resize", updateOrientation);

    return () => {
      window.removeEventListener("orientationchange", updateOrientation);
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  return { isPortrait };
}

/**
 * Hook to check if running as installed PWA on Android
 */
export function useInstalledPWA() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(installed);
  }, []);

  return { isInstalled };
}
