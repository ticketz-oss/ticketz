import { Logger } from "pino";
import { MessagePort } from "worker_threads";

export type HandleTaskOptions = {
  logger: Logger;
};

export abstract class WorkerHandler {
  protected messagePort: MessagePort;

  private name = null;

  private description = null;

  // eslint-disable-next-line no-useless-constructor
  constructor(protected port: MessagePort) {
    this.messagePort = port;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getDescription(): string {
    return this.description;
  }

  setDescription(description: string): void {
    this.description = description;
  }

  abstract handleTask(
    taskId: string,
    taskData: any,
    options: HandleTaskOptions
  ): any;
}
