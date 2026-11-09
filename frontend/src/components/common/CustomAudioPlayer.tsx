import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { useAudioPlayback } from "../../context/AudioPlaybackContext";

interface CustomAudioPlayerProps {
  id: string;
  src: string;
  fromMe: boolean;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ id, src, fromMe }) => {
  const { playingAudioId, setPlayingAudio, playbackSpeed, togglePlaybackSpeed } = useAudioPlayback();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (playingAudioId !== id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [playingAudioId, id, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayingAudio(null);
    } else {
      setPlayingAudio(id);
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      const d = audioRef.current.duration;
      if (isFinite(d) && !isNaN(d) && d > 0 && (!duration || !isFinite(duration))) {
        setDuration(d);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    if (isFinite(d) && !isNaN(d) && d > 0) {
      setDuration(d);
    } else {
      // Chromium WebM / OGG duration fix: seek forward to force browser to calculate duration
      const audio = audioRef.current;
      const onTimeUpdateFix = () => {
        if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
        audio.currentTime = 0;
        audio.removeEventListener("timeupdate", onTimeUpdateFix);
      };
      audio.addEventListener("timeupdate", onTimeUpdateFix);
      try {
        audio.currentTime = 1e101;
        setTimeout(() => {
          if (audio && audio.currentTime > 0) {
            audio.currentTime = 0;
          }
        }, 300);
      } catch {}
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (isFinite(d) && !isNaN(d) && d > 0) {
        setDuration(d);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayingAudio(null);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const safeDuration = isFinite(duration) && duration > 0 ? duration : (currentTime > 0 ? currentTime : 0);

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[240px] max-w-[300px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
        preload="metadata"
      />

      <button
        onClick={togglePlay}
        type="button"
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
          fromMe
            ? "bg-whatsapp-green-dark text-white hover:bg-whatsapp-green"
            : "bg-whatsapp-green text-white hover:bg-whatsapp-green-dark"
        }`}
        title={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? <Pause size={17} className="fill-current" /> : <Play size={17} className="fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative flex items-center h-3 w-full cursor-pointer">
          <input
            type="range"
            min="0"
            max={safeDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-whatsapp-green"
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>

      <button
        onClick={togglePlaybackSpeed}
        type="button"
        className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight bg-gray-200 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        title="Alternar velocidade do áudio"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
};

export default CustomAudioPlayer;
