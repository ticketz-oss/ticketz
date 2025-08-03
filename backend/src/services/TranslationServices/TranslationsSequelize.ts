import { BackendModule, ReadCallback } from "i18next";
import Translation from "../../models/Translation";
import { logger } from "../../utils/logger";

export class TranslationsSequelize implements BackendModule {
  static type = "backend" as const;

  type = "backend" as const;

  services: any;

  options: any;

  allOptions: any;

  constructor(services: any, options: any = {}, allOptions: any = {}) {
    this.init(services, options, allOptions);
    logger.trace("TranslationsSequelize: instantiated");
  }

  init(services: any, options: any = {}, allOptions: any = {}): void {
    this.services = services;
    this.options = options;
    this.allOptions = allOptions;
    logger.trace("TranslationsSequelize: initialized");
  }

  // eslint-disable-next-line class-methods-use-this
  async read(
    language: string,
    namespace: string,
    callback: ReadCallback
  ): Promise<void> {
    try {
      const rows = await Translation.findAll({
        where: { language, namespace }
      });

      const translations: Record<string, string> = {};
      rows.forEach(row => {
        translations[row.key] = row.value;
      });

      logger.trace(
        { language, namespace },
        "TranslationsSequelize: Translations loaded"
      );
      callback(null, translations);
    } catch (err) {
      logger.error(
        { message: err?.message },
        "SequelizeBackend: Error loading translations"
      );
      callback(err as Error, false);
    }
  }
}

export default TranslationsSequelize;
