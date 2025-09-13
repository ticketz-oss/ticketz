import OpenAI from "openai";
import { Uploadable } from "openai/uploads";
import fs, { ReadStream } from "fs";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";
import { bufferToReadStreamTmp } from "./bufferToReadStreamTmp";
import { convertAudioToOggOpus } from "./mediaConversion";

export type TranscriberAIOptions = {
  apiKey: string;
  provider?: string;
};

type providerOptions = {
  baseURL: string;
  model: string;
};

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

const providerConfig: Record<string, providerOptions> = {
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini-transcribe"
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    model: "whisper-large-v3-turbo"
  }
};

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
  { apiKey, provider }: TranscriberAIOptions,
  filename?: string
): Promise<string> => {
  if (!audioInput) {
    throw new AppError("No audio file provided");
  }

  if (!apiKey) {
    throw new AppError("No OpenAI API key provided");
  }

  const openai = new OpenAI({
    baseURL: providerConfig[provider]?.baseURL || undefined,
    apiKey
  });

  const extension = filename?.split(".").pop() || "ogg";

  let audio: Uploadable;

  if (!supportedFormats.includes(extension)) {
    const converted = await convertAudioToOggOpus(audioInput);
    audio = converted.data;
  } else if (typeof audioInput === "string") {
    if (audioInput.startsWith("http")) {
      const response = await fetch(audioInput);
      if (!response.ok) {
        logger.error(
          { response: response?.statusText },
          "Failed to fetch audio file"
        );
        return null;
      }
      audio = response;
    } else {
      audio = fs.createReadStream(audioInput);
    }
  } else if (Buffer.isBuffer(audioInput)) {
    audio = bufferToReadStreamTmp(audioInput, extension);
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: providerConfig[provider]?.model || "whisper-1"
    });

    return transcription.text;
  } catch (err) {
    logger.error({ error: err.message }, "Error creating transcription");
    return null;
  }
};
