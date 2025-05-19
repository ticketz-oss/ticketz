import { Mutex } from "async-mutex";
import sequelize from "../../database";
import { getIO } from "../../libs/socket";
import Counter from "../../models/Counter";
import { logger } from "../../utils/logger";

const counterMutex = new Mutex();

export async function incrementCounter(companyId: number, serie: string) {
  return counterMutex.runExclusive(async () => {
    let counter: Counter;

    try {
      // timestamp should be current datetime truncated to half-hour
      const timestamp = new Date();
      timestamp.setMinutes(Math.floor(timestamp.getMinutes() / 30) * 30, 0, 0);
      timestamp.setSeconds(0);

      await sequelize.transaction(async transaction => {
        [counter] = await Counter.findOrCreate({
          where: {
            companyId,
            serie,
            timestamp
          },
          defaults: { value: 0 },
          transaction
        });

        await counter.increment("value", { transaction });
        logger.debug({ counter }, "Counter incremented");
      });
    } catch (error) {
      console.error(
        { companyId, serie, message: error.message },
        "Error incrementing counter:"
      );
      throw error;
    }

    if (counter) {
      const io = getIO();
      io.to(`company-${companyId}-admin`).emit("counter", counter.toJSON());
    }
  });
}
