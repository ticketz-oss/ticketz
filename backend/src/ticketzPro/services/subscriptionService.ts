import axios from "axios";
import { recheckQueue } from "../jobs/subscriptionTask";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { logger } from "../../utils/logger";
import { verifySignature } from "./verifySignature";
import { makeRandomId } from "../../helpers/MakeRandomId";
import UpdateSettingService from "../../services/SettingServices/UpdateSettingService";
import AppError from "../../errors/AppError";

type SubscriptionRequestData = {
  domain: string;
  paymentService: string;
  email: string;
  cardToken: object;
  addressData: object;
  challenge: string;
  debug?: boolean;
};

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
      this.taskStatus = {};
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

      if (!verifySignature(result, data.challenge)) {
        throw new AppError("Invalid response signature", 500);
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
      logger.error(error, `Error executing single check: ${error?.message}`);
      this.taskResult = false;
      return false;
    }
  }

  async cancel() {
    const url =
      "https://m7afmggvk2xe7xakjkth4scpia.apigateway.sa-saopaulo-1.oci.customer-oci.com/mps/subscribe";

    const ticketzProKey = await GetCompanySetting(1, "ticketzProKey", "");

    if (!ticketzProKey) {
      logger.debug("Ticketz PRO key not configured");
      return this.taskStatus;
    }

    const data = {
      id: ticketzProKey,
      cancel: true,
      challenge: makeRandomId(32)
    };

    logger.debug(data, "Cancelling subscription");

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = response.data;

      if (!verifySignature(result, data.challenge)) {
        throw new AppError("Invalid response signature", 500);
      }

      this.taskStatus = result;

      logger.debug({ result }, "License cancel result");

      await this.triggerSingleCheck();
    } catch (error) {
      logger.error(`Error cancelling subscription status: ${error.message}`);
    }
    return this.taskStatus;
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

  async subscribe(
    paymentService: string,
    email: string,
    cardToken: object,
    addressData: object
  ) {
    const url =
      "https://m7afmggvk2xe7xakjkth4scpia.apigateway.sa-saopaulo-1.oci.customer-oci.com/mps/subscribe";

    const data: SubscriptionRequestData = {
      domain: getDomain(process.env.FRONTEND_URL),
      paymentService,
      email,
      cardToken,
      addressData,
      challenge: makeRandomId(32)
    };

    if (process.env.FRONTEND_URL.endsWith(".ticke.tz")) {
      data.debug = true;
    }

    logger.debug({ data }, "Sending subscription data");

    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    logger.debug({ data: response?.data }, "Received subscription response");

    if (!verifySignature(response.data, data.challenge)) {
      throw new AppError("Invalid response signature", 500);
    }

    const { success, subscriptionData, message } = response.data;

    if (!success) {
      throw new AppError(message, 402);
    }

    if (!subscriptionData) {
      throw new AppError("Didn't received subscription data", 500);
    }

    if (!subscriptionData.id) {
      throw new AppError("Didn't received subscription id", 500);
    }
    await UpdateSettingService({
      key: "ticketzProKey",
      value: subscriptionData.id,
      companyId: 1
    });

    this.taskStatus = response.data;
    this.taskResult = success;
    return this.taskStatus;
  }
}
