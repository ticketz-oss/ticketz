import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs, { ReadStream } from "fs";
import path from "path";
import { Readable } from "stream";
import { spawn } from "child_process";
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

export type MediaSource = string | Express.Multer.File | ReadStream | Buffer;

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

function convertMedia(
  media: MediaSource,
  extension: string,
  ffmpegOptions: string,
  mimetype: string,
  codec?: string
): Promise<ProcessedMedia> {
  const isBuffer = Buffer.isBuffer(media);
  const isStream = media instanceof ReadStream;
  const isMulterFile = typeof media === "object" && "path" in media;
  const mediaPath = isMulterFile ? (media as Express.Multer.File).path : media;
  const outputFile = `${temporaryFilename()}.${extension}`;
  const ffmpegArgs =
    isBuffer || isStream
      ? ["-i", "pipe:0", ...ffmpegOptions.split(" "), outputFile]
      : ["-i", mediaPath as string, ...ffmpegOptions.split(" "), outputFile];

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath.path, ffmpegArgs);

    if (isBuffer) {
      const inputStream = new Readable();
      inputStream.push(media as Buffer);
      inputStream.push(null);
      inputStream.pipe(ffmpeg.stdin);
    } else if (isStream) {
      (media as ReadStream).pipe(ffmpeg.stdin);
    }

    ffmpeg.stderr.on("data", data => {
      logger.error(`FFmpeg error: ${data}`);
    });

    ffmpeg.on("error", error => reject(error));

    ffmpeg.on("close", code => {
      if (code === 0) {
        resolve({
          data: streamAndDeleteFile(outputFile),
          mimetype,
          codec,
          filename: replaceFileExtension(path.basename(outputFile), extension)
        });
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

/**
 * Converts a media file to aac format.
 *
 * Temporary file is deleted after the stream is consumed.
 *
 * @param {MediaSource} media - The path to the media file to be converted.
 * @returns {Promise<ProcessedMedia>} - A promise that resolves to a ProcessedMedia object.
 * @throws {Error} - If there is an error during the conversion process.
 */
export async function convertAudioToAac(
  media: MediaSource
): Promise<ProcessedMedia> {
  return convertMedia(media, "aac", "-vn -c:a aac -b:a 128k", "audio/aac");
}

/**
 * Converts a media file to mp4 format.
 *
 * Temporary file is deleted after the stream is consumed.
 *
 * @param {MediaSource} media - The path to the media file to be converted.
 * @returns {Promise<ProcessedMedia>} - A promise that resolves to a ProcessedMedia object.
 * @throws {Error} - If there is an error during the conversion process.
 */
export async function convertAudioToMp4(
  media: MediaSource
): Promise<ProcessedMedia> {
  return convertMedia(media, "mp4", "-vn -c:a aac -b:a 128k", "audio/mp4");
}

/**
 * Converts a media file to ogg/opus format.
 *
 * Temporary file is deleted after the stream is consumed.
 *
 * @param {MediaSource} media - The path to the media file to be converted.
 * @returns {Promise<ProcessedMedia>} - A promise that resolves to a ProcessedMedia object.
 * @throws {Error} - If there is an error during the conversion process.
 */
export async function convertAudioToOggOpus(
  media: MediaSource
): Promise<ProcessedMedia> {
  return convertMedia(
    media,
    "ogg",
    "-vn -ar 16000 -ac 1 -c:a libopus -b:a 0",
    "audio/ogg",
    "opus"
  );
}
