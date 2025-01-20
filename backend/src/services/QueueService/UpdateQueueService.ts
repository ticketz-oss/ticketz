import { Op } from "sequelize";
import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import ShowQueueService from "./ShowQueueService";
import Integration from "../../models/Integration";
import sequelize from "../../database";

interface QueueData {
  name?: string;
  color?: string;
  greetingMessage?: string;
  outOfHoursMessage?: string;
  schedules?: any[];
  whatsappId?: number;
}

interface IntegrationData {
  driver: string;
  configuration: any;
}

interface QueueRequestData extends QueueData {
  integration?: IntegrationData;
}

const UpdateQueueService = async (
  queueId: number | string,
  requestData: QueueRequestData,
  companyId: number
): Promise<Queue> => {
  const queueData: QueueData = {
    ...requestData
  };
  const { color, name } = queueData;

  queueData.whatsappId = queueData.whatsappId || null;

  const queueSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_QUEUE_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_QUEUE_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameName = await Queue.findOne({
              where: { name: value, id: { [Op.ne]: queueId }, companyId }
            });

            return !queueWithSameName;
          }
          return true;
        }
      ),
    color: Yup.string()
      .required("ERR_QUEUE_INVALID_COLOR")
      .test("Check-color", "ERR_QUEUE_INVALID_COLOR", async value => {
        if (value) {
          const colorTestRegex = /^#[0-9a-f]{3,6}$/i;
          return colorTestRegex.test(value);
        }
        return true;
      })
      .test(
        "Check-color-exists",
        "ERR_QUEUE_COLOR_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameColor = await Queue.findOne({
              where: { color: value, id: { [Op.ne]: queueId }, companyId }
            });
            return !queueWithSameColor;
          }
          return true;
        }
      )
  });

  try {
    await queueSchema.validate({ color, name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const queue = await ShowQueueService(queueId, companyId);

  if (queue.companyId !== companyId) {
    throw new AppError("Não é permitido alterar registros de outra empresa");
  }

  const resultQueue = await sequelize.transaction(async t => {
    if (requestData.integration) {
      if (!queue.integration) {
        await Integration.create(
          {
            ...requestData.integration,
            queueId: queue.id
          },
          { transaction: t }
        );
      } else {
        await queue.integration.update(requestData.integration, {
          transaction: t
        });
      }
    } else if (queue.integration) {
      await queue.integration.destroy({ transaction: t });
    }

    await queue.update(queueData, { transaction: t });
    return queue;
  });

  resultQueue.reload();
  return resultQueue;
};

export default UpdateQueueService;
