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
import { isExpired } from "react-jwt";

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
    this.callbacks.push({event, callback});
    return this.rawSocket.on(event, callback);
  }
  
  off(event, callback) {
    const i = this.callbacks.findIndex((c) => c.event === event && c.callback === callback);
    this.callbacks.splice(i, 1);
    return this.rawSocket.off(event, callback);
  }
  
  emit(event, ...params) {
    if (event.startsWith("join")) {
      this.joins.push({ event: event.substring(4), params });
      console.log("Joining", { event: event.substring(4), params});
    }
    return this.rawSocket.emit(event, ...params);
  }
  
  disconnect() {
    for (const j of this.joins) {
      this.rawSocket.emit(`leave${j.event}`, ...j.params);
    }
    this.joins = [];
    for (const c of this.callbacks) {
      this.rawSocket.off(c.event, c.callback);
    }
    this.callbacks = [];
  }
}

class DummySocket {
  on(..._) {}
  off(..._) {}
  emit(..._) {}
  disconnect() {}
}

const socketManager = {
  currentCompanyId: -1,
  currentUserId: -1,
  currentSocket: null,
  socketReady: false,

  GetSocket: function(companyId) {
    let userId = null;
    if (localStorage.getItem("userId")) {
      userId = localStorage.getItem("userId");
    }

    if (!companyId && !this.currentSocket) {
      return new DummySocket();
    }

    if (companyId && typeof companyId !== "string") {
      companyId = `${companyId}`;
    }

    if (companyId !== this.currentCompanyId || userId !== this.currentUserId) {
      if (this.currentSocket) {
        console.warn("closing old socket - company or user changed");
        this.currentSocket.removeAllListeners();
        this.currentSocket.disconnect();
        this.currentSocket = null;
        this.currentCompanyId = null;
        this.currentUserId = null;
      }

      let token = JSON.parse(localStorage.getItem("token"));
      if (!token) {
        return new DummySocket();
      }
      
      if ( isExpired(token) ) {
        console.warn("Expired token, waiting for refresh");
        setTimeout(() => {
          const currentToken = JSON.parse(localStorage.getItem("token"));
          if (isExpired(currentToken)) {
            localStorage.removeItem("token");
            localStorage.removeItem("companyId");
          }
          window.location.reload();
        },1000);
        return new DummySocket();
      }

      this.currentCompanyId = companyId;
      this.currentUserId = userId;
      
      this.currentSocket = openSocket(getBackendSocketURL(), {
        transports: ["websocket"],
        pingTimeout: 18000,
        pingInterval: 18000,
        query: { token },
      });

      this.currentSocket.io.on("reconnect_attempt", () => {
        this.currentSocket.io.opts.query.r = 1;
        token = JSON.parse(localStorage.getItem("token"));
        if ( isExpired(token) ) {
          console.warn("Refreshing");
          window.location.reload();
        } else {
          console.warn("Using new token");
          this.currentSocket.io.opts.query.token = token;
        }
      });
      
      this.currentSocket.on("disconnect", (reason) => {
        console.warn(`socket disconnected because: ${reason}`);
        if (reason.startsWith("io server disconnect")) {
          console.warn("tryng to reconnect", this.currentSocket);
          token = JSON.parse(localStorage.getItem("token"));
          
          if ( isExpired(token) ) {
            console.warn("Expired token - refreshing");
            window.location.reload();
            return;
          }
          console.warn("Reconnecting using refreshed token");
          this.currentSocket.io.opts.query.token = token;
          this.currentSocket.io.opts.query.r = 1;
          this.currentSocket.connect();
        }        
      });
      
      this.currentSocket.on("connect", (...params) => {
        console.warn("socket connected", params);
      })
      
      this.currentSocket.onAny((event, ...args) => {
        console.debug("Event: ", { socket: this.currentSocket, event, args });
      });
      
      this.onReady(() => {
        this.socketReady = true;
      });

    }
    
    return new ManagedSocket(this);
  },
  
  onReady: function( callbackReady ) {
    if (this.socketReady) {
      callbackReady();
      return
    }
    
    if (!this.currentSocket) {
      return;
    }
    
    this.currentSocket.once("ready", () => {
      callbackReady();
    });
  },
  
  onConnect: function( callbackReady ) { this.onReady( callbackReady ) },

};

const SocketContext = createContext()

export { SocketContext, socketManager };
