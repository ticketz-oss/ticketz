import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tooltip,
  Typography
} from "@material-ui/core";
import {
  CallEnd,
  FiberManualRecord,
  Mic,
  MicOff,
  Phone,
  PhoneDisabled,
  Subtitles
} from "@material-ui/icons";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { toast } from "react-toastify";
import api from "../../services/api";
import { SocketContext } from "../Socket/SocketContext";
import { openVoiceWebRTC } from "../../helpers/voiceWebRTC";
import { validVoiceCallId } from "../../helpers/voiceCallId";
import { i18n } from "../../translate/i18n";

export const VoiceCallContext = createContext({});

export const CallIdentity = ({ call }) => {
  const name = call?.contactName || call?.number || "-";
  return (
    <>
      <Typography variant="h6">{name}</Typography>
      {call?.number && call.number !== name && (
        <Typography color="textSecondary">{call.number}</Typography>
      )}
    </>
  );
};

export const DraggableCallCard = ({
  active,
  duration,
  muted,
  busy,
  artifactBusy,
  onMute,
  onEnd,
  onArtifact,
  position
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform } =
    useDraggable({ id: "active-voice-call" });
  const x = position.x + (transform?.x || 0);
  const y = position.y + (transform?.y || 0);

  return (
    <Paper
      ref={setNodeRef}
      elevation={12}
      style={{
        position: "fixed",
        zIndex: 1400,
        width: "min(390px, calc(100vw - 24px))",
        left: "max(12px, calc(50% - 195px))",
        bottom: 24,
        transform: `translate3d(${x}px, ${y}px, 0)`
      }}
      {...attributes}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        style={{
          cursor: "move",
          padding: "16px 20px 8px",
          touchAction: "none"
        }}
      >
        <Typography variant="h6">{i18n.t("voiceCalls.active")}</Typography>
      </div>
      <div style={{ padding: "8px 20px" }}>
        <CallIdentity call={active} />
        <Typography color="textSecondary">{duration}</Typography>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 4,
          padding: "8px 12px 14px"
        }}
      >
        <Tooltip title={i18n.t("voiceCalls.transcribe")}>
          <span>
            <IconButton
              onClick={() =>
                onArtifact("transcription", !active.transcriptionEnabled)
              }
              disabled={artifactBusy}
              color={active.transcriptionEnabled ? "primary" : "default"}
              aria-label={i18n.t("voiceCalls.transcribe")}
            >
              <Subtitles />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={i18n.t("voiceCalls.record")}>
          <span>
            <IconButton
              onClick={() => onArtifact("recording", !active.recordingEnabled)}
              disabled={artifactBusy}
              color={active.recordingEnabled ? "secondary" : "default"}
              aria-label={i18n.t("voiceCalls.record")}
            >
              <FiberManualRecord />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton onClick={onMute} aria-label={i18n.t("voiceCalls.mute")}>
          {muted ? <MicOff /> : <Mic />}
        </IconButton>
        <Button
          onClick={onEnd}
          color="secondary"
          variant="contained"
          disabled={busy}
          startIcon={<CallEnd />}
        >
          {i18n.t("voiceCalls.end")}
        </Button>
      </div>
    </Paper>
  );
};

export const accumulateDragPosition = (position, delta) => ({
  x: position.x + delta.x,
  y: position.y + delta.y
});

export const ActiveCallCard = props => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  return (
    <DndContext
      onDragEnd={({ delta }) =>
        setPosition(previous => accumulateDragPosition(previous, delta))
      }
    >
      <DraggableCallCard {...props} position={position} />
    </DndContext>
  );
};

const startRinging = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return () => {};
  let context;
  try {
    context = new AudioContextClass();
  } catch {
    return () => {};
  }
  let stopped = false;
  const ring = () => {
    if (stopped) return;
    [440, 480].forEach(frequency => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.12;
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.8);
    });
  };
  ring();
  const interval = setInterval(ring, 3000);
  return () => {
    stopped = true;
    clearInterval(interval);
    context.close().catch(() => {});
  };
};

export function VoiceCallProvider({ children }) {
  const socketManager = useContext(SocketContext);
  const [incoming, setIncoming] = useState(null);
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState(false);
  const [artifactBusy, setArtifactBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef(null);
  const activeIdRef = useRef(null);

  const closeMedia = useCallback(() => {
    mediaRef.current?.close();
    mediaRef.current = null;
    activeIdRef.current = null;
    setActive(null);
    setMuted(false);
  }, []);

  useEffect(() => {
    if (!incoming) return undefined;
    return startRinging();
  }, [incoming]);

  useEffect(() => {
    if (!active?.acceptedAt) {
      setElapsed(0);
      return undefined;
    }
    const update = () =>
      setElapsed(
        Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(active.acceptedAt).getTime()) / 1000
          )
        )
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return undefined;
    const socket = socketManager.GetSocket(companyId);
    const onIncoming = call => {
      if (validVoiceCallId(call?.id) && !activeIdRef.current) {
        setIncoming(call);
      }
    };
    const onUpdated = call => {
      if (!validVoiceCallId(call?.id)) return;
      if (call.state === "accepted") {
        setIncoming(current => (current?.id === call.id ? null : current));
      }
      setActive(current =>
        current?.id === call.id ? { ...current, ...call } : current
      );
    };
    const onEnded = call => {
      if (!validVoiceCallId(call?.id)) return;
      setIncoming(current => (current?.id === call.id ? null : current));
      if (activeIdRef.current === call.id) closeMedia();
    };
    socket.on("voice:incoming", onIncoming);
    socket.on("voice:updated", onUpdated);
    socket.on("voice:ended", onEnded);
    return () => {
      socket.off("voice:incoming", onIncoming);
      socket.off("voice:updated", onUpdated);
      socket.off("voice:ended", onEnded);
      closeMedia();
    };
  }, [closeMedia, socketManager]);

  const reject = async () => {
    if (!incoming) return;
    const callId = validVoiceCallId(incoming.id);
    if (!callId) {
      setIncoming(null);
      toast.error(i18n.t("voiceCalls.errors.action"));
      return;
    }
    setBusy(true);
    try {
      await api.post(`/voice/calls/${callId}/reject`);
      setIncoming(null);
    } catch (error) {
      if (error.response?.status === 409) setIncoming(null);
      else toast.error(i18n.t("voiceCalls.errors.action"));
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!incoming) return;
    const call = incoming;
    const callId = validVoiceCallId(call.id);
    if (!callId) {
      setIncoming(null);
      toast.error(i18n.t("voiceCalls.errors.action"));
      return;
    }
    setBusy(true);
    let accepted = false;
    try {
      const { data } = await api.post(`/voice/calls/${callId}/accept`);
      accepted = true;
      setIncoming(null);
      activeIdRef.current = callId;
      setActive({ ...data.call, id: callId });
      const media = await openVoiceWebRTC(callId, data.mediaToken);
      if (activeIdRef.current !== callId) {
        media.close();
        return;
      }
      mediaRef.current = media;
    } catch (error) {
      // The peer may hang up while getUserMedia/ICE is still being prepared.
      // The voice:ended event clears the active id; that race is a normal end,
      // not an action failure that should trigger another request or toast.
      if (accepted && activeIdRef.current !== callId) return;
      if (error.response?.status === 409) {
        setIncoming(null);
      } else if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        await api.post(`/voice/calls/${callId}/end`).catch(() => {});
        toast.error(i18n.t("voiceCalls.errors.microphone"));
      } else {
        await api.post(`/voice/calls/${callId}/end`).catch(() => {});
        toast.error(i18n.t("voiceCalls.errors.action"));
      }
      if (activeIdRef.current === callId) closeMedia();
    } finally {
      setBusy(false);
    }
  };

  const end = async () => {
    if (!active) return;
    const callId = validVoiceCallId(active.id);
    if (!callId) {
      closeMedia();
      toast.error(i18n.t("voiceCalls.errors.action"));
      return;
    }
    setBusy(true);
    try {
      await api.post(`/voice/calls/${callId}/end`);
    } catch {
      toast.error(i18n.t("voiceCalls.errors.action"));
    } finally {
      closeMedia();
      setBusy(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    mediaRef.current?.setMuted(next);
    setMuted(next);
  };

  const toggleArtifact = async (kind, enabled) => {
    const callId = validVoiceCallId(active?.id);
    if (!callId) return;
    setArtifactBusy(true);
    try {
      const { data } = await api.post(`/voice/calls/${callId}/artifact`, {
        kind,
        enabled
      });
      setActive(current =>
        current?.id === callId ? { ...current, ...data } : current
      );
    } catch (error) {
      toast.error(
        error.response?.status === 422 && kind === "transcription"
          ? i18n.t("voiceCalls.errors.transcriptionConfig")
          : i18n.t("voiceCalls.errors.action")
      );
    } finally {
      setArtifactBusy(false);
    }
  };

  const duration = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(
    elapsed % 60
  ).padStart(2, "0")}`;

  return (
    <VoiceCallContext.Provider value={{ incoming, active }}>
      {children}
      <Dialog open={Boolean(incoming)} maxWidth="xs" fullWidth>
        <DialogTitle>{i18n.t("voiceCalls.incoming")}</DialogTitle>
        <DialogContent>
          <CallIdentity call={incoming} />
          <Typography color="textSecondary">
            {i18n.t("voiceCalls.incomingHint")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={reject}
            color="secondary"
            disabled={busy}
            startIcon={<PhoneDisabled />}
          >
            {i18n.t("voiceCalls.reject")}
          </Button>
          <Button
            onClick={accept}
            color="primary"
            variant="contained"
            disabled={busy}
            startIcon={<Phone />}
          >
            {i18n.t("voiceCalls.accept")}
          </Button>
        </DialogActions>
      </Dialog>
      {active && (
        <ActiveCallCard
          active={active}
          duration={duration}
          muted={muted}
          busy={busy}
          artifactBusy={artifactBusy}
          onMute={toggleMute}
          onEnd={end}
          onArtifact={toggleArtifact}
        />
      )}
    </VoiceCallContext.Provider>
  );
}
