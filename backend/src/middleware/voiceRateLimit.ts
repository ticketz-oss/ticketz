import rateLimit from "express-rate-limit";

const createVoiceLimiter = (limit: number) =>
  rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "ERR_VOICE_RATE_LIMIT" }
  });

export const voiceConnectionLimiter = createVoiceLimiter(10);
export const voiceActionLimiter = createVoiceLimiter(30);
export const voiceWebRTCLimiter = createVoiceLimiter(20);
