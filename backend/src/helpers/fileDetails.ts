import path from "path";
import mime from "mime-types";

export function getFileDetails(mediaPath: string) {
  let filePath = null;
  let fileType = null;
  let mimeType = null;
  if (mediaPath) {
    filePath = path.resolve("public", mediaPath);
    mimeType = mime.lookup(mediaPath) || "application/octet-stream";
    // eslint-disable-next-line no-nested-ternary
    fileType = mimeType.startsWith("video/")
      ? "video"
      : // eslint-disable-next-line no-nested-ternary
      mimeType.startsWith("audio/")
      ? "audio"
      : mimeType.startsWith("image/")
      ? "image"
      : "document";
  }

  return {
    filePath,
    fileType,
    mimeType
  };
}
