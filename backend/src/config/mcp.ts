import { createPublicKey, generateKeyPairSync } from "crypto";

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");
const decodePem = (value?: string): string | undefined =>
  value?.replace(/\\n/g, "\n");

const baseUrl = normalizeBaseUrl(
  process.env.MCP_BASE_URL || process.env.BACKEND_URL || "http://localhost:8080"
);

let privateKey = decodePem(process.env.MCP_PRIVATE_KEY);
let publicKey = decodePem(process.env.MCP_PUBLIC_KEY);

if (!privateKey || !publicKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MCP_PRIVATE_KEY and MCP_PUBLIC_KEY are required in production"
    );
  }

  const generated = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  privateKey = generated.privateKey;
  publicKey = generated.publicKey;
}

const publicJwk = createPublicKey(publicKey).export({
  format: "jwk"
}) as JsonWebKey;

const mcpConfig = {
  issuer: baseUrl,
  resource: baseUrl,
  endpoint: `${baseUrl}/mcp`,
  protectedResourceMetadata: `${baseUrl}/.well-known/oauth-protected-resource`,
  privateKey,
  publicKey,
  keyId: process.env.MCP_KEY_ID || "ticketz-mcp-1",
  publicJwk,
  scopes: [
    "conversations:read",
    "reports:read",
    "quick_messages:read",
    "quick_messages:write",
    "schedules:write"
  ],
  timezone: process.env.MCP_TIMEZONE || "America/Rio_Branco",
  frontendUrl: normalizeBaseUrl(
    process.env.FRONTEND_URL ||
      process.env.BACKEND_URL ||
      "http://localhost:3000"
  ),
  cursorSecret: process.env.MCP_CURSOR_SECRET || privateKey
};

export default mcpConfig;
