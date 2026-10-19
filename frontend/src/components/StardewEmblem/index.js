import React from "react";
import { useTheme } from "@material-ui/core/styles";

// Original sixteen-pixel inventory art, drawn on an integer grid. These icons
// use the same item-slot and hard-edged layering language as StardewCN.
const drawings = {
  sprout: [
    ["#5b341f", "M7 6h2v7H7zM3 13h10v2H3z"],
    ["#477b38", "M2 3h4v1h2v4H4V6H2zM9 4h2V2h4v4h-2v2H9z"],
    ["#8ebc49", "M3 3h3v2H3zM11 2h3v2h-3z"],
    ["#bd7841", "M4 12h8v2H4z"]
  ],
  chest: [
    ["#5b341f", "M3 3h10v1h1v10H2V4h1z"],
    ["#c68139", "M3 5h10v3H3zM3 10h10v3H3z"],
    ["#f2ba48", "M3 4h10v1H3zM4 5h1v8H4zM11 5h1v8h-1zM7 7h2v4H7z"],
    ["#fff1c7", "M7 7h2v1H7z"]
  ],
  scroll: [
    ["#5b341f", "M3 2h10v1h1v3h-2v8H3v-1H2v-3h2V6H2V3h1z"],
    ["#f5d995", "M4 3h7v10H4zM3 3h1v2H3zM11 3h2v2h-2zM3 11h1v1H3z"],
    ["#fff1c7", "M5 3h6v1H5zM5 5h5v7H5z"],
    ["#a16b32", "M6 5h3v1H6zM6 7h4v1H6zM6 9h3v1H6z"]
  ],
  book: [
    ["#5b341f", "M2 2h11v1h1v11H3v-1H2z"],
    ["#477b38", "M3 3h9v9H3z"],
    ["#8ebc49", "M4 3h1v9H4zM5 4h6v1H5z"],
    ["#f2ba48", "M7 6h3v3H7z"],
    ["#fff1c7", "M4 12h9v1H4z"],
    ["#b97836", "M3 12h1v1H3z"]
  ],
  star: [
    ["#8b451d", "M7 1h2v3h2v1h4v3h-2v2h-2v4H8v-1H7v1H4v-4H2V8H1V5h4V4h2z"],
    ["#f2ba48", "M7 3h2v3h4v1h-2v2H9v3H7V9H5V7H3V6h4z"],
    ["#fff1c7", "M7 5h2v2H7z"]
  ],
  clock: [
    ["#5b341f", "M5 1h6v2h2v2h2v6h-2v2h-2v2H5v-2H3v-2H1V5h2V3h2z"],
    ["#f2ba48", "M5 2h6v2h2v2h1v4h-1v2h-2v2H5v-2H3v-2H2V6h1V4h2z"],
    ["#fff1c7", "M5 4h6v2h1v4h-1v2H5v-2H4V6h1z"],
    ["#5b341f", "M7 5h1v3h3v1H7z"]
  ],
  calendar: [
    ["#5b341f", "M2 3h12v11H2zM4 1h2v3H4zM10 1h2v3h-2z"],
    ["#c56238", "M3 4h10v3H3z"],
    ["#fff1c7", "M3 7h10v6H3z"],
    ["#b97836", "M4 8h2v1H4zM7 8h2v1H7zM10 8h2v1h-2zM4 10h2v1H4zM7 10h2v1H7z"],
    ["#477b38", "M10 10h2v2h-2z"]
  ],
  villager: [
    ["#5b341f", "M5 2h6v1h1v5h-1v2H5V8H4V3h1zM3 10h10v4H3z"],
    ["#f5d995", "M5 4h6v4H5zM6 8h4v2H6z"],
    ["#c68139", "M4 3h8v2H4zM6 2h4v1H6z"],
    ["#477b38", "M4 11h8v3H4z"],
    ["#fff1c7", "M7 10h2v3H7z"],
    ["#5b341f", "M6 6h1v1H6zM9 6h1v1H9z"]
  ],
  lamp: [
    ["#5b341f", "M5 1h6v2h2v2h1v7h-2v2H4v-2H2V5h1V3h2z"],
    ["#c68139", "M5 2h6v2H5zM3 5h2v7H3zM11 5h2v7h-2zM5 12h6v1H5z"],
    ["#f2ba48", "M5 5h6v7H5z"],
    ["#fff1c7", "M6 6h4v4H6z"],
    ["#5b341f", "M7 11h2v1H7z"]
  ],
  sun: [
    [
      "#b97836",
      "M7 0h2v3H7zM7 13h2v3H7zM0 7h3v2H0zM13 7h3v2h-3zM2 2h2v2H2zM12 2h2v2h-2zM2 12h2v2H2zM12 12h2v2h-2zM5 3h6v2h2v6h-2v2H5v-2H3V5h2z"
    ],
    ["#f2ba48", "M5 4h6v2h1v4h-1v2H5v-2H4V6h1z"],
    ["#fff1c7", "M5 5h5v2H5z"]
  ]
};

export default function StardewEmblem({ item = "sprout", className = "" }) {
  const theme = useTheme();
  if (!theme.isStardew) return null;

  return (
    <div className={`sv-inventory-emblem ${className}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" shapeRendering="crispEdges" focusable="false">
        {(drawings[item] || drawings.sprout).map(([fill, d], index) => (
          <path key={index} fill={fill} d={d} />
        ))}
      </svg>
    </div>
  );
}
