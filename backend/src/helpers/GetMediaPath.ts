import { getPublicPath } from "./GetPublicPath";
import { URLCharEncoder } from "./URLCharEncoder";

export function getMediaPath(mediaPath: string) {
  if (mediaPath.startsWith("/")) {
    return mediaPath;
  }

  return mediaPath.match(/^https?:\/\//)
    ? URLCharEncoder(mediaPath)
    : `${getPublicPath()}/${mediaPath}`;
}
