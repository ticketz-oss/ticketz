import { exec } from "child_process";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs, { ReadStream } from "fs";
import path from "path";
import { logger } from "../utils/logger";
import { makeRandomId } from "./MakeRandomId";
import { replaceFileExtension } from "./replaceExtension";

const publicFolder = __dirname.endsWith("/dist")
  ? path.resolve(__dirname, "..", "public")
  : path.resolve(__dirname, "..", "..", "public");

function temporaryFilename() {
  return `${publicFolder}/${new Date().getTime()}-${makeRandomId(5)}`;
}

export type ProcessedMedia = {
  data: ReadStream;
  mimetype: string;
  codec?: string;
  filename: string;
};

/**
 * Streams a file and deletes it after the stream is consumed.
 *
 * @param {string} filePath - The path to the file to be streamed.
 * @returns {ReadStream} - A Readable stream of the file.
 * @throws {Error} - If there is an error reading the file.
 */
export function streamAndDeleteFile(filePath: string): ReadStream {
  const stream = fs.createReadStream(filePath);
  stream.on("close", () => {
    fs.unlink(filePath, unlinkError => {
      if (unlinkError) {
        logger.error(`Error deleting file:${unlinkError}`);
      }
    });
  });
  stream.on("error", error => {
    logger.error(`Error reading file:${error}`);
  });
  return stream;
}

/**
 * Converts a media file to aac format.
 *
 * Temporary file is deleted after the stream is consumed.
 *
 * @param {string} mediaPath - The path to the media file to be converted.
 * @returns {Promise<ProcessedMedia>} - A promise that resolves to a ProcessedMedia object.
 * @throws {Error} - If there is an error during the conversion process.
 */
export async function convertAudioToAac(
  media: string | Express.Multer.File
): Promise<ProcessedMedia> {
  const mediaPath = typeof media === "string" ? media : media.path;
  const filename = replaceFileExtension(path.basename(mediaPath), "aac");
  const outputAudio = `${temporaryFilename()}.aac`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i "${mediaPath}" -vn -c:a aac -b:a 128k "${outputAudio}"`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);

        resolve({
          data: streamAndDeleteFile(outputAudio),
          mimetype: "audio/aac",
          filename
        });
      }
    );
  });
}

/**
 * Converts a media file to ogg/opus format.
 *
 * Temporary file is deleted after the stream is consumed.
 *
 * @param {string} mediaPath - The path to the media file to be converted.
 * @returns {Promise<ProcessedMedia>} - A promise that resolves to a ProcessedMedia object.
 * @throws {Error} - If there is an error during the conversion process.
 */
export async function convertAudioToOggOpus(
  media: string | Express.Multer.File
): Promise<ProcessedMedia> {
  const mediaPath = typeof media === "string" ? media : media.path;
  const filename = replaceFileExtension(path.basename(mediaPath), "ogg");
  const outputAudio = `${temporaryFilename()}.ogg`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i "${mediaPath}" -vn -ar 16000 -ac 1 -c:a libopus -b:a 0 ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);

        resolve({
          data: streamAndDeleteFile(outputAudio),
          mimetype: "audio/ogg",
          codec: "opus",
          filename
        });
      }
    );
  });
}
