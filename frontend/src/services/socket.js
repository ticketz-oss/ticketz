import openSocket from "socket.io-client";
import { isObject } from "lodash";
import config from "./config";

export function socketConnection(params) {
  let token = null;
  if (localStorage.getItem("userId")) {
    token = JSON.parse(localStorage.getItem("token"));
  }

  if (!token) {
	  return null;
  }
  
  return openSocket(config.REACT_APP_BACKEND_URL, {
    transports: ["websocket", "polling", "flashsocket"],
    pingTimeout: 18000,
    pingInterval: 18000,
    query: isObject(params) ? { ...params, token } : { token },
  });
}
