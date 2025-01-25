import { logger } from "../utils/logger";

export class NgrokInstance {
  // eslint-disable-next-line no-use-before-define
  private static instance: NgrokInstance;

  private url = "";

  private constructor() {
    logger.info("ngrok instance initialized");
  }

  public static getInstance(): NgrokInstance {
    if (!NgrokInstance.instance) {
      NgrokInstance.instance = new NgrokInstance();
    }

    return NgrokInstance.instance;
  }

  public setUrl(url: string) {
    this.url = url;
  }

  public getUrl() {
    return this.url;
  }
}
