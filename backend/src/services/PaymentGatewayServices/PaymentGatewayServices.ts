import AppError from "../../errors/AppError";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import { efiInitialize } from "./EfiServices";

export const initializePaymentGateway = async () => {
  const paymentGateway = await GetSuperSettingService({ key: "_paymentGateway" });

  if (paymentGateway === "efi") {
    return efiInitialize();
  }
  throw new AppError("Unsupported payment gateway", 400);
}

