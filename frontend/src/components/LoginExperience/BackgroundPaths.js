// Adapted from Kokonut UI Background Paths, discovered on 21st.dev.
// Copyright (c) 2025 kokonutUI — MIT, see KOKONUT-LICENSE.txt.
// React 17 adaptation: deterministic, finite entrance and reduced-motion support.
import React from "react";
import { motion } from "framer-motion";

export default function BackgroundPaths({ animated }) {
  return (
    <svg
      viewBox="0 0 696 316"
      fill="none"
      className="login-brand-lines"
      aria-hidden="true"
    >
      {[1, -1].flatMap(position =>
        Array.from({ length: 12 }, (_, i) => (
          <motion.path
            key={`${position}-${i}-${animated}`}
            d={`M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`}
            stroke="currentColor"
            strokeWidth={0.5 + i * 0.03}
            strokeOpacity={0.1 + i * 0.03}
            initial={false}
            animate={
              animated
                ? {
                    pathLength: 1,
                    opacity: [0.1, 0.35],
                    pathOffset: [0.2, 0]
                  }
                : { pathLength: 1, opacity: 0.4, pathOffset: 0 }
            }
            transition={
              animated
                ? { duration: 2.5 + i * 0.08, ease: "easeOut" }
                : { duration: 0 }
            }
          />
        ))
      )}
    </svg>
  );
}
