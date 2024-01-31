import axios from "axios";
import config from "./config";

const api = axios.create({
	baseURL: config.REACT_APP_BACKEND_URL,
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL: config.REACT_APP_BACKEND_URL
});

export default api;
