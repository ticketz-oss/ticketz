import { lookup } from "mime-types";

export function getMimeByExtension(extension: string): string {
  const mimeType = lookup(extension);
  return mimeType || "application/octet-stream";
}
