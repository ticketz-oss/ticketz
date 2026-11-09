import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { Ticket, Contact } from "../types";
import { isPrivateName, isWhatsappPrivate } from "../services/privacyService";
import { showNativeStatusNotification } from "../services/nativeNotificationPlugin";

export type SoundChoice = "chat_notify" | "sound";

export interface NotificationToast {
  id: string;
  ticketId: number;
  ticketUuid?: string;
  contactName: string;
  contactNumber?: string;
  profilePicUrl?: string;
  messageBody: string;
  time: string;
  queueName?: string;
  queueColor?: string;
  ticket?: Ticket;
}

interface NotificationContextType {
  volume: number; // 0 to 1
  setVolume: (vol: number) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  soundChoice: SoundChoice;
  setSoundChoice: (choice: SoundChoice) => void;
  desktopEnabled: boolean;
  setDesktopEnabled: (enabled: boolean) => void;
  inAppPopupEnabled: boolean;
  setInAppPopupEnabled: (enabled: boolean) => void;
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  playNotificationSound: (overrideChoice?: SoundChoice) => void;
  playTestSound: () => void;
  toasts: NotificationToast[];
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  notifyNewMessage: (params: {
    ticket: Ticket;
    message: any;
    contact?: Contact;
    isCurrentTicketOpen: boolean;
    privateLinesHidden?: boolean;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEYS = {
  volume: "chatv2_notify_volume",
  muted: "chatv2_notify_muted",
  soundChoice: "chatv2_notify_sound",
  desktopEnabled: "chatv2_notify_desktop",
  inAppPopupEnabled: "chatv2_notify_inapp",
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Volume: 0.0 to 1.0 (default 0.8)
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.volume);
      return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.8;
    } catch {
      return 0.8;
    }
  });

  // Muted
  const [muted, setMutedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.muted) === "true";
    } catch {
      return false;
    }
  });

  // Sound Choice: chat_notify vs sound
  const [soundChoice, setSoundChoiceState] = useState<SoundChoice>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.soundChoice);
      return saved === "sound" ? "sound" : "chat_notify";
    } catch {
      return "chat_notify";
    }
  });

  // Desktop Notifications Toggle
  const [desktopEnabled, setDesktopEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.desktopEnabled);
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  // In-App Popups Toggle
  const [inAppPopupEnabled, setInAppPopupEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.inAppPopupEnabled);
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  // Browser Permission State
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  });

  // Toasts
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  // Browser Autoplay Unlock: Unlock audio upon first user click anywhere in the window
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const dummy = new Audio("/sounds/chat_notify.mp3");
        dummy.volume = 0.01;
        dummy.play().then(() => {
          dummy.pause();
        }).catch(() => {});
      } catch {}
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Refs for callbacks
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const soundChoiceRef = useRef(soundChoice);
  soundChoiceRef.current = soundChoice;
  const desktopEnabledRef = useRef(desktopEnabled);
  desktopEnabledRef.current = desktopEnabled;
  const inAppPopupEnabledRef = useRef(inAppPopupEnabled);
  inAppPopupEnabledRef.current = inAppPopupEnabled;

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    try {
      localStorage.setItem(STORAGE_KEYS.volume, String(clamped));
    } catch {}
  };

  const setMuted = (isMuted: boolean) => {
    setMutedState(isMuted);
    try {
      localStorage.setItem(STORAGE_KEYS.muted, String(isMuted));
    } catch {}
  };

  const setSoundChoice = (choice: SoundChoice) => {
    setSoundChoiceState(choice);
    try {
      localStorage.setItem(STORAGE_KEYS.soundChoice, choice);
    } catch {}
  };

  const setDesktopEnabled = (enabled: boolean) => {
    setDesktopEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEYS.desktopEnabled, String(enabled));
    } catch {}
    if (enabled && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((res) => {
          setPermissionStatus(res);
        });
      }
    }
  };

  const setInAppPopupEnabled = (enabled: boolean) => {
    setInAppPopupEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEYS.inAppPopupEnabled, String(enabled));
    } catch {}
  };

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      setPermissionStatus(res);
      return res === "granted";
    } catch {
      return false;
    }
  };

  // Web Audio synth fallback if mp3 playback is blocked
  const playWebAudioFallback = (vol: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(vol * 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // Play audio notification
  const playNotificationSound = useCallback((overrideChoice?: SoundChoice) => {
    if (mutedRef.current || volumeRef.current <= 0) return;

    const choice = overrideChoice || soundChoiceRef.current;
    const file = choice === "sound" ? "/sounds/sound.mp3" : "/sounds/chat_notify.mp3";

    try {
      const audio = new Audio(file);
      audio.volume = volumeRef.current;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("HTML5 audio playback blocked, trying Web Audio fallback:", err);
          playWebAudioFallback(volumeRef.current);
        });
      }
    } catch {
      playWebAudioFallback(volumeRef.current);
    }
  }, []);

  const playTestSound = () => {
    playNotificationSound();
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Format message text preview for notifications
  const formatBodyPreview = (msg: any): string => {
    if (!msg) return "Nova mensagem";
    const body = msg.body || "";
    if (body.startsWith('{"ticketzvCard"')) return "🪪 Contato compartilhado";
    if (msg.mediaType === "image" || body.includes(".jpg") || body.includes(".png") || body.includes(".jpeg")) {
      return "📷 Foto";
    }
    if (msg.mediaType === "audio" || body.includes(".mp3") || body.includes(".ogg")) {
      return "🎵 Mensagem de voz";
    }
    if (msg.mediaType === "video" || body.includes(".mp4")) {
      return "🎥 Vídeo";
    }
    if (msg.mediaType === "document" || body.includes(".pdf")) {
      return "📄 Documento";
    }
    return body || "Nova mensagem";
  };

  // Notify incoming message
  const notifyNewMessage = useCallback(
    (params: {
      ticket: Ticket;
      message: any;
      contact?: Contact;
      isCurrentTicketOpen: boolean;
      privateLinesHidden?: boolean;
    }) => {
      const { ticket, message, contact, isCurrentTicketOpen, privateLinesHidden } = params;

      // 1. If line/queue is private and privacy lock is active, completely skip notification!
      if (privateLinesHidden) {
        if (
          isPrivateName(ticket.queue?.name) ||
          isPrivateName(ticket.whatsapp?.name) ||
          isWhatsappPrivate(ticket.whatsappId, ticket.whatsapp?.name)
        ) {
          return;
        }
      }

      // 2. Play sound
      playNotificationSound();

      // 3. If user is currently looking at this exact ticket and tab is visible, don't popup desktop or in-app toast
      const isTabVisible = document.visibilityState === "visible";
      if (isCurrentTicketOpen && isTabVisible) {
        return;
      }

      const contactName = contact?.name || ticket.contact?.name || "Contato";
      const contactNumber = contact?.number || ticket.contact?.number || "";
      const profilePicUrl = contact?.profilePicUrl || ticket.contact?.profilePicUrl || "";
      const textPreview = formatBodyPreview(message);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Native Android Notification (works in background / status bar)
      showNativeStatusNotification(
        `${contactName} - Ticketz Neo`,
        `${timeStr} • ${textPreview}`,
        ticket.id
      );

      // 4. Desktop Web Notification (if enabled and supported)
      if (
        desktopEnabledRef.current &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notifOptions: any = {
            body: `${timeStr} • ${textPreview}`,
            icon: profilePicUrl || "/favicon.svg",
            tag: String(ticket.id),
            renotify: true,
          };
          const notif = new Notification(`${contactName} - Ticketz Neo`, notifOptions);

          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (e) {
          console.warn("Desktop notification error:", e);
        }
      }

      // 5. In-App Toast Popup (if enabled)
      if (inAppPopupEnabledRef.current) {
        const toastId = `${ticket.id}-${Date.now()}`;
        const newToast: NotificationToast = {
          id: toastId,
          ticketId: ticket.id,
          ticketUuid: ticket.uuid,
          contactName,
          contactNumber,
          profilePicUrl,
          messageBody: textPreview,
          time: timeStr,
          queueName: ticket.queue?.name,
          queueColor: ticket.queue?.color,
          ticket,
        };

        setToasts((prev) => {
          // Keep at most 3 newest toasts
          const filtered = prev.filter((t) => t.ticketId !== ticket.id);
          return [newToast, ...filtered].slice(0, 3);
        });

        // Auto dismiss after 7 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 7000);
      }
    },
    [playNotificationSound]
  );

  return (
    <NotificationContext.Provider
      value={{
        volume,
        setVolume,
        muted,
        setMuted,
        soundChoice,
        setSoundChoice,
        desktopEnabled,
        setDesktopEnabled,
        inAppPopupEnabled,
        setInAppPopupEnabled,
        permissionStatus,
        requestPermission,
        playNotificationSound,
        playTestSound,
        toasts,
        dismissToast,
        clearAllToasts,
        notifyNewMessage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export default NotificationContext;
