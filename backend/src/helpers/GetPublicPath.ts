// get public folder

import path from "path";

export const getPublicPath = () => {
  const publicFolder = __dirname.endsWith("/dist")
    ? path.resolve(__dirname, "..", "public")
    : path.resolve(__dirname, "..", "..", "public");

  return publicFolder;
};
