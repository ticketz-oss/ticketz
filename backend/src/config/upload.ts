import path from "path";
import multer from "multer";

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
    filename(req, file, cb) {
      const fileName = `${new Date().getTime()} ${path.basename(
        file.originalname
      )}`;

      return cb(null, fileName);
    }
  })
};
