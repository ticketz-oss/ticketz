import React from "react";
import { useTheme } from "@material-ui/core/styles";

// Adapted from StardewCN's GoldCounter decoration (MIT).
// Keep actual amounts and labels in their existing accessible UI.
const StardewBusinessGlyph = ({ variant = "coin" }) => {
  const theme = useTheme();
  if (!theme.isStardew) return null;

  return (
    <svg
      className={`sd-business-glyph sd-business-glyph-${variant}`}
      width="28"
      height="28"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {variant === "seed" ? (
        <>
          <path
            d="M7 5h2v8H7zM3 2h4v1h2v4H5V5H3zM9 4h4v1h2v3h-4v1H9z"
            fill="#315e29"
          />
          <path d="M4 3h3v2h1v1H6V4H4zM10 5h3v1h-2v1h-1z" fill="#87b650" />
          <path d="M3 12h10v2H3zM5 11h6v1H5z" fill="#9a5c2c" />
          <path d="M4 12h8v1H4z" fill="#d9a15b" />
        </>
      ) : (
        <>
          <path
            d="M4 0h8v1h2v1h1v2h1v8h-1v2h-1v1h-2v1H4v-1H2v-1H1v-2H0V4h1V2h1V1h2z"
            fill="#8b5e2b"
          />
          <path
            d="M4 1h8v1h2v2h1v8h-1v2h-2v1H4v-1H2v-2H1V4h1V2h2z"
            fill="#ffd921"
          />
          <path d="M2 12h12v2H2zM4 14h8v1H4z" fill="#dda059" />
          <path
            d="M6 4h5v1H6zM5 5h1v5H5zM6 10h5v1H6zM10 7h1v3h-1zM8 7h2v1H8z"
            fill="#b88b4a"
          />
          <path d="M3 3h2v1H3zM2 4h1v3H2z" fill="#fff2a3" />
        </>
      )}
    </svg>
  );
};

export default StardewBusinessGlyph;
