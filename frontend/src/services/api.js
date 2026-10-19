import axios from "axios";
import { getBackendURL } from "../services/config";

export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (_) {
    return "";
  }
};

const browserTimezone = getBrowserTimezone();
const timezoneHeaders = browserTimezone
  ? { "X-Client-Timezone": browserTimezone }
  : {};

const api = axios.create({
  baseURL: getBackendURL(),
  withCredentials: true,
  headers: timezoneHeaders
});

export const openApi = axios.create({
  baseURL: getBackendURL(),
  headers: timezoneHeaders
});

export default api;
