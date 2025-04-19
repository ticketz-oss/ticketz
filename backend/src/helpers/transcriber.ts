import OpenAI from "openai";
import { Uploadable } from "openai/uploads";
import fs, { ReadStream } from "fs";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";
import { bufferToReadStreamTmp } from "./bufferToReadStreamTmp";

const supportedFormats = [
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "oga",
  "ogg",
  "wav",
  "webm"
];

/**
 * Transcribes audio using OpenAI's Whisper model.
 *
 * @param {ReadStream | Buffer | string} audioInput - The audio file to be transcribed.
 * @param {string} apiKey - The OpenAI API key.
 * @returns {Promise<string>} - The transcribed text.
 * @throws {Error} - Throws an error if the transcription fails.
 */
export const transcriber = async (
  audioInput: ReadStream | Buffer | string,
  apiKey: string,
  filename?: string
): Promise<string> => {
  if (!audioInput) {
    throw new AppError("No audio file provided");
  }

  if (!apiKey) {
    throw new AppError("No OpenAI API key provided");
  }

  const openai = new OpenAI({ apiKey });

  const extension = filename?.split(".").pop() || "ogg";

  let audio: Uploadable;

  if (typeof audioInput === "string") {
    if (audioInput.startsWith("http")) {
      const response = await fetch(audioInput);
      if (!response.ok) {
        logger.error("Failed to fetch audio file", response.statusText);
        return null;
      }
      audio = response;
    } else {
      audio = fs.createReadStream(audioInput);
    }
  }
  if (Buffer.isBuffer(audioInput)) {
    audio = bufferToReadStreamTmp(audioInput, extension);
  }

  if (!supportedFormats.includes(extension)) {
    throw new AppError(
      `Unsupported audio format. Supported formats are: ${supportedFormats.join(
        ", "
      )}`
    );
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1"
    });

    return transcription.text;
  } catch (err) {
    logger.error({ error: err.message }, "Error creating transcription");
    return null;
  }
};
