import { logger } from "../utils/logger";
import { SimpleObjectCache } from "./simpleObjectCache";

const oohCache = new SimpleObjectCache(1000 * 60 * 5, logger);

export function outOfHoursCache() {
  return oohCache;
}
