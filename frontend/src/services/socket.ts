import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "./api";

class SocketService {
  private socket: Socket | null = null;
  private currentCompanyId: string | null = null;

  public connect(companyId: string, token: string): Socket {
    if (this.socket && this.socket.connected && this.currentCompanyId === companyId) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.currentCompanyId = companyId;
    const url = getBackendUrl();
    const socketHost = url.startsWith("http")
      ? url.replace(/\/backend\/?$/, "")
      : window.location.origin;

    this.socket = io(socketHost, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: {
        token,
      },
    });

    this.socket.on("connect", () => {
      console.log("🟢 WebSocket Connected to", socketHost);
      if (companyId) {
        this.socket?.emit("joinNotification");
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("🟡 WebSocket Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔴 WebSocket Connection Error:", error);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinChat(ticketId: number | string) {
    if (this.socket?.connected) {
      this.socket.emit("joinChatBox", `${ticketId}`);
    }
  }

  public leaveChat(ticketId: number | string) {
    if (this.socket?.connected) {
      this.socket.emit("leaveChatBox", `${ticketId}`);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
