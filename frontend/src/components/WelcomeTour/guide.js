import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Mascote from "../Mascote";

// The mascot that walks the customer through the tour. driver.js renders the
// speech balloons; this store tells the mascot where the current balloon is
// and how it should react to the area being explained.
const TAMANHO = 132;
let estadoGuia = {
  visivel: false,
  reacao: "idle",
  pulso: 0,
  gesto: null,
  x: 0,
  y: 0
};
const ouvintes = new Set();

// A reaction is one beat: every call with `reacao` replays it, even when it
// is the same as the previous one.
export const atualizarGuia = parcial => {
  estadoGuia = {
    ...estadoGuia,
    ...parcial,
    pulso: parcial.reacao ? estadoGuia.pulso + 1 : estadoGuia.pulso
  };
  ouvintes.forEach(ouvinte => ouvinte(estadoGuia));
};

export const gesticularGuia = (nome, vezes) =>
  atualizarGuia({ gesto: { nome, vezes, id: Date.now() + Math.random() } });

// The balloon's tail (welcomeTour.css .ew-tour-rabicho) leaves from the
// top-left of the balloon and ends this far from its corner; Luiza is placed
// at its tip, so the tail always points at her.
const PONTA_X = 8;
const PONTA_Y = 63;
// Room around the avatar inside its frame (kirby.html stage mode).
const RESPIRO = TAMANHO * 0.13;

// Perches Luiza at the end of the tail: above the balloon, or below it when
// the balloon touches the top of the screen (the tail turns with her).
export const posicionarGuia = wrapper => {
  const caixa = wrapper.getBoundingClientRect();
  const pontaX = caixa.left + PONTA_X;
  const acima = caixa.top - PONTA_Y - TAMANHO + RESPIRO * 2;
  const abaixo = acima < 8;
  wrapper.dataset.guia = abaixo ? "abaixo" : "acima";
  const y = abaixo ? caixa.bottom + PONTA_Y - RESPIRO * 2 : acima;
  const x = Math.min(
    Math.max(pontaX - TAMANHO / 2 - 14, 8),
    window.innerWidth - TAMANHO - 8
  );
  atualizarGuia({ x, y });
};

export const GuiaTour = () => {
  const [guia, definirGuia] = useState(estadoGuia);
  const reduzir = useReducedMotion();
  useEffect(() => {
    ouvintes.add(definirGuia);
    return () => ouvintes.delete(definirGuia);
  }, []);

  return createPortal(
    <AnimatePresence>
      {guia.visivel && (
        <motion.div
          className="ew-tour-guia"
          initial={{ opacity: 0, scale: 0.4, x: guia.x, y: guia.y + 30 }}
          animate={{ opacity: 1, scale: 1, x: guia.x, y: guia.y }}
          exit={{ opacity: 0, scale: 0.5, y: guia.y + 24 }}
          transition={
            reduzir
              ? { duration: 0 }
              : { type: "spring", stiffness: 170, damping: 19, mass: 0.9 }
          }
        >
          <Mascote
            reacao={guia.reacao}
            pulso={guia.pulso}
            gesto={guia.gesto}
            tamanho={TAMANHO}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
