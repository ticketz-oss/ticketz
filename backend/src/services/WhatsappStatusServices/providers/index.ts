import Whatsapp from "../../../models/Whatsapp";
import BaileysStatusProvider from "./BaileysStatusProvider";
import OfficialStatusProvider from "./OfficialStatusProvider";
import { StatusProvider } from "./types";

export const getStatusProvider = (connection: Whatsapp): StatusProvider =>
  connection.apiMode === "official"
    ? OfficialStatusProvider
    : BaileysStatusProvider;
