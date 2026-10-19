import React, { useCallback, useEffect, useRef } from "react";
import "./styles.css";

// Reactions understood by public/agent-preview/kirby.html.
export const REACOES = [
  "idle",
  "happy",
  "listening",
  "curious",
  "thinking",
  "suspicious",
  "confused",
  "working",
  "searching",
  "excited",
  "celebrate",
  "waking",
  "sleeping",
  "playful",
  "laughing",
  "proud",
  "shy",
  "surprised",
  "angry",
  "sad"
];

const SRC = `${process.env.PUBLIC_URL || ""}/agent-preview/kirby.html?palco=1`;

// Luiza, the animated mascot, on stage: every reaction is one beat that
// answers something that just happened (`pulso` replays the same reaction),
// and `gesto` moves her arms. When a throw reaches the top, `aoPico` receives
// where her hands are, in window coordinates from 0 to 1.
const Mascote = ({
  reacao = "idle",
  pulso = 0,
  gesto = null,
  aoPico,
  tamanho = 96,
  className = "",
  titulo
}) => {
  const frame = useRef(null);
  const atual = useRef({ reacao, pulso });
  atual.current = { reacao, pulso };
  const aoPicoRef = useRef(aoPico);
  aoPicoRef.current = aoPico;

  const enviar = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      {
        type: "agent-avatar-state",
        state: atual.current.reacao,
        pulse: atual.current.pulso
      },
      window.location.origin
    );
  }, []);

  useEffect(enviar, [reacao, pulso, enviar]);

  useEffect(() => {
    if (!gesto) return;
    frame.current?.contentWindow?.postMessage(
      { type: "agent-avatar-gesture", gesture: gesto.nome, count: gesto.vezes },
      window.location.origin
    );
  }, [gesto]);

  useEffect(() => {
    const ouvir = event => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (event.data?.type === "agent-avatar-ready") enviar();
      if (event.data?.type === "agent-avatar-peak" && aoPicoRef.current) {
        const caixa = frame.current.getBoundingClientRect();
        aoPicoRef.current(
          (event.data.hands || []).map(mao => ({
            x: (caixa.left + mao.x * caixa.width) / window.innerWidth,
            y: (caixa.top + mao.y * caixa.height) / window.innerHeight
          }))
        );
      }
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, [enviar]);

  return (
    <span
      className={`ew-mascote ${className}`}
      style={{ width: tamanho, height: tamanho }}
      data-reacao={reacao}
      data-testid="mascote"
    >
      <iframe
        ref={frame}
        src={SRC}
        title={titulo || "Luiza"}
        tabIndex={-1}
        aria-hidden="true"
        onLoad={enviar}
      />
    </span>
  );
};

export default Mascote;
