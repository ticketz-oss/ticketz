import path from "path";
import multer from "multer";
import { makeRandomId } from "../helpers/MakeRandomId";

const publicFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "public")
  : path.resolve(__dirname, "..", "..", "public");

export default {
  directory: publicFolder,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  storage: multer.diskStorage({
    destination: publicFolder,
    filename(_req, file, cb) {
      const fileName = `${makeRandomId(5)}-${path.basename(
        file.originalname.replace(/ /g, "_")
      )}`;

      return cb(null, fileName);
    }
  })
};
