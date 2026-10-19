import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// Buffer colide com o overload de tipos do crypto nesse setup (Buffer x
// Uint8Array<ArrayBufferLike>) - Uint8Array puro evita o conflito, igual ao
// padrao ja usado em decryptMessageEdit.ts.
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

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");
const fromHex = (hex: string): Uint8Array =>
  Uint8Array.from(Buffer.from(hex, "hex"));

const getKey = (): Uint8Array => {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }
  return Uint8Array.from(crypto.createHash("sha256").update(secret).digest());
};

// Formato: <iv>:<authTag>:<ciphertext>, tudo em hex. Usado para persistir
// segredos (ex.: metaAccessToken) em colunas TEXT sem gravar texto puro.
export const encryptSecret = (plainText: string): string => {
  const iv = Uint8Array.from(crypto.randomBytes(IV_LENGTH));
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = concatUint8([
    Uint8Array.from(cipher.update(plainText, "utf8")),
    Uint8Array.from(cipher.final())
  ]);
  const authTag = Uint8Array.from(cipher.getAuthTag());
  return `${toHex(iv)}:${toHex(authTag)}:${toHex(encrypted)}`;
};

export const decryptSecret = (value: string): string | null => {
  const parts = value.split(":");
  if (parts.length !== 3) {
    return null;
  }
  const [ivHex, authTagHex, dataHex] = parts;
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      fromHex(ivHex)
    );
    decipher.setAuthTag(fromHex(authTagHex));
    const decrypted = concatUint8([
      Uint8Array.from(decipher.update(fromHex(dataHex))),
      Uint8Array.from(decipher.final())
    ]);
    return Buffer.from(decrypted).toString("utf8");
  } catch {
    return null;
  }
};
