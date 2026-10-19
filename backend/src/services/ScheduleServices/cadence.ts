import CampaignSetting from "../../models/CampaignSetting";
import { randomValue } from "../../helpers/randomValue";

export type ScheduleCadence = {
  messageInterval: number;
  longerIntervalAfter: number;
  greaterInterval: number;
};

const numericValue = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  try {
    const parsed = Number(JSON.parse(value));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  } catch {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }
};

export const getScheduleCadence = async (
  companyId: number
): Promise<ScheduleCadence> => {
  const settings = await CampaignSetting.findAll({
    where: {
      companyId,
      key: ["messageInterval", "longerIntervalAfter", "greaterInterval"]
    },
    attributes: ["key", "value"]
  });
  const values = settings.reduce(
    (result, setting) => ({ ...result, [setting.key]: setting.value }),
    {} as Record<string, string>
  );
  return {
    messageInterval: numericValue(values.messageInterval, 20),
    longerIntervalAfter: Math.max(
      1,
      numericValue(values.longerIntervalAfter, 20)
    ),
    greaterInterval: numericValue(values.greaterInterval, 60)
  };
};

export const nextCadenceDelay = (
  currentSeconds: number,
  sentPosition: number,
  cadence: ScheduleCadence
): number =>
  currentSeconds +
  (sentPosition % cadence.longerIntervalAfter === 0
    ? cadence.greaterInterval
    : randomValue(0, cadence.messageInterval));

export const estimateCadenceSeconds = (
  recipients: number,
  cadence: ScheduleCadence
): number => {
  if (recipients <= 1) return 0;
  const intervals = recipients - 1;
  const longPauses = Math.floor(intervals / cadence.longerIntervalAfter);
  const regularIntervals = intervals - longPauses;
  return Math.round(
    longPauses * cadence.greaterInterval +
      regularIntervals * (cadence.messageInterval / 2)
  );
};
