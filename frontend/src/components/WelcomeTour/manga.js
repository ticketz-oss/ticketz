import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Manga lettering for Luiza: speech balloons typed as she talks, a jagged
// shout balloon for the climax, and sound effects drawn around her.

const VELOCIDADE = 24;

// Reveals `texto` letter by letter; screen readers get the whole line at
// once from the hidden copy.
export const Digitando = ({ texto }) => {
  const reduzir = useReducedMotion();
  const [visivel, definirVisivel] = useState(reduzir ? texto.length : 0);
  useEffect(() => {
    if (reduzir) {
      definirVisivel(texto.length);
      return undefined;
    }
    definirVisivel(0);
    const timer = setInterval(
      () =>
        definirVisivel(atual => {
          if (atual >= texto.length) {
            clearInterval(timer);
            return atual;
          }
          return atual + 1;
        }),
      VELOCIDADE
    );
    return () => clearInterval(timer);
  }, [texto, reduzir]);
  return (
    <>
      <span aria-hidden="true">
        {texto.slice(0, visivel)}
        <span className="ew-manga-resto">{texto.slice(visivel)}</span>
      </span>
      <span className="ew-sr-only">{texto}</span>
    </>
  );
};

// The balloon's tail: a wedge from the balloon's edge down to the speaker.
// The path is open along its base, so no outline is drawn where it joins the
// balloon and its white fill covers the balloon's outline there.
export const Rabicho = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 110 70"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M70 1 Q 54 38 4 66 Q 66 48 104 1" />
  </svg>
);

// Speech balloon with its tail pointing down-left, at the speaker.
export const Balao = ({ texto, className = "" }) => (
  <motion.div
    key={texto}
    className={`ew-manga-balao ${className}`}
    initial={{ scale: 0.6, opacity: 0, rotate: -3 }}
    animate={{ scale: 1, opacity: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 520, damping: 22 }}
  >
    <p>
      <Digitando texto={texto} />
    </p>
    <Rabicho className="ew-manga-rabicho" />
  </motion.div>
);

const PONTAS = 18;
const estrela = (() => {
  const pontos = [];
  for (let i = 0; i < PONTAS * 2; i += 1) {
    const angulo = (Math.PI * i) / PONTAS - Math.PI / 2;
    const raio = i % 2 === 0 ? 48 : 36 + ((i * 7) % 5);
    pontos.push(
      `${(50 + raio * Math.cos(angulo)).toFixed(1)},${(50 + raio * 0.62 * Math.sin(angulo)).toFixed(1)}`
    );
  }
  return pontos.join(" ");
})();

// The shout: a jagged burst that slams in.
export const Grito = ({ texto }) => (
  <motion.div
    className="ew-manga-grito"
    initial={{ scale: 0.2, rotate: -14, opacity: 0 }}
    animate={{ scale: 1, rotate: -6, opacity: 1 }}
    transition={{ type: "spring", stiffness: 640, damping: 14 }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
      <polygon points={estrela} />
    </svg>
    <strong>{texto}</strong>
  </motion.div>
);

// Where sound effects can appear around Luiza (percent of the panel).
const LUGARES = [
  { left: "6%", top: "10%", rotate: -14 },
  { left: "30%", top: "4%", rotate: 10 },
  { left: "2%", top: "46%", rotate: -6 },
  { left: "34%", top: "40%", rotate: 14 },
  { left: "18%", top: "0%", rotate: -4 }
];

// Sound effects: each beat draws one word next to Luiza that pops and fades.
export const Onomatopeias = ({ batidas }) => (
  <div className="ew-manga-sfx" aria-hidden="true">
    <AnimatePresence>
      {batidas.map(batida => {
        const lugar =
          LUGARES[Math.abs(Number(batida.id) || 0) % LUGARES.length];
        return (
          <motion.span
            key={batida.id}
            className={`ew-manga-sfx-palavra ${batida.forte ? "is-forte" : ""}`}
            style={{ left: lugar.left, top: lugar.top }}
            initial={{ scale: 0.3, opacity: 0, rotate: lugar.rotate - 10 }}
            animate={{ scale: 1, opacity: 1, rotate: lugar.rotate }}
            exit={{ scale: 1.25, opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: "spring", stiffness: 700, damping: 18 }}
          >
            {batida.texto}
          </motion.span>
        );
      })}
    </AnimatePresence>
  </div>
);
