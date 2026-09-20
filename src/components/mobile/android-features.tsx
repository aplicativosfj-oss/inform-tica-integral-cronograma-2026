import { Calendar, Bell, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  shareEventToCalendar,
  requestNotificationPermission,
  sendNotification,
} from "@/lib/device-detector";
import { useDeviceDetector } from "@/lib/use-device-detector";
import { usePWAInstall } from "@/lib/use-pwa-install";
import { useState } from "react";

export interface AndroidFeaturesProps {
  eventTitle?: string;
  eventDescription?: string;
  eventStart?: Date;
  eventEnd?: Date;
}

/**
 * Android-specific features component:
 * - Share events to Google Calendar
 * - Request/send notifications
 * - Install PWA prompt
 */
export function AndroidFeatures({
  eventTitle = "Aula de Informática",
  eventDescription = "Horário da aula no laboratório de informática",
  eventStart,
  eventEnd,
}: AndroidFeaturesProps) {
  const { device } = useDeviceDetector();
  const { canInstall, isInstalling, triggerInstall } = usePWAInstall();
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [sharingEvent, setSharingEvent] = useState(false);

  if (!device) return null;

  // Only show on Android
  if (!device.isAndroid) return null;

  const handleShareToCalendar = async () => {
    if (!eventStart || !eventEnd) return;

    setSharingEvent(true);
    const success = await shareEventToCalendar({
      title: eventTitle,
      description: eventDescription,
      startTime: eventStart,
      endTime: eventEnd,
      url: window.location.href,
    });

    if (success) {
      await sendNotification("Evento compartilhado com sucesso!", {
        body: "O evento foi adicionado ao seu calendário",
        tag: "event-shared",
      });
    }

    setSharingEvent(false);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationEnabled(true);
      await sendNotification("Notificações ativadas!", {
        body: "Você receberá alertas sobre aulas de informática",
        tag: "notifications-enabled",
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-1">
      {/* Share to Calendar button */}
      {device.hasWebShare && eventStart && eventEnd && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareToCalendar}
          disabled={sharingEvent}
          className="gap-2 text-xs sm:text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Adicionar ao calendário do Android"
        >
          <Calendar className="size-4" />
          <span className="hidden sm:inline">Calendário</span>
        </Button>
      )}

      {/* Enable Notifications button */}
      {device.hasNotifications && !notificationEnabled && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnableNotifications}
          className="gap-2 text-xs sm:text-sm cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
          title="Ativar notificações de aulas"
        >
          <Bell className="size-4" />
          <span className="hidden sm:inline">Notificações</span>
        </Button>
      )}

      {/* Install PWA button — só aparece quando o Chrome ofereceu o convite */}
      {canInstall && (
        <Button
          variant="outline"
          size="sm"
          onClick={triggerInstall}
          disabled={isInstalling}
          className="gap-2 text-xs sm:text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
          title="Instalar aplicativo no Android"
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Instalar App</span>
        </Button>
      )}

      {/* Share button for all content */}
      {device.hasWebShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.share({
                title: eventTitle,
                text: eventDescription,
                url: window.location.href,
              });
            } catch {
              // Silently handle AbortError
            }
          }}
          className="gap-2 text-xs sm:text-sm cursor-pointer hover:bg-accent/60"
          title="Compartilhar com outro aplicativo"
        >
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      )}
    </div>
  );
}
