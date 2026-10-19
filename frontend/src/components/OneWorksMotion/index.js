import React, { useEffect, useRef, useState } from "react";
import "./oneworks-renderer.css";
import "./styles.css";

const animation = {
  anchor: "relative",
  durationMs: 1200,
  playback: "loop",
  keyframes: [
    { atMs: 0, patch: { view: { pitch: 0, yaw: 0 } } },
    {
      atMs: 300,
      easing: "ease-in-out",
      patch: { view: { pitch: 0.08, yaw: 0.12 } }
    },
    {
      atMs: 700,
      easing: "ease-in-out",
      patch: { view: { pitch: -0.05, yaw: -0.12 } }
    },
    { atMs: 1100, easing: "ease-in-out", patch: { view: { pitch: 0, yaw: 0 } } }
  ]
};

const definitions = new Map();

function getDefinition(src) {
  const url = src.replace(/\.svg$/, ".json");
  if (!definitions.has(url)) {
    definitions.set(
      url,
      fetch(url)
        .then(response => {
          if (!response.ok)
            throw new Error(`OneWorks definition: ${response.status}`);
          return response.json();
        })
        .catch(error => {
          definitions.delete(url);
          throw error;
        })
    );
  }
  return definitions.get(url);
}

export default function OneWorksMotion({
  src,
  alt,
  onError,
  active = false,
  interactive = false
}) {
  const [hovered, setHovered] = useState(false);
  const [ready, setReady] = useState(false);
  const host = useRef(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const shouldRender = active || (hovered && !reducedMotion);

  useEffect(() => {
    if (!shouldRender || !host.current || typeof fetch !== "function")
      return undefined;
    let mounted = true;
    let avatar;
    Promise.all([getDefinition(src), import("./oneworksRuntime")])
      .then(([definition, { mountAvatar }]) => {
        if (!mounted || !host.current) return;
        avatar = mountAvatar(host.current, {
          animation,
          autoplay: !reducedMotion,
          definition,
          interactive
        });
        return avatar.ready;
      })
      .then(() => {
        if (mounted && avatar) setReady(true);
      })
      .catch(() => {
        // Keep the official SVG snapshot visible if the optional renderer fails.
      });
    return () => {
      mounted = false;
      avatar?.destroy();
      setReady(false);
    };
  }, [src, shouldRender, interactive, reducedMotion]);

  return (
    <span
      className="one-works-motion"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={src} alt={alt || ""} loading="lazy" onError={onError} />
      <span
        ref={host}
        className={`one-works-motion-renderer${ready ? " is-ready" : ""}`}
        aria-hidden={!interactive}
      />
    </span>
  );
}
