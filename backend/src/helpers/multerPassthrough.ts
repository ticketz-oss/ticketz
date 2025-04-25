import fs from "fs";
import { ProcessedMedia } from "./mediaConversion";

export async function multerPassthrough(
  media: Express.Multer.File
): Promise<ProcessedMedia> {
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
