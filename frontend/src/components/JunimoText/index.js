import React from "react";
import { useTheme } from "@material-ui/core/styles";
import "./junimo.css";

// Symbols decorate the visible Latin letters; they never become message data.
export const junimoSymbol = character => {
  const latin = character
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return /^[A-Z0-9!?]$/.test(latin) ? latin : "";
};
const graphemes = text =>
  typeof Intl.Segmenter === "function"
    ? Array.from(
        new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
          text
        ),
        part => part.segment
      )
    : Array.from(text);

export default function JunimoText({ text, children, className = "" }) {
  const theme = useTheme();
  const value = text ?? children;
  if (!theme.isStardew || typeof value !== "string" || !value)
    return <>{value}</>;
  return (
    <span className={`sd-junimo-text ${className}`} aria-label={value}>
      {value.split(/(\s+)/).map((word, index) =>
        /^\s+$/.test(word) ? (
          <span key={index} className="sd-junimo-space">
            {word}
          </span>
        ) : (
          <span
            key={index}
            className={`sd-junimo-word${word.length > 30 ? " sd-junimo-word--long" : ""}`}
          >
            {graphemes(word).map((letter, letterIndex) => (
              <span key={letterIndex} className="sd-junimo-glyph">
                <span className="sd-junimo-latin">{letter}</span>
                <span
                  className="sd-junimo-symbol"
                  aria-hidden="true"
                  data-junimo={junimoSymbol(letter)}
                />
              </span>
            ))}
          </span>
        )
      )}
    </span>
  );
}
