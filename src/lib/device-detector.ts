/**
 * Device detection utilities for identifying Android and mobile platforms.
 * Used to optimize experience and offer platform-specific features.
 */

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasWebShare: boolean;
  hasNotifications: boolean;
  canInstallPWA: boolean;
  userAgent: string;
}

export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();

  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMobile =
    isAndroid ||
    isIOS ||
    /mobile|webos|blackberry|windows phone/.test(userAgent);
  const isTablet =
    /ipad|android(?!.*mobile)/.test(userAgent) || (isMobile && window.innerWidth > 768);
  const isDesktop = !isMobile;

  const hasWebShare = Boolean(navigator.share);
  const hasNotifications =
    typeof Notification !== "undefined" && Notification.permission !== "denied";
  const canInstallPWA =
    isAndroid &&
    "serviceWorker" in navigator &&
    "storage" in navigator &&
    "estimate" in navigator.storage;

  return {
    isAndroid,
    isIOS,
    isMobile,
    isTablet,
    isDesktop,
    hasWebShare,
    hasNotifications,
    canInstallPWA,
    userAgent,
  };
}

/**
 * Check if Web Share API is available and can share to apps like Google Calendar
 */
export function canShareToCalendar(): boolean {
  return Boolean(navigator.share);
}

/**
 * Share event data to native apps (Android Calendar, etc)
 */
export async function shareEventToCalendar(eventData: {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  url?: string;
}): Promise<boolean> {
  if (!navigator.share) return false;

  try {
    const shareText = `
${eventData.title}

${eventData.description}

Início: ${eventData.startTime.toLocaleString("pt-BR")}
Fim: ${eventData.endTime.toLocaleString("pt-BR")}
${eventData.url ? `\n${eventData.url}` : ""}
    `.trim();

    await navigator.share({
      title: eventData.title,
      text: shareText,
      url: eventData.url || window.location.href,
    });

    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled
      return false;
    }
    console.error("Share failed:", error);
    return false;
  }
}

/**
 * Request notification permission on Android
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Notification permission denied:", error);
      return false;
    }
  }

  return false;
}

/**
 * Send a local notification (useful for schedule reminders on Android)
 */
export async function sendNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      badge: "/favicon.svg",
      icon: "/favicon.svg",
      ...options,
    });
  }
}

/**
 * Get viewport size to detect device orientation
 */
export function getViewportSize(): {
  width: number;
  height: number;
  isPortrait: boolean;
} {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
  };
}

/**
 * Detect if running as PWA installed on Android
 */
export function isInstalledPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}
