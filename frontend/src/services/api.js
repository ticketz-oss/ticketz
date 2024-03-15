import axios from "axios";
import { getBackendURL } from "../services/config";

const api = axios.create({
	baseURL: getBackendURL(),
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL: getBackendURL()
});

export default api;
