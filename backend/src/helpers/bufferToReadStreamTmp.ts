import fs, { ReadStream } from "fs";
import { tmpdir } from "os";
import path from "path";
import { logger } from "../utils/logger";
import { makeRandomId } from "./MakeRandomId";

/**
 * Converts a Buffer to a ReadStream using a temporary file.
 *
 * Temporary file will be deleted after the stream is closed.
 *
 * @param {Buffer} inputBuffer - The Buffer to convert.
 * @param {string} [extension='bin'] - The file extension for the temporary file.
 * @returns {ReadStream} - The ReadStream of the temporary file.
 */
export function bufferToReadStreamTmp(
  inputBuffer: Buffer,
  extension = "bin"
): ReadStream {
  const tempFilePath = path.join(
    tmpdir(),
    `tmp-${makeRandomId(10)}.${extension}`
  );
  const writeStream = fs.createWriteStream(tempFilePath);
  writeStream.write(inputBuffer);
  writeStream.end();
  const stream = fs.createReadStream(tempFilePath);
  stream.on("close", () => {
    fs.unlink(tempFilePath, err => {
      if (err) {
        logger.error(
          { message: err?.message },
          "Error deleting temporary file"
        );
      }
    });
  });
  return stream;
}
