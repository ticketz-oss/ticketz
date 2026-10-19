import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { useTheme } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";
import "./audio.css";

let playingAudio = null;
export const audioTime = value => {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

function Player({ src }) {
  const audio = useRef(null);
  const waveform = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  useEffect(() => {
    let disposed = false;
    let wave;
    let started = false;
    const media = audio.current;
    const start = async () => {
      if (started || disposed) return;
      started = true;
      // Load metadata only when visible, without resetting a pending play().
      media.preload = "metadata";
      try {
        const { default: WaveSurfer } = await import("wavesurfer.js");
        if (disposed) return;
        wave = WaveSurfer.create({
          container: waveform.current,
          media,
          // WaveSurfer compares this with media.src (an absolute URL). A
          // relative URL makes it replace the source with a blob mid-play.
          url: media.src,
          height: 36,
          barWidth: 2,
          barGap: 3,
          barRadius: theme.isStardew ? 0 : 2,
          waveColor: theme.isStardew ? theme.stardew.muted : "#94a3b8",
          progressColor: primary,
          cursorWidth: 0,
          normalize: true
        });
        wave.on("error", () => {
          if (!disposed) setFallback(true);
        });
        // The constructor loads media.src asynchronously; loading again aborts it.
        wave.on("ready", () => {
          if (!disposed) setReady(true);
        });
      } catch (error) {
        if (!disposed) setFallback(true);
      }
    };
    // Decode only visible messages, not the whole loaded conversation history.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
              observer.disconnect();
              start();
            }
          });
    if (observer) observer.observe(waveform.current);
    else start();
    return () => {
      disposed = true;
      observer?.disconnect();
      wave?.destroy();
      media.pause();
      if (playingAudio === media) playingAudio = null;
    };
  }, [src, primary, theme.isStardew, theme.stardew]);

  const toggle = () => {
    if (!audio.current.paused) audio.current.pause();
    else {
      if (playbackError) audio.current.load();
      setPlaybackError(false);
      audio.current.play().catch(error => {
        setPlaying(!audio.current.paused);
        // Pausing an in-flight play() is not a broken audio file.
        if (error.name !== "AbortError") setPlaybackError(true);
      });
    }
  };

  return (
    <div
      className="voice-message"
      data-testid="voice-message"
      style={{ "--ew-primary": primary }}
    >
      <audio
        ref={audio}
        src={src}
        preload="none"
        onError={() => setPlaybackError(true)}
        aria-label={i18n.t("chatExperience.audio")}
        onLoadedMetadata={() => setDuration(audio.current.duration)}
        onDurationChange={() => setDuration(audio.current.duration)}
        onTimeUpdate={() => setTime(audio.current.currentTime)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onPlay={() => {
          setPlaybackError(false);
          if (playingAudio && playingAudio !== audio.current)
            playingAudio.pause();
          playingAudio = audio.current;
          setPlaying(true);
        }}
      />
      <div className="voice-player">
        <button
          type="button"
          className="voice-play ew-button"
          onClick={toggle}
          aria-label={i18n.t(
            playing ? "chatExperience.pause" : "chatExperience.play"
          )}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="voice-track">
          <div
            ref={waveform}
            className={`voice-wave${fallback ? " voice-wave-unavailable" : ""}`}
            aria-hidden="true"
          />
          {!ready && !fallback && !playbackError && (
            <span className="voice-loading">
              {i18n.t("chatExperience.loadingAudio")}
            </span>
          )}
          <input
            type="range"
            min="0"
            max={Number.isFinite(duration) ? duration : 0}
            step="0.1"
            value={time}
            disabled={!Number.isFinite(duration) || !duration}
            aria-label={i18n.t("chatExperience.seek")}
            aria-valuetext={audioTime(time)}
            onChange={event => {
              audio.current.currentTime = Number(event.target.value);
              setTime(Number(event.target.value));
            }}
          />
          <div className="voice-meta">
            <span>
              <Mic size={11} />
              {audioTime(time)} / {audioTime(duration)}
            </span>
            <button
              type="button"
              aria-label={i18n.t("chatExperience.speed")}
              onClick={() => {
                const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
                audio.current.playbackRate = next;
                setSpeed(next);
              }}
            >
              {speed}×
            </button>
          </div>
        </div>
      </div>
      {playbackError && (
        <small role="status">
          {i18n.t("chatExperience.audioError")}{" "}
          <a href={src} target="_blank" rel="noreferrer">
            {i18n.t("chatExperience.downloadAudio")}
          </a>
        </small>
      )}
    </div>
  );
}

export default function AudioMessage({ src }) {
  return <Player key={src} src={src} />;
}
