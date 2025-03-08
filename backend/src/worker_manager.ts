import { Worker, isMainThread, parentPort } from "worker_threads";
import { EventEmitter } from "events";
import os from "os";
import { Mutex } from "async-mutex";
import { initLogger, logger } from "./utils/logger";
import { makeRandomId } from "./helpers/MakeRandomId";
import { WorkerHandler } from "./workers/WorkerHandler";
import { BaileysDownloader } from "./workers/BaileysDownloader";
import "./database";
import { getIO } from "./libs/socket";

interface Task {
  taskId: string;
  taskHandler: string;
  taskData: Record<string, any>;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

interface WorkerManagerOptions {
  minThreads?: number;
  maxThreads?: number;
  timeout?: number;
}

interface WorkerWrapper {
  worker: Worker;
  busy: boolean;
}

let threadId = "main";

export class WorkerManager extends EventEmitter {
  private minThreads: number;

  private maxThreads: number;

  private timeout: number;

  private workers: WorkerWrapper[];

  private taskQueue: Task[];

  private activeTasks: Map<string, Task>;

  private mutex: Mutex;

  // eslint-disable-next-line no-use-before-define
  private static instance: WorkerManager;

  constructor(options?: WorkerManagerOptions) {
    super();
    const cpus = os.cpus().length;
    this.minThreads = options?.minThreads ?? (cpus > 4 ? 4 : cpus);
    this.maxThreads = options?.maxThreads ?? (cpus > 4 ? cpus - 1 : cpus);
    this.timeout = options?.timeout ?? 30000;

    this.workers = [];
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.mutex = new Mutex();

    this.initWorkers();
  }

  private initWorkers(): void {
    for (let i = 0; i < this.minThreads; i += 1) {
      this.addWorker();
    }
  }

  private createWorker(): WorkerWrapper {
    const worker = new Worker(
      __filename.endsWith("bundle.o.js")
        ? "./dist/bundle.worker.js"
        : __filename
    );
    const wrapper: WorkerWrapper = { worker, busy: false };

    worker.on("message", message => this.handleWorkerMessage(wrapper, message));
    worker.on("error", err => this.handleWorkerError(wrapper, err));
    worker.on("exit", code => this.handleWorkerExit(wrapper, code));

    return wrapper;
  }

  public async sendStats(): Promise<void> {
    const io = getIO();
    if (!io) {
      return;
    }

    const stats = {
      min: this.minThreads,
      max: this.maxThreads,
      workers: this.workers.length,
      queue: this.taskQueue.length,
      active: this.activeTasks.size
    };

    io.to("super").emit("workerStats", stats);
  }

  private addWorker(): WorkerWrapper {
    if (this.workers.length >= this.maxThreads) {
      return null;
    }

    const wrapper = this.createWorker();
    this.workers.push(wrapper);
    this.sendStats();
    return wrapper;
  }

  private handleWorkerMessage(wrapper: WorkerWrapper, message: any): void {
    logger.debug(
      { message, threadId: wrapper.worker.threadId },
      "Received message from worker"
    );

    const { taskId, result, error } = message;
    const task = this.activeTasks.get(taskId);
    if (task) {
      clearTimeout(task.timeout);
      if (error) {
        task.reject(error);
      } else {
        task.resolve(result);
      }
      this.activeTasks.delete(taskId);
    }

    this.sendStats();
    this.processNextTask(wrapper);
  }

  private handleWorkerError(wrapper: WorkerWrapper, err: Error): void {
    logger.error({ err }, "Worker error");
    this.removeWorker(wrapper);
  }

  private handleWorkerExit(wrapper: WorkerWrapper, code: number): void {
    logger.debug(`Worker exited with code ${code}`);
    this.removeWorker(wrapper);
  }

  private removeWorker(wrapper: WorkerWrapper, force = false): void {
    if (!force && this.workers.length <= this.minThreads) {
      return;
    }
    logger.debug(`Removing worker ${wrapper.worker.threadId}`);
    this.workers = this.workers.filter(w => w !== wrapper);
    wrapper.worker.terminate();
    this.sendStats();
    if (this.workers.length < this.minThreads) {
      this.addWorker();
    }
  }

  private findAvailableWorker(): WorkerWrapper | undefined {
    return this.workers.find(worker => !worker.busy) || this.addWorker();
  }

  private async processNextTask(worker: WorkerWrapper = null): Promise<void> {
    const lockId = makeRandomId(10);
    logger.debug(`Waiting for lock for task ${lockId}`);

    const handleTimeout = (task: Task, availableWorker: WorkerWrapper) => {
      logger.debug(`Task ${task.taskId} timed out / lockId ${lockId}`);
      this.activeTasks.delete(task.taskId);
      task.reject(new Error("Task timed out"));
      this.removeWorker(availableWorker, true);
    };

    this.mutex
      .runExclusive(async () => {
        logger.debug(`Obtained lock ${lockId}`);
        if (this.taskQueue.length === 0) return;

        const availableWorker = worker || this.findAvailableWorker();
        if (!availableWorker) {
          return;
        }

        const task = this.taskQueue.shift();
        if (task) {
          availableWorker.busy = true;
          task.timeout = setTimeout(
            () => handleTimeout(task, availableWorker),
            this.timeout
          );
          try {
            availableWorker.worker.postMessage({
              taskId: task.taskId,
              taskHandler: task.taskHandler,
              taskData: task.taskData
            });
          } catch (error) {
            task.reject(error);
            this.removeWorker(availableWorker, true);
          }
          this.sendStats();
        } else {
          availableWorker.busy = false;
          this.removeWorker(availableWorker);
        }
      })
      .then(() => {
        logger.debug(`Released lock ${lockId}`);
      })
      .catch(error => {
        logger.error(
          { error },
          `Error processing next task - lockId ${lockId}`
        );
      });
  }

  public static getInstance(options?: WorkerManagerOptions): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager(options);
    }
    return WorkerManager.instance;
  }

  public runTask(taskHandler: string, taskData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = Date.now() + Math.random().toString();
      const task: Task = {
        taskId,
        taskHandler,
        taskData,
        resolve,
        reject,
        timeout: null
      };

      this.activeTasks.set(taskId, task);
      this.taskQueue.push(task);
      this.processNextTask();
    });
  }
}

if (!isMainThread) {
  threadId = `worker-${makeRandomId(10)}`;

  const workerLogger = initLogger(
    `ticketz-${threadId}`,
    process.env.LOG_LEVEL ?? "info"
  );

  // Global Exception Handlers
  process.on("uncaughtException", err => {
    workerLogger.error({ err }, `Uncaught Exception: ${err.message}`);
    // eslint-disable-next-line dot-notation
    if (err["code"] === "ERR_OSSL_BAD_DECRYPT") {
      return;
    }
    process.exit(1);
  });

  // Global Exception Handlers for logging only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process.on("unhandledRejection", (reason: any, promise) => {
    if (reason instanceof TypeError) {
      workerLogger.error(
        { message: reason.message, stack: reason.stack.split("\n") },
        "Unhandled Rejection"
      );
      return;
    }
    workerLogger.debug({ promise, reason }, "Unhandled Rejection");
  });

  const handlers: { [key: string]: WorkerHandler } = {};

  const registerHandler = (handler: WorkerHandler): void => {
    handlers[handler.getName()] = handler;
  };

  registerHandler(new BaileysDownloader(parentPort));

  parentPort.on("message", message => {
    workerLogger.debug({ message }, `Worker ${threadId} received message`);

    const { taskId, taskHandler, taskData } = message;

    const handler = handlers[taskHandler];
    if (!handler) {
      workerLogger.error(`Handler ${taskData.taskHandler} not found`);
      return;
    }

    handler.handleTask(taskId, taskData, { logger: workerLogger });
  });

  workerLogger.debug(`DownloadManager initialized in thread ${threadId}`);
}
