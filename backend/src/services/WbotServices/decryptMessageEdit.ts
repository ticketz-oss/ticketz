import { proto } from "libzapitu-rf";
import { createHmac, createDecipheriv } from "crypto";
import { logger } from "../../utils/logger";

const decodeBase64 = (base64: string): Uint8Array => {
  const decoded = atob(base64);
  const result = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    result[index] = decoded.charCodeAt(index);
  }

  return result;
};

const toUint8Array = (value: Uint8Array | string, isBase64 = false) => {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (isBase64) {
    return decodeBase64(value);
  }

  return new TextEncoder().encode(value);
};

const concatUint8 = (parts: Uint8Array[]): Uint8Array => {
  const totalSize = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalSize);
  let offset = 0;

  parts.forEach(part => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
};

export function decryptMessageEdit(
  msg: proto.IWebMessageInfo,
  originalMsg: proto.IWebMessageInfo
): proto.IMessage | null {
  try {
    const enc: proto.Message.ISecretEncryptedMessage =
      msg.message?.secretEncryptedMessage;

    const secretB64 = originalMsg?.message?.messageContextInfo?.messageSecret;
    if (!enc?.encPayload || !enc?.encIv || !secretB64) return null;

    const messageSecret = toUint8Array(secretB64, true);
    const encPayload = enc.encPayload;
    const encIv = enc.encIv;
    const stripDevice = (jid: string) => (jid || "").replace(/:\d+(?=@)/, "");
    const origId = originalMsg?.key?.id || enc.targetMessageKey?.id;
    const origJid = stripDevice(
      originalMsg?.key?.participant || originalMsg?.key?.remoteJid
    );
    const modJid = stripDevice(msg?.key?.participant || msg?.key?.remoteJid);
    if (!origId || !origJid || !modJid) return null;

    const info = concatUint8([
      toUint8Array(origId),
      toUint8Array(origJid),
      toUint8Array(modJid),
      toUint8Array("Message Edit")
    ]);
    // HKDF-SHA256
    const prk = Uint8Array.from(
      createHmac("sha256", new Uint8Array(32)).update(messageSecret).digest()
    );
    const key = Uint8Array.from(
      createHmac("sha256", prk)
        .update(info)
        .update(Uint8Array.from([1]))
        .digest()
    );

    // AES-256-GCM
    const tag = encPayload.slice(-16);
    const data = encPayload.slice(0, -16);
    const decipher = createDecipheriv("aes-256-gcm", key, encIv);
    decipher.setAuthTag(tag);
    const chunk = Uint8Array.from(decipher.update(data));
    const finalChunk = Uint8Array.from(decipher.final());
    const plaintext = concatUint8([chunk, finalChunk]);

    return proto.Message.decode(plaintext);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.warn(`[secretEnc] Fail to decrypt message edit: ${errorMessage}`);
    return null;
  }
}
