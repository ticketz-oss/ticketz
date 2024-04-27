import { cacheLayer } from "../libs/cache";
import { logger } from "../utils/logger";

type JwtConfig = {
    secret: string | null;
    expiresIn: string;
    refreshSecret: string | null;
    refreshExpiresIn: string;
};

const CACHE_KEY_JWT_SECRET = "TICKETZ_JWT_SECRET";
const CACHE_KEY_JWT_REFRESH_SECRET = "TICKETZ_JWT_REFRESH_SECRET";

function generateSecret(length: number): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
    let secret = "";
    for (let i = 0; i < length; i += 1) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        secret += charset[randomIndex];
    }
    return secret;
}

async function generateSecretIfNotExists(cacheKey: string): Promise<string> {
    let secret = await cacheLayer.get(cacheKey);
    if (!secret) {
        secret = generateSecret(32);
        await cacheLayer.set(cacheKey, secret);
        logger.debug(`[auth.ts] Generated ${cacheKey}: ${secret}`);
    } else {
        logger.debug(`[auth.ts] Loaded ${cacheKey}: ${secret}`);
    }
    return secret;
}

const jwtConfig: JwtConfig = {
    secret: null,
    expiresIn: "15m",
    refreshSecret: null,
    refreshExpiresIn: "7d"
};

const secretPromise = generateSecretIfNotExists(CACHE_KEY_JWT_SECRET);
const refreshSecretPromise = generateSecretIfNotExists(CACHE_KEY_JWT_REFRESH_SECRET);

Promise.all([secretPromise, refreshSecretPromise]).then(([secret, refreshSecret]) => {
    jwtConfig.secret = secret;
    jwtConfig.refreshSecret = refreshSecret;
});

export default jwtConfig;
