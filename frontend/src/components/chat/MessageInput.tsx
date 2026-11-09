import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Send,
  Paperclip,
  Mic,
  Trash2,
  Zap,
  Signature,
  X,
  Smile,
  Camera,
  Image as ImageIcon,
  FileText,
  MapPin,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useEscapeKey } from "../common/useEscapeKey";
import api from "../../services/api";
import socketService from "../../services/socket";
import MediaPreviewModal from "../common/MediaPreviewModal";
import SendPixModal from "../modals/SendPixModal";
import EmojiStickerPicker, { normalizeStickerUrl } from "./EmojiStickerPicker";
import type { MediaUploadItem, Message } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useTickets } from "../../context/TicketsContext";
import { getSignMessagePreference, setSignMessagePreference } from "../../services/privacyService";

interface MessageInputProps {
  ticketId: number;
  whatsappId?: number | null;
  whatsappName?: string;
  replyingMessage?: Message | null;
  onCancelReply?: () => void;
  onMessageSent: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  ticketId,
  whatsappId,
  whatsappName,
  replyingMessage,
  onCancelReply,
  onMessageSent,
}) => {
  const { user } = useAuth();
  const { setSearchQuery, setActiveModal } = useTickets();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [dropModalFiles, setDropModalFiles] = useState<File[]>([]);
  const [quickMessages, setQuickMessages] = useState<{ id: number; shortcode: string; message: string }[]>([]);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedQuickIndex, setSelectedQuickIndex] = useState(0);
  const quickListRef = useRef<HTMLDivElement | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Close menus/popups or cancel reply on Escape or Android Back
  useEscapeKey(() => {
    if (showEmojiPicker) setShowEmojiPicker(false);
    else if (showAttachMenu) setShowAttachMenu(false);
    else if (replyingMessage) onCancelReply?.();
  }, showEmojiPicker || showAttachMenu || Boolean(replyingMessage));

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showAttachMenu]);

  // Convert DataUrl string to File object synchronously in memory
  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Listen for restored results if Android killed MainActivity while in Camera
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let removeListener: (() => void) | null = null;
    App.addListener("appRestoredResult", async (data: any) => {
      if (data?.pluginId === "Camera" && data?.methodName === "getPhoto" && data?.success) {
        const photo = data.data;
        if (photo?.webPath) {
          try {
            const response = await fetch(photo.webPath);
            const blob = await response.blob();
            const ext = photo.format || "jpg";
            const file = new File([blob], `camera_${Date.now()}.${ext}`, {
              type: `image/${ext === "png" ? "png" : "jpeg"}`,
            });
            setDropModalFiles([file]);
          } catch (e) {
            console.error("Failed to restore photo:", e);
          }
        } else if (photo?.dataUrl) {
          const ext = photo.format || "jpg";
          const file = dataUrlToFile(photo.dataUrl, `camera_${Date.now()}.${ext}`);
          setDropModalFiles([file]);
        }
      }
    }).then((handle) => {
      removeListener = () => handle.remove();
    }).catch(() => {});

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  // Launch device camera directly via Capacitor or fallback to HTML input
  const handleLaunchCamera = async () => {
    setShowAttachMenu(false);
    (window as any).__cameraActive = true;
    try {
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
      const photo = await CapCamera.getPhoto({
        quality: 80,
        width: 1280,
        height: 1280,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        correctOrientation: true,
        saveToGallery: false,
      });
      if (photo?.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const ext = photo.format || "jpg";
        const file = new File([blob], `camera_${Date.now()}.${ext}`, {
          type: `image/${ext === "png" ? "png" : "jpeg"}`,
        });
        setDropModalFiles([file]);
      } else if (photo?.dataUrl) {
        const ext = photo.format || "jpg";
        const file = dataUrlToFile(photo.dataUrl, `camera_${Date.now()}.${ext}`);
        setDropModalFiles([file]);
      }
    } catch (err: any) {
      if (err?.message !== "User cancelled photos app") {
        cameraInputRef.current?.click();
      }
    } finally {
      setTimeout(() => {
        (window as any).__cameraActive = false;
      }, 1200);
    }
  };

  // Launch device native photo picker via Capacitor or fallback to HTML input
  const handleLaunchGallery = async () => {
    setShowAttachMenu(false);
    (window as any).__cameraActive = true;
    try {
      const result = await CapCamera.pickImages({
        quality: 85,
        limit: 15,
      });
      if (result?.photos && result.photos.length > 0) {
        const files: File[] = [];
        for (const [idx, p] of result.photos.entries()) {
          const res = await fetch(p.webPath);
          const blob = await res.blob();
          const ext = p.format || "jpg";
          files.push(
            new File([blob], `foto_${Date.now()}_${idx}.${ext}`, {
              type: `image/${ext === "jpg" ? "jpeg" : ext}`,
            })
          );
        }
        setDropModalFiles(files);
      }
    } catch (err: any) {
      if (err?.message !== "User cancelled photos app") {
        galleryInputRef.current?.click();
      }
    } finally {
      setTimeout(() => {
        (window as any).__cameraActive = false;
      }, 1200);
    }
  };

  const emitPresence = useCallback(
    (presence: "composing" | "recording" | "paused") => {
      try {
        const socket = socketService.getSocket();
        if (socket && ticketId) {
          socket.emit("presenceUpdate", { ticketId, presence });
        }
      } catch {}
    },
    [ticketId]
  );

  // Clear typing presence and recording timer on unmount or ticket change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      cleanupAudioAnalyser();
      emitPresence("paused");
    };
  }, [ticketId, emitPresence]);

  // Signature toggle: persisted in localStorage per connection (e.g. Empresa enabled, Particular disabled)
  const [signMessage, setSignMessage] = useState<boolean>(() =>
    getSignMessagePreference(whatsappId, whatsappName)
  );

  // Update signature toggle whenever conversation connection changes
  useEffect(() => {
    setSignMessage(getSignMessagePreference(whatsappId, whatsappName));
  }, [whatsappId, whatsappName]);

  const toggleSign = () => {
    setSignMessage((prev) => {
      const next = !prev;
      setSignMessagePreference(whatsappId, next);
      return next;
    });
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevTicketIdRef = useRef<number>(ticketId);

  // Audio visualizer & voice activity detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [voiceLevels, setVoiceLevels] = useState<number[]>([12, 16, 25, 18, 12, 22, 35, 20, 15, 12, 18, 28, 16, 12]);

  // Hold-to-record & Click-to-lock refs
  const pointerDownTimeRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const isLockedRecordingRef = useRef<boolean>(false);
  const isStartingRecordingRef = useRef<boolean>(false);
  const pendingStopRef = useRef<boolean>(false);
  const isFinishingRef = useRef<boolean>(false);
  const lastFinishTimeRef = useRef<number>(0);

  const fetchQuickMessages = () => {
    api
      .get<any>("/quick-messages")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.records || [];
        setQuickMessages(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchQuickMessages();
  }, []);

  // Draft persistence across ticket transitions + autofocus
  useEffect(() => {
    // 1. Save draft of previous ticket
    const prevId = prevTicketIdRef.current;
    if (prevId && prevId !== ticketId) {
      try {
        const stored = JSON.parse(localStorage.getItem("chatv2_ticket_drafts") || "{}");
        if (text.trim()) {
          stored[prevId] = text;
        } else {
          delete stored[prevId];
        }
        localStorage.setItem("chatv2_ticket_drafts", JSON.stringify(stored));
      } catch {}
    }

    // 2. Load draft for newly selected ticket
    try {
      const stored = JSON.parse(localStorage.getItem("chatv2_ticket_drafts") || "{}");
      const currentDraft = stored[ticketId] || "";
      setText(currentDraft);
    } catch {
      setText("");
    }

    prevTicketIdRef.current = ticketId;

    // 3. Auto-position cursor in textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 20);
  }, [ticketId]);

  useEffect(() => {
    if (text.startsWith("/")) {
      setShowQuickModal(true);
      setSelectedQuickIndex(0);
      fetchQuickMessages();
    } else {
      setShowQuickModal(false);
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Send typing presence with debounce
    emitPresence("composing");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitPresence("paused");
    }, 3000);
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 10);
  };

  const handleSendStickerUrl = async (stickerUrl: string) => {
    try {
      const fullUrl = normalizeStickerUrl(stickerUrl);
      let blob: Blob;

      try {
        const res = await fetch(fullUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
      } catch {
        // Fallback via axios with full URL
        const res = await axios.get(fullUrl, { responseType: "blob" });
        blob = res.data;
      }

      const file = new File([blob], "sticker.webp", { type: "image/webp" });
      const formData = new FormData();
      formData.append("medias", file, "sticker.webp");
      formData.append("body", "");
      formData.append("fromMe", "true");
      if (replyingMessage) {
        formData.append("quotedMsg", JSON.stringify(replyingMessage));
      }
      await api.post(`/messages/${ticketId}`, formData);

      // Save to recent stickers in localStorage & increment usage count
      try {
        const stored = JSON.parse(localStorage.getItem("chatv2_recent_stickers") || "[]");
        const filtered = stored.filter((s: string) => s !== fullUrl);
        localStorage.setItem("chatv2_recent_stickers", JSON.stringify([fullUrl, ...filtered].slice(0, 50)));

        const usage: Record<string, number> = JSON.parse(localStorage.getItem("chatv2_sticker_usage") || "{}");
        usage[fullUrl] = (usage[fullUrl] || 0) + 1;
        localStorage.setItem("chatv2_sticker_usage", JSON.stringify(usage));
      } catch {}

      setSearchQuery("");
      onCancelReply?.();
      onMessageSent();
      setShowEmojiPicker(false);
    } catch (err: any) {
      console.error("Error sending sticker url:", err);
      alert("Erro ao enviar figurinha: " + (err?.response?.data?.message || err?.message || "falha ao processar"));
    }
  };

  const handleUploadStickerFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("medias", file, file.name || "sticker.webp");
      formData.append("body", "");
      formData.append("fromMe", "true");
      if (replyingMessage) {
        formData.append("quotedMsg", JSON.stringify(replyingMessage));
      }
      await api.post(`/messages/${ticketId}`, formData);
      setSearchQuery("");
      onCancelReply?.();
      onMessageSent();
      setShowEmojiPicker(false);
    } catch (err: any) {
      console.error("Error uploading sticker:", err);
      alert("Erro ao enviar figurinha: " + (err?.response?.data?.message || err?.message || "falha no envio"));
    }
  };

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitPresence("paused");

    // Apply signature if enabled
    let bodyToSend = trimmed;
    if (signMessage && user?.name) {
      bodyToSend = `*${user.name}:*\n${trimmed}`;
    }

    try {
      setText("");
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Clear draft for this ticket
      try {
        const stored = JSON.parse(localStorage.getItem("chatv2_ticket_drafts") || "{}");
        delete stored[ticketId];
        localStorage.setItem("chatv2_ticket_drafts", JSON.stringify(stored));
      } catch {}

      const payload: any = {
        body: bodyToSend,
        fromMe: true,
      };

      if (replyingMessage) {
        payload.quotedMsg = replyingMessage;
      }

      await api.post(`/messages/${ticketId}`, payload);
      setSearchQuery("");
      onCancelReply?.();
      onMessageSent();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSendPix = async (pixData: { key: string; keyType: string; merchantName: string }) => {
    try {
      const payload: any = {
        body: JSON.stringify({
          pix: {
            key: pixData.key,
            key_type: pixData.keyType,
            merchant_name: pixData.merchantName,
          },
        }),
        fromMe: true,
      };
      if (replyingMessage) {
        payload.quotedMsg = replyingMessage;
      }
      await api.post(`/messages/${ticketId}`, payload);
      setSearchQuery("");
      onCancelReply?.();
      onMessageSent();
    } catch (err) {
      console.error("Error sending Pix:", err);
      throw err;
    }
  };

  const handleSendLocation = async (locData?: {
    degreesLatitude: number;
    degreesLongitude: number;
    name: string;
    address: string;
  }) => {
    try {
      const payload: any = {
        body: JSON.stringify({
          location: locData || {
            degreesLatitude: -23.55052,
            degreesLongitude: -46.633308,
            name: "Localização",
            address: "Endereço da Empresa",
          },
        }),
        fromMe: true,
      };
      if (replyingMessage) {
        payload.quotedMsg = replyingMessage;
      }
      await api.post(`/messages/${ticketId}`, payload);
      setSearchQuery("");
      onCancelReply?.();
      onMessageSent();
    } catch (err) {
      console.error("Error sending Location:", err);
      throw err;
    }
  };

  const formatQuickDisplay = (msg: string) => {
    if (msg.startsWith('{"location"')) {
      try {
        const parsed = JSON.parse(msg);
        const loc = parsed.location;
        return `📍 ${loc.name || "Localização"}: ${loc.address}`;
      } catch {}
    }
    if (msg.startsWith('{"pix"')) {
      try {
        const parsed = JSON.parse(msg);
        const pix = parsed.pix;
        return `❖ Chave Pix (${pix.key_type}): ${pix.key} - ${pix.merchant_name}`;
      } catch {}
    }
    return msg;
  };

  const handleSelectQuick = (q: { id: number; shortcode: string; message: string }) => {
    setShowQuickModal(false);
    setText("");
    if (q.message.startsWith('{"location"')) {
      try {
        const parsed = JSON.parse(q.message);
        handleSendLocation(parsed.location);
        return;
      } catch {}
    }
    if (q.message.startsWith('{"pix"')) {
      try {
        const parsed = JSON.parse(q.message);
        handleSendPix({
          key: parsed.pix.key,
          keyType: parsed.pix.key_type || "CNPJ",
          merchantName: parsed.pix.merchant_name || "Beneficiário",
        });
        return;
      } catch {}
    }

    setText(q.message);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 10);
  };

  const handleSendMediaBundle = async (items: MediaUploadItem[], captionText: string) => {
    const formData = new FormData();
    formData.append("fromMe", "true");

    let rawCaption = captionText.trim();
    if (rawCaption && signMessage && user?.name) {
      rawCaption = `*${user.name}:*\n${rawCaption}`;
    }

    if (rawCaption) {
      formData.append("body", rawCaption);
    }

    items.forEach((item) => {
      formData.append("medias", item.file, item.name);
    });

    try {
      await api.post(`/messages/${ticketId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDropModalFiles([]);
      setSearchQuery("");
      onMessageSent();
    } catch (err) {
      console.error("Error sending media bundle:", err);
      throw err;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const files = Array.from(e.clipboardData.files);
      setDropModalFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setDropModalFiles(files);
      e.target.value = "";
    }
  };

  const cleanupAudioAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startRecording = async () => {
    if (isStartingRecordingRef.current) return;
    isStartingRecordingRef.current = true;
    pendingStopRef.current = false;
    isFinishingRef.current = false;
    try {
      cleanupAudioAnalyser();
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      // If user released while getUserMedia was resolving
      if (pendingStopRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        isStartingRecordingRef.current = false;
        pendingStopRef.current = false;
        return;
      }

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          options = { mimeType: "audio/ogg;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        }
      }
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup Live Voice Activity Waveform
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevels = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const normalized = Math.min(Math.max(avg / 2.2, 10), 100);

            setVoiceLevels((prev) => [...prev.slice(1), normalized]);
            animFrameRef.current = requestAnimationFrame(updateLevels);
          };
          updateLevels();
        }
      } catch (err) {
        console.warn("Audio analyser error:", err);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(200);
      isStartingRecordingRef.current = false;
      setIsRecording(true);
      setRecordSeconds(0);
      emitPresence("recording");

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      // If user released the hold while recorder was starting
      if (pendingStopRef.current) {
        pendingStopRef.current = false;
        setTimeout(() => {
          finishAndSendAudio();
        }, 150);
      }
    } catch (err) {
      isStartingRecordingRef.current = false;
      pendingStopRef.current = false;
      console.error("Microphone access denied:", err);
      alert("Permissão de microfone negada.");
    }
  };

  const cancelRecording = () => {
    isStartingRecordingRef.current = false;
    pendingStopRef.current = false;
    isFinishingRef.current = false;
    cleanupAudioAnalyser();
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch {}
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
    emitPresence("paused");
  };

  const finishAndSendAudio = () => {
    if (isStartingRecordingRef.current) {
      pendingStopRef.current = true;
      return;
    }
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    lastFinishTimeRef.current = Date.now();

    cleanupAudioAnalyser();
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      isFinishingRef.current = false;
      return;
    }

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      try {
        recorder.stream.getTracks().forEach((track) => track.stop());
      } catch {}

      setTimeout(async () => {
        if (audioChunksRef.current.length === 0) {
          isFinishingRef.current = false;
          return;
        }
        const recordedMime = recorder.mimeType || "audio/webm";
        const ext = recordedMime.includes("ogg") ? "ogg" : "webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMime });
        if (audioBlob.size < 350) {
          isFinishingRef.current = false;
          return;
        }

        const formData = new FormData();
        const filename = `audio-record-site-${Date.now()}.${ext}`;
        formData.append("medias", audioBlob, filename);
        formData.append("body", filename);
        formData.append("fromMe", "true");

        try {
          await api.post(`/messages/${ticketId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setSearchQuery("");
          onMessageSent();
        } catch (err) {
          console.error("Error sending voice note:", err);
        } finally {
          emitPresence("paused");
          setTimeout(() => {
            isFinishingRef.current = false;
          }, 500);
        }
      }, 80);
    };

    try {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    } catch (e) {
      console.warn("Error stopping media recorder:", e);
      isFinishingRef.current = false;
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  // Hold to Record or Tap to Record Handlers
  const handleMicPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (Date.now() - lastFinishTimeRef.current < 750) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (isRecording) {
      finishAndSendAudio();
      return;
    }
    try {
      (e.currentTarget as any)?.setPointerCapture?.(e.pointerId);
    } catch {}
    pointerDownTimeRef.current = Date.now();
    startXRef.current = e.clientX;
    isHoldingRef.current = true;
    isLockedRecordingRef.current = false;
    pendingStopRef.current = false;

    const cleanupGlobalRelease = () => {
      window.removeEventListener("pointerup", handleGlobalRelease);
      window.removeEventListener("pointercancel", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
      window.removeEventListener("pointermove", handleGlobalMove);
    };

    const handleGlobalRelease = () => {
      cleanupGlobalRelease();
      handleMicPointerUp();
    };

    const handleGlobalMove = (moveEvt: PointerEvent) => {
      if (isHoldingRef.current && !isLockedRecordingRef.current) {
        const diffX = moveEvt.clientX - startXRef.current;
        if (diffX < -60) {
          isHoldingRef.current = false;
          cleanupGlobalRelease();
          cancelRecording();
        }
      }
    };

    window.addEventListener("pointerup", handleGlobalRelease);
    window.addEventListener("pointercancel", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    window.addEventListener("pointermove", handleGlobalMove);

    startRecording();
  };

  const handleMicPointerUp = (e?: React.PointerEvent<HTMLButtonElement>) => {
    if (e) {
      try {
        (e.currentTarget as any)?.releasePointerCapture?.(e.pointerId);
      } catch {}
    }
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    const holdDuration = Date.now() - pointerDownTimeRef.current;
    if (holdDuration > 280) {
      // User held the button down: stop and send immediately
      finishAndSendAudio();
    } else {
      // User tapped (< 280ms): lock recording so they can record hands-free
      isLockedRecordingRef.current = true;
    }
  };

  const handleMicPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isHoldingRef.current && !isLockedRecordingRef.current) {
      const diffX = e.clientX - startXRef.current;
      // If user drags left by more than 60px (slide to cancel)
      if (diffX < -60) {
        isHoldingRef.current = false;
        cancelRecording();
      }
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const filteredQuick = quickMessages.filter((q) => {
    const search = text.replace(/^\//, "").trim().toLowerCase();
    if (!search) return true;
    const sc = (q.shortcode || "").toLowerCase().trim();
    const msg = (q.message || "").toLowerCase();
    return sc.includes(search) || msg.includes(search);
  });

  return (
    <>
      <MediaPreviewModal
        files={dropModalFiles}
        isOpen={dropModalFiles.length > 0}
        onClose={() => setDropModalFiles([])}
        onSend={handleSendMediaBundle}
      />

      <SendPixModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        onSend={handleSendPix}
      />

      {/* Hidden file & media input triggers */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        multiple
        ref={galleryInputRef}
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* WhatsApp-Style Attachment Menu Popup */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-20 left-2 sm:left-12 z-40 w-72 sm:w-80 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2a3942] p-4 animate-fadeIn select-none"
        >
          <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center">
            {/* Documento */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition">
                <FileText size={22} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Documento
              </span>
            </button>

            {/* Câmera */}
            <button
              type="button"
              onClick={handleLaunchCamera}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition">
                <Camera size={22} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Câmera
              </span>
            </button>

            {/* Galeria */}
            <button
              type="button"
              onClick={handleLaunchGallery}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition">
                <ImageIcon size={22} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Galeria
              </span>
            </button>

            {/* Chave Pix */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setShowPixModal(true);
              }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition">
                <span className="font-bold text-lg leading-none">❖</span>
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Chave Pix
              </span>
            </button>

            {/* Localização */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                handleSendLocation();
              }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition">
                <MapPin size={22} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Localização
              </span>
            </button>

            {/* Respostas Rápidas */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setActiveModal("quickMessages");
              }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition">
                <Zap size={22} />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Rápidas
              </span>
            </button>
          </div>

          {/* Signature toggle in attachment menu */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2a3942] flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Signature size={16} className={signMessage ? "text-whatsapp-green" : "text-gray-400"} />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Assinatura ({user?.name || "Atendente"})
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSign}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                signMessage
                  ? "bg-whatsapp-green text-white"
                  : "bg-gray-100 dark:bg-[#111b21] text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {signMessage ? "Ativada" : "Desativada"}
            </button>
          </div>
        </div>
      )}

      {/* Quick messages popup when typing / */}
      {showQuickModal && filteredQuick.length > 0 && (
        <div
          ref={quickListRef}
          className="absolute bottom-16 left-4 right-4 max-w-lg bg-white dark:bg-[#202c33] rounded-xl shadow-2xl border border-gray-200 dark:border-[#374248] p-2 max-h-56 overflow-y-auto z-30 animate-fadeIn"
        >
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 px-2 py-1 flex items-center justify-between border-b border-gray-100 dark:border-[#2a3942] mb-1">
            <span className="flex items-center gap-1">
              <Zap size={12} className="text-amber-500" />
              <span>Respostas Rápidas ({filteredQuick.length})</span>
            </span>
            <span className="text-[9px] text-gray-400 normal-case">
              ↑↓ navegar • Enter selecionar • Esc fechar
            </span>
          </div>
          {filteredQuick.map((q, idx) => {
            const isSelected = idx === selectedQuickIndex;
            return (
              <div
                key={q.id}
                onClick={() => handleSelectQuick(q)}
                className={`px-3 py-2 text-xs rounded-lg cursor-pointer flex flex-col transition ${
                  isSelected
                    ? "bg-[#00a884]/15 border border-[#00a884]/30 dark:bg-[#00a884]/20"
                    : "hover:bg-gray-100 dark:hover:bg-[#111b21] border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00a884]">/{q.shortcode}</span>
                  {isSelected && (
                    <span className="text-[10px] text-[#00a884] font-medium">Enter ↵</span>
                  )}
                </div>
                <span className="text-gray-600 dark:text-gray-300 truncate mt-0.5">
                  {formatQuickDisplay(q.message)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Replying / Quoting message preview bar */}
      {replyingMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-whatsapp-dark-hover border-t border-whatsapp-light-border dark:border-whatsapp-dark-border border-l-4 border-whatsapp-green text-xs select-none animate-fadeIn">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="font-bold text-whatsapp-green truncate">
              Respondendo a {replyingMessage.contact?.name || (replyingMessage.fromMe ? "Você" : "Cliente")}
            </span>
            <span className="text-gray-500 dark:text-gray-400 truncate text-[11px]">
              {replyingMessage.body || (replyingMessage.mediaType ? `[${replyingMessage.mediaType}]` : "Mídia")}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Cancelar resposta"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main input bar */}
      <div className="p-2 sm:p-2.5 bg-whatsapp-light-panel dark:bg-whatsapp-dark-panel border-t border-whatsapp-light-border dark:border-whatsapp-dark-border flex items-end gap-1.5 sm:gap-2 select-none shrink-0 relative z-10 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Emoji & Sticker Picker Popover */}
        {showEmojiPicker && (
          <EmojiStickerPicker
            ticketId={ticketId}
            onSelectEmoji={handleSelectEmoji}
            onSelectSticker={handleSendStickerUrl}
            onUploadSticker={handleUploadStickerFile}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-red-500/10 dark:bg-red-500/20 rounded-[24px] border border-red-500/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
              <span className="text-xs font-bold text-red-500 shrink-0">
                {formatTimer(recordSeconds)}
              </span>

              {/* Real-time Voice Activity Waveform Bars */}
              <div className="flex items-center gap-0.5 h-5 px-1 overflow-hidden max-w-[100px] sm:max-w-[200px]">
                {voiceLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-red-500 rounded-full transition-all duration-75 shrink-0"
                    style={{ height: `${Math.max(3, (lvl / 100) * 18)}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-gray-400 dark:text-gray-400 hidden sm:inline select-none">
                {isHoldingRef.current ? "Deslize para a esquerda para cancelar" : "Gravando com as mãos livres"}
              </span>
              <button
                onClick={cancelRecording}
                type="button"
                className="p-1.5 rounded-full hover:bg-red-500/20 text-red-500 transition cursor-pointer"
                title="Cancelar gravação"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* WhatsApp Capsule Pill Container */
          <div className="flex-1 flex flex-col bg-white dark:bg-[#202c33] rounded-[24px] px-2 py-1 shadow-xs border border-gray-200/80 dark:border-[#2a3942] transition min-w-0">
            {/* Signature Status & Quick Toggle: Always visible so user can easily re-enable */}
            <div className="flex items-center justify-between text-[10px] select-none px-2 pb-0.5 border-b border-gray-100 dark:border-[#2a3942]/60 mb-0.5">
              {signMessage ? (
                <>
                  <button
                    type="button"
                    onClick={toggleSign}
                    className="text-whatsapp-green font-bold truncate flex items-center gap-1 hover:underline cursor-pointer"
                    title="Clique para alternar assinatura"
                  >
                    ✍️ Assinando como: *{user?.name || "Atendente"}*
                  </button>
                  <button
                    type="button"
                    onClick={toggleSign}
                    className="text-gray-400 hover:text-red-500 font-normal ml-2 shrink-0 cursor-pointer"
                    title="Desativar assinatura"
                  >
                    desativar
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-400 dark:text-gray-500 truncate">
                    ✍️ Sem assinatura
                  </span>
                  <button
                    type="button"
                    onClick={toggleSign}
                    className="text-whatsapp-green hover:underline font-semibold ml-2 shrink-0 cursor-pointer"
                    title="Ativar assinatura do atendente"
                  >
                    ativar assinatura
                  </button>
                </>
              )}
            </div>

            <div className="flex items-end gap-1 w-full">
              {/* Emoji / Sticker Toggle */}
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                }}
                type="button"
                className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition shrink-0 cursor-pointer ${
                  showEmojiPicker
                    ? "text-whatsapp-green bg-whatsapp-green/15"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#111b21]"
                }`}
                title="Emojis e Figurinhas"
              >
                <Smile size={21} />
              </button>

              {/* Auto-expanding Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (showQuickModal && filteredQuick.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSelectedQuickIndex((prev) => (prev + 1) % filteredQuick.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSelectedQuickIndex((prev) => (prev - 1 + filteredQuick.length) % filteredQuick.length);
                      return;
                    }
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      const selected = filteredQuick[selectedQuickIndex] || filteredQuick[0];
                      if (selected) {
                        handleSelectQuick(selected);
                      }
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setShowQuickModal(false);
                      return;
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                rows={1}
                placeholder="Mensagem"
                className="flex-1 bg-transparent resize-none text-[16px] sm:text-sm text-whatsapp-light-text dark:text-whatsapp-dark-text placeholder-gray-400 outline-none focus:outline-none focus:ring-0 ring-0 border-0 shadow-none max-h-28 overflow-y-auto leading-relaxed py-1 px-1"
              />

              {/* Attachment Menu (Paperclip) */}
              <button
                onClick={() => {
                  setShowAttachMenu(!showAttachMenu);
                  setShowEmojiPicker(false);
                }}
                type="button"
                className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition shrink-0 cursor-pointer ${
                  showAttachMenu
                    ? "text-whatsapp-green bg-whatsapp-green/15"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#111b21]"
                }`}
                title="Anexar (Câmera, Galeria, Documento, Pix, Localização)"
              >
                <Paperclip size={20} className={showAttachMenu ? "rotate-45 transition-transform" : "transition-transform"} />
              </button>

              {/* Quick Camera Shortcut */}
              <button
                onClick={handleLaunchCamera}
                type="button"
                className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#111b21] transition shrink-0 cursor-pointer"
                title="Tirar foto com a câmera"
              >
                <Camera size={21} />
              </button>
            </div>
          </div>
        )}

        {/* Floating Send or Voice Circular Button (Always in the same spot on the right under thumb!) */}
        {isRecording ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (Date.now() - lastFinishTimeRef.current < 600) return;
              finishAndSendAudio();
            }}
            type="button"
            className="w-11 h-11 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-full bg-whatsapp-green hover:bg-whatsapp-green-dark text-white flex items-center justify-center transition-all active:scale-95 shadow-md shrink-0 cursor-pointer select-none touch-manipulation animate-pulse"
            title="Clique para enviar o áudio gravado"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        ) : text.trim() ? (
          <button
            onClick={handleSendText}
            type="button"
            className="w-11 h-11 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-full bg-whatsapp-green hover:bg-whatsapp-green-dark text-white flex items-center justify-center transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
            title="Enviar mensagem"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        ) : (
          <button
            onPointerDown={handleMicPointerDown}
            onPointerUp={handleMicPointerUp}
            onPointerCancel={handleMicPointerUp}
            onPointerMove={handleMicPointerMove}
            type="button"
            className="w-11 h-11 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-full bg-whatsapp-green hover:bg-whatsapp-green-dark text-white flex items-center justify-center transition-all active:scale-95 shadow-md shrink-0 cursor-pointer select-none touch-none"
            title="Segure para gravar e solte para enviar, ou dê um clique para gravar"
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </>
  );
};

export default MessageInput;
