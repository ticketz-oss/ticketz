import { useEffect, useRef, useState } from "react";

export const clamp = value => Math.max(0, Math.min(1, value));
export const ease = value => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

// Each shot describes the part of the canvas visible at that story beat.
// The final shot pulls back to reconnect the detail with the whole journey.
const shots = {
  journey: [
    [0, 125, 230, 480, 310],
    [0.26, 340, 230, 640, 340],
    [0.46, 580, 145, 660, 370],
    [0.67, 620, 295, 640, 360],
    [0.84, 855, 230, 560, 330],
    [1, 520, 230, 1140, 550]
  ],
  automation: [
    [0, 140, 215, 480, 310],
    [0.3, 390, 215, 650, 360],
    [0.56, 635, 195, 720, 480],
    [0.8, 885, 215, 600, 370],
    [1, 530, 225, 1160, 540]
  ],
  crm: [
    [0, 150, 215, 520, 480],
    [0.3, 215, 215, 660, 500],
    [0.63, 655, 200, 650, 490],
    [0.84, 885, 210, 520, 480],
    [1, 520, 230, 1150, 550]
  ],
  campaign: [
    [0, 170, 235, 490, 400],
    [0.3, 510, 235, 650, 500],
    [0.55, 560, 245, 550, 500],
    [0.8, 855, 235, 520, 400],
    [1, 520, 230, 1150, 550]
  ]
};

// Portrait shots keep the active piece readable; the last shot still reveals
// the whole scene. Do not simply shrink a wide desktop shot onto a phone.
const portraitShots = {
  journey: [
    [0, 125, 230, 300, 280],
    [0.26, 365, 230, 330, 280],
    [0.46, 605, 135, 330, 280],
    [0.67, 605, 325, 330, 280],
    [0.84, 865, 230, 310, 280],
    shots.journey[5]
  ],
  automation: [
    [0, 140, 215, 300, 280],
    [0.3, 390, 215, 330, 280],
    [0.56, 650, 220, 340, 430],
    [0.8, 915, 215, 320, 280],
    shots.automation[4]
  ],
  crm: [
    [0, 150, 215, 330, 480],
    [0.3, 215, 215, 350, 480],
    [0.63, 655, 200, 350, 490],
    [0.84, 885, 210, 330, 480],
    shots.crm[4]
  ],
  campaign: [
    [0, 170, 235, 320, 400],
    [0.3, 510, 235, 340, 500],
    [0.55, 560, 245, 330, 500],
    [0.8, 855, 235, 330, 400],
    shots.campaign[4]
  ]
};

export function cameraAt(kind, progress, compact = false) {
  const frames = (compact ? portraitShots : shots)[kind];
  const end = frames.findIndex(frame => frame[0] >= progress);
  const to = frames[end < 0 ? frames.length - 1 : end];
  const from = frames[Math.max(0, (end < 0 ? frames.length - 1 : end) - 1)];
  const amount = ease((progress - from[0]) / (to[0] - from[0] || 1));
  const result = from.map(
    (value, index) => value + (to[index] - value) * amount
  );
  return { x: result[1], y: result[2], width: result[3], height: result[4] };
}

export function useSceneProgress(target, reduced) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (reduced) {
      current.current = target;
      setValue(target);
      return undefined;
    }
    let frame;
    let last;
    const advance = time => {
      const delta = last ? Math.min(64, time - last) : 16.67;
      last = time;
      // Frame-rate independent equivalent of the reference's 0.12 damping.
      current.current +=
        (target - current.current) * (1 - Math.pow(0.88, delta / 16.67));
      if (Math.abs(target - current.current) < 0.0001) current.current = target;
      setValue(current.current);
      if (current.current !== target) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return reduced ? target : value;
}
