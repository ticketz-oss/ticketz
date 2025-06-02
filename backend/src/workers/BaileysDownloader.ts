import { downloadContentFromMessage, MediaType } from "baileys";
import { HandleTaskOptions, WorkerHandler } from "./WorkerHandler";
import saveMediaToFile from "../helpers/saveMediaFile";

export type BaileysDownloaderTaskData = {
  mediaKey: Uint8Array;
  directPath: string;
  url: string;
  mimetype?: string;
  filename?: string;
  mediaType: MediaType;
  companyId: number;
  ticketId?: number;
  contactId?: number;
};

export type BaileysDownloadTaskResult = {
  mediaUrl: string;
};

export class BaileysDownloader extends WorkerHandler {
  constructor(port: any) {
    super(port);
    this.setName("BaileysDownloader");
    this.setDescription("Download media from WhatsApp using Baileys");
  }

  handleTask(
    taskId: string,
    taskData: BaileysDownloaderTaskData,
    { logger }: HandleTaskOptions
  ): void {
    logger.debug({ taskData }, "Downloading media");
    downloadContentFromMessage(taskData, taskData.mediaType)
      .then(stream => {
        logger.debug({ taskData }, "Media downloaded");
        saveMediaToFile(
          {
            data: stream,
            mimetype: taskData.mimetype || "application/octet-stream",
            filename: taskData.filename || `${new Date().getTime()}.bin`
          },
          taskData.companyId,
          taskData.ticketId,
          taskData.contactId
        )
          .then(mediaUrl => {
            logger.debug({ mediaUrl }, "Media saved");
            this.messagePort.postMessage({
              taskId,
              result: {
                mediaUrl
              }
            });
          })
          .catch(error => {
            logger.error(
              { taskData },
              `Error saving media file: ${error.message}`
            );
            this.messagePort.postMessage({
              taskId,
              error
            });
          });
      })
      .catch(error => {
        logger.error(
          { taskData },
          `Error downloading media file: ${error.message}`
        );
        this.messagePort.postMessage({
          taskId,
          error
        });
      });
  }
}
