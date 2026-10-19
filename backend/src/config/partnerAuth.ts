import { cacheLayer } from "../libs/cache";
import { logger } from "../utils/logger";

/**
 * Segredos JWT proprios da plataforma de parceiros.
 *
 * Espelha `config/auth.ts` de proposito: como as chaves sao diferentes, um
 * token de parceiro falha na verificacao do `isAuth` das rotas de tenant e
 * vice-versa. A fronteira entre as duas sessoes fecha sozinha, sem depender
 * de checagem de perfil em nenhum middleware existente.
 */
type JwtConfig = {
  secret: string | null;
  expiresIn: string;
  refreshSecret: string | null;
  refreshExpiresIn: string;
};

const CACHE_KEY_PARTNER_JWT_SECRET = "TICKETZ_PARTNER_JWT_SECRET";
const CACHE_KEY_PARTNER_JWT_REFRESH_SECRET =
  "TICKETZ_PARTNER_JWT_REFRESH_SECRET";

function generateSecret(length: number): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
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
    logger.debug(`[partnerAuth.ts] Generated ${cacheKey}`);
  }
  return secret;
}

const partnerJwtConfig: JwtConfig = {
  secret: null,
  expiresIn: "15m",
  refreshSecret: null,
  refreshExpiresIn: "7d"
};

const secretPromise = generateSecretIfNotExists(CACHE_KEY_PARTNER_JWT_SECRET);
const refreshSecretPromise = generateSecretIfNotExists(
  CACHE_KEY_PARTNER_JWT_REFRESH_SECRET
);

Promise.all([secretPromise, refreshSecretPromise]).then(
  ([secret, refreshSecret]) => {
    partnerJwtConfig.secret = secret;
    partnerJwtConfig.refreshSecret = refreshSecret;
  }
);

export default partnerJwtConfig;
