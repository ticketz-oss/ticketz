import fs from "fs";
import mime from "mime-types";
import { ProcessedMedia } from "./mediaConversion";

function filePassthrough(filePath: string): ProcessedMedia {
  const filename = filePath.split("/").pop() || "file.bin";
  const mimetype = mime.lookup(filename) || "application/octet-stream";
  const codec = mimetype.split("/")[1] || "unknown";
  const data = fs.createReadStream(filePath);

  return {
    data,
    mimetype,
    codec,
    filename
  };
}

export async function multerPassthrough(
  media: Express.Multer.File | string
): Promise<ProcessedMedia> {
  if (typeof media === "string") {
    return filePassthrough(media);
  }

  const filePath = media.path;
  const { mimetype } = media;
  const codec = media.mimetype.split("/")[1];
  const filename = media.originalname;

  const data = fs.createReadStream(filePath);

  return {
    data,
    mimetype,
    codec,
    filename
  };
}
