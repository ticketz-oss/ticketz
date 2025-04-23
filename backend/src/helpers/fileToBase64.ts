import { promises as fs } from "fs";

export async function fileToBase64(file: string | Buffer): Promise<string> {
  const urlRegex = /^https?:\/\//i;

  let buffer: Buffer;

  if (typeof file === "string" && urlRegex.test(file)) {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (typeof file === "string") {
    buffer = await fs.readFile(file);
  } else {
    buffer = file;
  }

  return buffer.toString("base64");
}
