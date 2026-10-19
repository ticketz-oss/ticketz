/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   
   BASIC LICENSE INFORMATION:

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   Licensed under the AGPLv3 as stated on LICENSE.md file
   
   Any work that uses code from this file is obligated to 
   give access to its source code to all of its users (not only
   the system's owner running it)
   
   EXCLUSIVE LICENSE to use on closed source derived work can be
   purchased from the author and put at the root of the source
   code tree as proof-of-purchase.



   INFORMAÇÕES BÁSICAS DE LICENÇA

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Licenciado sob a licença AGPLv3 conforme arquivo LICENSE.md
    
   Qualquer sistema que inclua este código deve ter o seu código
   fonte fornecido a todos os usuários do sistema (não apenas ao
   proprietário da infraestrutura que o executa)
   
   LICENÇA EXCLUSIVA para uso em produto derivado em código fechado
   pode ser adquirida com o autor e colocada na raiz do projeto
   como prova de compra. 
   
 */

import { createContext } from "react";
import openSocket from "socket.io-client";
import { getBackendSocketURL } from "../../services/config";
import { decodeToken, isExpired } from "react-jwt";
import { toast } from "react-toastify";
import api from "../../services/api";
import { getStoredToken, setStoredToken } from "../../helpers/token";

class ManagedSocket {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.rawSocket = socketManager.currentSocket;
    this.callbacks = [];
    this.joins = [];

    this.rawSocket.on("connect", () => {
      if (this.rawSocket.io.opts.query?.r && !this.rawSocket.recovered) {
        const refreshJoinsOnReady = () => {
          for (const j of this.joins) {
            console.debug("refreshing join", j);
            this.rawSocket.emit(`join${j.event}`, ...j.params);
          }
          this.rawSocket.off("ready", refreshJoinsOnReady);
        };
        for (const j of this.callbacks) {
          if (j.managedOnly) {
            continue;
          }
          this.rawSocket.off(j.event, j.callback);
          this.rawSocket.on(j.event, j.callback);
        }

        this.rawSocket.on("ready", refreshJoinsOnReady);
      }
    });
  }

  on(event, callback) {
    if (event === "ready" || event === "connect") {
      return this.socketManager.onReady(callback);
    }
    if (event === "wsRefreshRequired") {
      const unsubscribe =
        this.socketManager.subscribeWsRefreshRequired(callback);
      this.callbacks.push({
        event,
        callback,
        unsubscribe,
        managedOnly: true
      });
      return unsubscribe;
    }

    this.callbacks.push({ event, callback, managedOnly: false });
    return this.rawSocket.on(event, callback);
  }

  off(event, callback) {
    const i = this.callbacks.findIndex(
      c => c.event === event && c.callback === callback
    );
    if (i !== -1) {
      const cb = this.callbacks[i];
      if (typeof cb.unsubscribe === "function") {
        cb.unsubscribe();
      }
      this.callbacks.splice(i, 1);
    }

    if (event === "wsRefreshRequired") {
      return;
    }

    return this.rawSocket.off(event, callback);
  }

  emit(event, ...params) {
    if (event.startsWith("join")) {
      this.joins.push({ event: event.substring(4), params });
      console.debug("Joining", { event: event.substring(4), params });
    }
    return this.rawSocket.emit(event, ...params);
  }

  disconnect() {
    for (const j of this.joins) {
      this.rawSocket.emit(`leave${j.event}`, ...j.params);
    }
    this.joins = [];
    for (const c of this.callbacks) {
      if (typeof c.unsubscribe === "function") {
        c.unsubscribe();
        continue;
      }
      this.rawSocket.off(c.event, c.callback);
    }
    this.callbacks = [];
  }

  logout() {
    this.disconnect();
    this.socketManager.resetWsConnectionIssue();
    this.socketManager.currentSocket = null;
    this.socketManager.currentCompanyId = -1;
    this.socketManager.currentUserId = -1;
    this.socketManager.socketReady = false;
  }
}

class DummySocket {
  on(..._) {}
  off(..._) {}
  emit(..._) {}
  disconnect() {}
  logout() {}
}

const socketManager = {
  currentCompanyId: -1,
  currentUserId: -1,
  currentSocket: null,
  socketReady: false,
  tokenRefreshPromise: null,
  wsConnectionIssueActive: false,
  wsConnectionIssueListeners: [],
  wsReconnectAttemptCount: 0,
  wsReconnectAttemptListeners: [],
  wsRefreshRequiredActive: false,
  wsRefreshRequiredListeners: [],
  wsRefreshRequiredReconnectThreshold: 2,
  wsConnectionStableTimer: null,
  wsConnectionStabilityDelayMs: 5000,

  notifyWsConnectionIssue: function () {
    this.wsConnectionIssueListeners.forEach(listener => {
      listener(this.wsConnectionIssueActive);
    });
  },

  notifyWsReconnectAttempt: function () {
    this.wsReconnectAttemptListeners.forEach(listener => {
      listener(this.wsReconnectAttemptCount);
    });
  },

  notifyWsRefreshRequired: function () {
    this.wsRefreshRequiredListeners.forEach(listener => {
      listener(this.wsRefreshRequiredActive);
    });
  },

  setWsRefreshRequired: function (active) {
    if (this.wsRefreshRequiredActive === active) {
      return;
    }

    this.wsRefreshRequiredActive = active;
    this.notifyWsRefreshRequired();
  },

  triggerWsRefreshRequired: function () {
    this.setWsRefreshRequired(true);
    this.setWsRefreshRequired(false);
  },

  syncWsRefreshRequired: function () {
    if (this.wsConnectionIssueActive) {
      return;
    }

    this.setWsRefreshRequired(false);
  },

  setWsConnectionIssue: function (active) {
    if (this.wsConnectionIssueActive === active) {
      return;
    }

    this.wsConnectionIssueActive = active;
    this.notifyWsConnectionIssue();
    this.syncWsRefreshRequired();
  },

  setWsReconnectAttemptCount: function (count) {
    if (this.wsReconnectAttemptCount === count) {
      return;
    }

    this.wsReconnectAttemptCount = count;
    this.notifyWsReconnectAttempt();
    this.syncWsRefreshRequired();
  },

  incrementWsReconnectAttemptCount: function () {
    this.setWsReconnectAttemptCount(this.wsReconnectAttemptCount + 1);
  },

  resetWsReconnectAttemptCount: function () {
    this.setWsReconnectAttemptCount(0);
  },

  markWsConnectionFailure: function () {
    if (this.wsConnectionStableTimer) {
      clearTimeout(this.wsConnectionStableTimer);
      this.wsConnectionStableTimer = null;
    }
    this.setWsConnectionIssue(true);
  },

  markWsConnectionStable: function () {
    if (!this.wsConnectionIssueActive) {
      return;
    }

    // Any successful reconnection after an issue should prompt components
    // to refresh their own data.
    this.triggerWsRefreshRequired();

    if (this.wsConnectionStableTimer) {
      clearTimeout(this.wsConnectionStableTimer);
    }

    this.wsConnectionStableTimer = setTimeout(() => {
      if (this.currentSocket?.connected) {
        this.setWsConnectionIssue(false);
        this.resetWsReconnectAttemptCount();
      }
      this.wsConnectionStableTimer = null;
    }, this.wsConnectionStabilityDelayMs);
  },

  resetWsConnectionIssue: function () {
    if (this.wsConnectionStableTimer) {
      clearTimeout(this.wsConnectionStableTimer);
      this.wsConnectionStableTimer = null;
    }
    this.setWsConnectionIssue(false);
    this.resetWsReconnectAttemptCount();
  },

  subscribeWsConnectionIssue: function (listener) {
    this.wsConnectionIssueListeners.push(listener);
    listener(this.wsConnectionIssueActive);

    return () => {
      this.wsConnectionIssueListeners = this.wsConnectionIssueListeners.filter(
        l => l !== listener
      );
    };
  },

  subscribeWsReconnectAttempt: function (listener) {
    this.wsReconnectAttemptListeners.push(listener);
    listener(this.wsReconnectAttemptCount);

    return () => {
      this.wsReconnectAttemptListeners =
        this.wsReconnectAttemptListeners.filter(l => l !== listener);
    };
  },

  subscribeWsRefreshRequired: function (listener) {
    this.wsRefreshRequiredListeners.push(listener);
    listener(this.wsRefreshRequiredActive);

    return () => {
      this.wsRefreshRequiredListeners = this.wsRefreshRequiredListeners.filter(
        l => l !== listener
      );
    };
  },

  refreshAuthToken: async function () {
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = api
      .post("/auth/refresh_token")
      .then(({ data }) => {
        const refreshedToken = data?.token;
        if (!refreshedToken) {
          return null;
        }

        setStoredToken(refreshedToken);
        api.defaults.headers.Authorization = `Bearer ${refreshedToken}`;

        return refreshedToken;
      })
      .catch(error => {
        console.debug("Unable to refresh token for socket", error);
        return null;
      })
      .finally(() => {
        this.tokenRefreshPromise = null;
      });

    return this.tokenRefreshPromise;
  },

  applySocketToken: function (token, markReconnect = false) {
    if (!this.currentSocket || !token) {
      return;
    }

    this.currentSocket.io.opts.query.token = token;
    if (markReconnect) {
      this.currentSocket.io.opts.query.r = 1;
    }
  },

  syncCurrentSocketToken: function (token) {
    this.applySocketToken(token, false);
  },

  reconnectWithFreshToken: async function () {
    const refreshedToken = await this.refreshAuthToken();
    if (!refreshedToken || !this.currentSocket) {
      return;
    }

    this.applySocketToken(refreshedToken, true);
    this.currentSocket.connect();
  },

  GetSocket: function (_discardCompanyId = null) {
    const token = getStoredToken();
    if (!token) {
      return new DummySocket();
    }

    const { userId, companyId } = decodeToken(token);

    if (companyId !== this.currentCompanyId || userId !== this.currentUserId) {
      if (this.currentSocket) {
        console.debug("closing old socket - company or user changed");
        this.currentSocket.removeAllListeners();
        this.currentSocket.disconnect();
        this.currentSocket = null;
        this.currentCompanyId = null;
        this.currentUserId = null;
      }

      this.currentCompanyId = companyId;
      this.currentUserId = userId;

      this.currentSocket = openSocket(getBackendSocketURL(), {
        transports: ["websocket"],
        pingTimeout: 18000,
        pingInterval: 18000,
        query: { token }
      });

      this.resetWsReconnectAttemptCount();

      this.currentSocket.io.on("reconnect_attempt", async () => {
        this.incrementWsReconnectAttemptCount();
        this.currentSocket.io.opts.query.r = 1;
        const newToken = getStoredToken();
        if (isExpired(newToken)) {
          console.debug("Refreshing before reconnect attempt");
          const refreshedToken = await this.refreshAuthToken();
          if (refreshedToken) {
            this.currentSocket.io.opts.query.token = refreshedToken;
          }
        } else {
          console.debug("Using new token");
          this.currentSocket.io.opts.query.token = newToken;
        }
      });

      this.currentSocket.on("disconnect", reason => {
        console.debug(`socket disconnected because: ${reason}`);
        if (reason !== "io client disconnect") {
          this.markWsConnectionFailure();
        }

        if (reason.startsWith("io server disconnect")) {
          console.debug("tryng to reconnect", this.currentSocket);
          const newToken = getStoredToken();

          if (isExpired(newToken)) {
            console.debug("Expired token - refreshing and reconnecting");
            this.reconnectWithFreshToken();
            return;
          }
          console.debug("Reconnecting using refreshed token");
          this.currentSocket.io.opts.query.token = newToken;
          this.currentSocket.io.opts.query.r = 1;
          this.currentSocket.connect();
        }
      });

      this.currentSocket.on("connect_error", async error => {
        this.markWsConnectionFailure();

        const message = error?.message?.toLowerCase?.() || "";
        const isAuthError =
          message.includes("jwt") ||
          message.includes("token") ||
          message.includes("unauthorized") ||
          message.includes("authentication");

        if (!isAuthError) {
          return;
        }

        console.debug("Socket auth error, trying token refresh", message);
        await this.reconnectWithFreshToken();
      });

      this.currentSocket.on("connect", (...params) => {
        console.debug("socket connected", params);
        this.markWsConnectionStable();
      });

      this.currentSocket.on("error", payload => {
        const message = payload?.message;
        if (typeof message === "string" && message.trim()) {
          toast.error(message);
        }
      });

      this.currentSocket.onAny((event, ...args) => {
        if (event === "backendlog") {
          return;
        }
        console.debug("Event: ", { socket: this.currentSocket, event, args });
      });

      this.onReady(() => {
        this.socketReady = true;
      });
    }

    return new ManagedSocket(this);
  },

  onReady: function (callbackReady) {
    if (this.socketReady) {
      callbackReady();
      return;
    }

    if (!this.currentSocket) {
      return;
    }

    this.currentSocket.once("ready", () => {
      callbackReady();
    });
  },

  onConnect: function (callbackReady) {
    this.onReady(callbackReady);
  }
};

const SocketContext = createContext();

export { SocketContext, socketManager };
