import crypto from "crypto";

// Valida X-Hub-Signature-256 (HMAC-SHA256 do App Secret sobre o raw body).
// Precisa do buffer exato recebido, antes de qualquer parse - por isso
// depende de req.rawBody (capturado no verify do express.json em app.ts).
export const isValidMetaWebhookSignature = (
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined
): boolean => {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !rawBody || !signatureHeader) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(Uint8Array.from(rawBody))
    .digest("hex")}`;

  const expectedBuffer = Uint8Array.from(Buffer.from(expected));
  const receivedBuffer = Uint8Array.from(Buffer.from(signatureHeader));

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};
