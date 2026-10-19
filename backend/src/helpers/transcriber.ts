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

export type TranscriptionSegment = {
  start: number;
  end: number;
  text: string;
};

export type DetailedTranscription = {
  text: string;
  segments: TranscriptionSegment[];
  provider: string;
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

export const transcriberModel = (provider = "openai"): string =>
  (providerConfig[provider] || providerConfig.openai).model;

const prepareAudio = async (
  audioInput: ReadStream | Buffer | string,
  filename?: string
): Promise<{ audio: Uploadable; extension: string }> => {
  const extension = filename?.split(".").pop() || "ogg";
  let audio: Uploadable;

  if (!supportedFormats.includes(extension)) {
    const converted = await convertAudioToOggOpus(audioInput);
    audio = converted.data;
  } else if (typeof audioInput === "string") {
    if (audioInput.startsWith("http")) {
      const response = await fetch(audioInput);
      if (!response.ok) throw new AppError("Failed to fetch audio file");
      audio = response;
    } else {
      audio = fs.createReadStream(audioInput);
    }
  } else if (Buffer.isBuffer(audioInput)) {
    audio = bufferToReadStreamTmp(audioInput, extension);
  } else {
    audio = audioInput;
  }

  return { audio, extension };
};

export const transcribeDetailed = async (
  audioInput: ReadStream | Buffer | string,
  { apiKey, provider = "openai" }: TranscriberAIOptions,
  filename?: string
): Promise<DetailedTranscription | null> => {
  if (!audioInput) throw new AppError("No audio file provided");
  if (!apiKey) throw new AppError("No AI API key provided");

  const config = providerConfig[provider] || providerConfig.openai;
  const client = new OpenAI({ baseURL: config.baseURL, apiKey });
  const { audio } = await prepareAudio(audioInput, filename);

  try {
    const request: Record<string, unknown> = {
      file: audio,
      model: config.model,
      language: "pt"
    };
    if (provider === "groq") {
      request.response_format = "verbose_json";
      request.timestamp_granularities = ["segment"];
    }
    const result = (await client.audio.transcriptions.create(
      request as never
    )) as unknown as {
      text?: string;
      segments?: Array<{ start?: number; end?: number; text?: string }>;
    };
    const text = String(result?.text || "").trim();
    if (!text) return null;
    const segments = Array.isArray(result.segments)
      ? result.segments
          .map(segment => ({
            start: Number(segment.start || 0),
            end: Number(segment.end || segment.start || 0),
            text: String(segment.text || "").trim()
          }))
          .filter(segment => segment.text)
      : [{ start: 0, end: 0, text }];
    return { text, segments, provider, model: config.model };
  } catch (err) {
    logger.error(
      { error: err?.message, provider, model: config.model },
      "Error creating detailed transcription"
    );
    throw err;
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

  const result = await transcribeDetailed(
    audioInput,
    { apiKey, provider },
    filename
  );
  return result?.text || null;
};
