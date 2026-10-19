import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";

const publicFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "public")
  : path.resolve(__dirname, "..", "..", "public");

export default {
  directory: publicFolder,

  storage: multer.diskStorage({
    destination: publicFolder,
    filename(req, file, cb) {
      const fileName = `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`;

      return cb(null, fileName);
    }
  })
};
