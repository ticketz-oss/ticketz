import { logger } from "../../utils/logger";

export class DecoupledDriverServices {
  // eslint-disable-next-line no-use-before-define
  private static instance: DecoupledDriverServices;

  private functions: { [key: string]: (...args: any[]) => any } = {};

  private constructor() {
    logger.debug("DecoupledDriverServices initialized");
  }

  public static getInstance(): DecoupledDriverServices {
    if (!DecoupledDriverServices.instance) {
      DecoupledDriverServices.instance = new DecoupledDriverServices();
    }

    return DecoupledDriverServices.instance;
  }

  public registerFunction(name: string, func: (...args: any[]) => any): void {
    logger.debug(`Registering function: ${name}`);
    this.functions[name] = func;
  }

  public getFunction(name: string): ((...args: any[]) => any) | undefined {
    return this.functions[name];
  }
}
