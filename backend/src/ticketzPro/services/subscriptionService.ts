import axios from "axios";
import { recheckQueue } from "../jobs/subscriptionTask";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { logger } from "../../utils/logger";
import { verifySignature } from "./verifySignature";
import { makeRandomId } from "../../helpers/MakeRandomId";

function getDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    return null;
  }
}

export class SubscriptionService {
  // eslint-disable-next-line no-use-before-define
  private static instance: SubscriptionService;

  private taskResult: boolean | null = null;

  private lastSuccessfulRun: Date | null = null;

  private taskStatus = {};

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    //
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async executeDailyTask(): Promise<void> {
    try {
      const result = await this.checkSubscriptionStatus();
      this.taskResult = result.success;

      if (this.taskResult) {
        this.lastSuccessfulRun = new Date();
        await this.cancelRechecks();
      } else if (this.lastSuccessfulRun) {
        this.scheduleRechecks();
      }
    } catch (error) {
      logger.error("Error executing daily task:", error);
      this.taskResult = false;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async checkSubscriptionStatus(): Promise<{ success: boolean }> {
    const url =
      "https://m7afmggvk2xe7xakjkth4scpia.apigateway.sa-saopaulo-1.oci.customer-oci.com/mps/check";

    const ticketzProKey = await GetCompanySetting(1, "ticketzProKey", "");

    if (!ticketzProKey) {
      logger.debug("Ticketz PRO key not configured");
      return { success: false };
    }

    const data = {
      id: ticketzProKey,
      domain: getDomain(process.env.FRONTEND_URL),
      challenge: makeRandomId(32)
    };

    logger.debug(data, "Testing license");

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = response.data;

      if (!verifySignature(result, data.domain, data.id, data.challenge)) {
        throw new Error("Invalid response signature");
      }

      this.taskStatus = result;

      logger.debug({ result }, "License check status");

      return { success: result.success };
    } catch (error) {
      logger.error(`Error checking subscription status: ${error.message}`);
      return { success: false };
    }
  }

  async triggerSingleCheck(): Promise<boolean> {
    try {
      const result = await this.checkSubscriptionStatus();
      this.taskResult = result.success;

      if (this.taskResult) {
        this.lastSuccessfulRun = new Date();
        await this.cancelRechecks();
      } else if (this.lastSuccessfulRun) {
        this.scheduleRechecks();
      }
      return this.taskResult;
    } catch (error) {
      logger.error("Error executing single check:", error);
      this.taskResult = false;
      return false;
    }
  }

  getTaskResult(): boolean | null {
    return this.taskResult;
  }

  // eslint-disable-next-line class-methods-use-this
  scheduleRechecks(): void {
    this.lastSuccessfulRun = null;
    // recheck every 60 minutes for 4 days if previously true and then returned false
    const repeatOptions = {
      cron: "0 * * * *",
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    };

    recheckQueue.add({}, { repeat: repeatOptions });
  }

  // eslint-disable-next-line class-methods-use-this
  async cancelRechecks(): Promise<void> {
    const repeatOptions = {
      cron: "0 * * * *"
    };

    await recheckQueue.removeRepeatable(repeatOptions);
  }

  status() {
    return this.taskStatus;
  }
}
