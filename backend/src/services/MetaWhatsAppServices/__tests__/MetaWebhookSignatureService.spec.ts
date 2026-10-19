import crypto from "crypto";
import { isValidMetaWebhookSignature } from "../MetaWebhookSignatureService";

const previousSecret = process.env.META_APP_SECRET;
afterEach(() => {
  if (previousSecret === undefined) delete process.env.META_APP_SECRET;
  else process.env.META_APP_SECRET = previousSecret;
});

it("requires a configured secret and signed original bytes", () => {
  const body = Buffer.from('{"entry":[]}');
  process.env.META_APP_SECRET = "test-only-secret";
  const signature = `sha256=${crypto
    .createHmac("sha256", "test-only-secret")
    .update(Uint8Array.from(body))
    .digest("hex")}`;
  expect(isValidMetaWebhookSignature(body, signature)).toBe(true);
  expect(
    isValidMetaWebhookSignature(Buffer.from('{ "entry": [] }'), signature)
  ).toBe(false);
  expect(isValidMetaWebhookSignature(body, "sha256=wrong")).toBe(false);
  expect(isValidMetaWebhookSignature(body, undefined)).toBe(false);
  expect(isValidMetaWebhookSignature(undefined, signature)).toBe(false);
  delete process.env.META_APP_SECRET;
  expect(isValidMetaWebhookSignature(body, signature)).toBe(false);
});
