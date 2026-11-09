import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface AudioPlaybackContextType {
  playingAudioId: string | null;
  setPlayingAudio: (id: string | null) => void;
  playbackSpeed: number;
  togglePlaybackSpeed: () => number;
  proximityEarpieceEnabled: boolean;
  setProximityEarpieceEnabled: (enabled: boolean) => void;
  isNearEar: boolean;
}

const AudioPlaybackContext = createContext<AudioPlaybackContextType>({} as AudioPlaybackContextType);

export const AudioPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("audioSpeed");
    return saved ? parseFloat(saved) : 1;
  });

  const [proximityEarpieceEnabled, setProximityEarpieceEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("chatv2_proximity_earpiece");
      return saved !== "false";
    } catch {
      return true;
    }
  });

  const [isNearEar, setIsNearEar] = useState(false);
  const sensorRef = useRef<any>(null);

  const setProximityEarpieceEnabled = (enabled: boolean) => {
    setProximityEarpieceEnabledState(enabled);
    try {
      localStorage.setItem("chatv2_proximity_earpiece", String(enabled));
    } catch {}
    if (!enabled) {
      setIsNearEar(false);
    }
  };

  const togglePlaybackSpeed = () => {
    let nextSpeed = 1;
    if (playbackSpeed === 1) nextSpeed = 1.5;
    else if (playbackSpeed === 1.5) nextSpeed = 2;
    else nextSpeed = 1;

    setPlaybackSpeed(nextSpeed);
    localStorage.setItem("audioSpeed", String(nextSpeed));
    return nextSpeed;
  };

  const setPlayingAudio = (id: string | null) => {
    setPlayingAudioId(id);
    if (!id) {
      setIsNearEar(false);
    }
  };

  // Proximity Sensor Listener: Activates earpiece mode when bringing phone to ear
  useEffect(() => {
    if (!playingAudioId || !proximityEarpieceEnabled) {
      setIsNearEar(false);
      if (sensorRef.current) {
        try {
          sensorRef.current.stop();
        } catch {}
        sensorRef.current = null;
      }
      return;
    }

    // 1. Generic Sensor API: ProximitySensor
    if (typeof window !== "undefined" && "ProximitySensor" in window) {
      try {
        const SensorClass = (window as any).ProximitySensor;
        const sensor = new SensorClass();
        sensor.addEventListener("reading", () => {
          const near = sensor.distance < 4 || sensor.near === true;
          setIsNearEar(near);
        });
        sensor.addEventListener("error", () => {
          setIsNearEar(false);
        });
        sensor.start();
        sensorRef.current = sensor;
        return () => {
          try {
            sensor.stop();
          } catch {}
          sensorRef.current = null;
        };
      } catch {}
    }

    // 2. Legacy deviceproximity / userproximity event listeners
    const handleDeviceProximity = (event: any) => {
      if (typeof event.value === "number" && typeof event.max === "number") {
        setIsNearEar(event.value < 4);
      } else if (typeof event.near === "boolean") {
        setIsNearEar(event.near);
      }
    };

    window.addEventListener("deviceproximity", handleDeviceProximity);
    window.addEventListener("userproximity", handleDeviceProximity);

    return () => {
      window.removeEventListener("deviceproximity", handleDeviceProximity);
      window.removeEventListener("userproximity", handleDeviceProximity);
    };
  }, [playingAudioId, proximityEarpieceEnabled]);

  return (
    <AudioPlaybackContext.Provider
      value={{
        playingAudioId,
        setPlayingAudio,
        playbackSpeed,
        togglePlaybackSpeed,
        proximityEarpieceEnabled,
        setProximityEarpieceEnabled,
        isNearEar,
      }}
    >
      {/* Screen Shield when near ear: mimics phone turning off screen to prevent face taps */}
      {isNearEar && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-auto select-none cursor-none"
          onClick={() => setIsNearEar(false)}
        >
          <span className="text-neutral-600 text-xs tracking-wide">
            👂 Reproduzindo no fone de ouvido
          </span>
          <span className="text-neutral-700 text-[10px] mt-1">
            (Toque para reativar tela)
          </span>
        </div>
      )}
      {children}
    </AudioPlaybackContext.Provider>
  );
};

export const useAudioPlayback = () => useContext(AudioPlaybackContext);
