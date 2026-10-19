import rateLimit from "express-rate-limit";

const createLimiter = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limit_exceeded" }
  });

export const oauthRegisterLimiter = createLimiter(60 * 60 * 1000, 30);
export const oauthAuthorizeLimiter = createLimiter(15 * 60 * 1000, 60);
export const oauthLoginLimiter = createLimiter(15 * 60 * 1000, 10);
export const oauthTokenLimiter = createLimiter(60 * 1000, 60);
export const oauthRevokeLimiter = createLimiter(60 * 1000, 30);
export const mcpCallLimiter = createLimiter(60 * 1000, 120);
export const loginIdentifyLimiter = createLimiter(15 * 60 * 1000, 20);
export const passwordSetupLimiter = createLimiter(15 * 60 * 1000, 10);
