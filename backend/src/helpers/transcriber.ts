import OpenAI from "openai";
import { Uploadable } from "openai/uploads";
import { tmpdir } from "os";
import path from "path";
import fs, { ReadStream } from "fs";
import { Readable } from "stream";
import { GetCompanySetting } from "./CheckSettings";
import { logger } from "../utils/logger";

/**
 * Transcribes audio using OpenAI's Whisper model.
 *
 * @param {Uploadable | Buffer} audioInput - The audio file to be transcribed.
 * @param {number} companyId - The ID of the company making the request.
 * @returns {Promise<string>} - The transcribed text.
 * @throws {Error} - Throws an error if the transcription fails.
 */
export const transcriber = async (
  audioInput: Uploadable | Buffer,
  companyId: number,
  filename?: string
): Promise<string> => {
  const apiKey = await GetCompanySetting(companyId, "openAiKey", null);

  if (!apiKey) {
    logger.error("No OpenAI API key found for company", companyId);
    return null;
  }

  const openai = new OpenAI({ apiKey });

  const extension = filename?.split(".").pop() || "ogg";

  let audio: Uploadable | ReadStream;
  if (Buffer.isBuffer(audioInput)) {
    const tempFilePath = path.join(
      tmpdir(),
      `audio-${Date.now()}.${extension}`
    );
    const audioTmp = fs.createWriteStream(tempFilePath);
    const readableAudio = Readable.from(audioInput);
    await new Promise((resolve, reject) => {
      readableAudio.pipe(audioTmp);
      audioTmp.on("finish", resolve);
      audioTmp.on("error", reject);
    });
    audio = fs.createReadStream(tempFilePath);
    (audio as ReadStream).on("close", () => {
      fs.unlink(tempFilePath, err => {
        if (err) {
          logger.error("Error deleting temporary file", err);
        } else {
          logger.info("Temporary file deleted");
        }
      });
    });
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1"
    });

    console.log("Transcription created");
    return transcription.text;
  } catch (err) {
    logger.error({ error: err.message }, "Error creating transcription");
    return null;
  }
};
