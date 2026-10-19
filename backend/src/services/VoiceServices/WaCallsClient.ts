import axios, { AxiosInstance } from "axios";
import { readFileSync } from "fs";
import { Readable } from "stream";
import AppError from "../../errors/AppError";

const internalToken = (): string => {
  const direct = process.env.WACALLS_INTERNAL_TOKEN || "";
  const file = process.env.WACALLS_INTERNAL_TOKEN_FILE || "";
  if (direct || !file) return direct.trim();
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
};

export type WaCallsEvent = {
  type: string;
  sessionId?: string;
  id?: string;
  peer?: string;
  state?: string;
  status?: string;
  paired?: boolean;
  qr?: string;
  reason?: string;
  startedAt?: number;
  offeredAt?: number;
  endedAt?: number;
  sessions?: Array<{
    id: string;
    state: string;
    paired: boolean;
  }>;
};

class WaCallsClient {
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.WACALLS_INTERNAL_URL || "http://wacalls:8080";
    const token = internalToken();
    this.http = axios.create({
      baseURL,
      timeout: 15000,
      headers: { "X-Internal-Token": token }
    });
  }

  private assertConfigured(): void {
    if (process.env.WACALLS_ENABLED === "true" && internalToken().length < 32) {
      throw new AppError("ERR_VOICE_SERVICE_NOT_CONFIGURED", 503);
    }
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.http.get("/healthz", {
        headers: { "X-Internal-Token": undefined }
      });
      return response.data?.status === "ok";
    } catch {
      return false;
    }
  }

  async createSession(name: string): Promise<string> {
    this.assertConfigured();
    const { data } = await this.http.post("/api/sessions", { name });
    if (!data?.id) throw new AppError("ERR_VOICE_SERVICE_RESPONSE", 502);
    return String(data.id);
  }

  async pairSession(sessionId: string): Promise<void> {
    this.assertConfigured();
    await this.http.post(`/api/sessions/${encodeURIComponent(sessionId)}/pair`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.assertConfigured();
    await this.http.delete(`/api/sessions/${encodeURIComponent(sessionId)}`);
  }

  async acceptCall(
    sessionId: string,
    callId: string,
    userId: number
  ): Promise<void> {
    this.assertConfigured();
    await this.http.post(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/accept`,
      {},
      { headers: { "X-Client-Id": `ticketz-user-${userId}` } }
    );
  }

  async rejectCall(sessionId: string, callId: string): Promise<void> {
    this.assertConfigured();
    await this.http.post(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/reject`
    );
  }

  async endCall(sessionId: string, callId: string): Promise<void> {
    this.assertConfigured();
    await this.http.delete(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}`
    );
  }

  async exchangeWebRTC(
    sessionId: string,
    callId: string,
    sdpOffer: string
  ): Promise<string> {
    this.assertConfigured();
    const { data } = await this.http.post(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/webrtc`,
      { sdp_offer: sdpOffer }
    );
    if (!data?.sdp_answer) {
      throw new AppError("ERR_VOICE_SERVICE_RESPONSE", 502);
    }
    return String(data.sdp_answer);
  }

  async setCapture(
    sessionId: string,
    callId: string,
    enabled: boolean
  ): Promise<void> {
    this.assertConfigured();
    await this.http.post(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/capture`,
      { enabled }
    );
  }

  async getCapture(
    sessionId: string,
    callId: string,
    track: "agent" | "customer" | "mixed",
    offsetMs?: number,
    durationMs?: number
  ): Promise<Buffer> {
    this.assertConfigured();
    const { data } = await this.http.get(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/capture/${track}`,
      {
        responseType: "arraybuffer",
        timeout: 120000,
        params: {
          ...(offsetMs === undefined ? {} : { offset_ms: offsetMs }),
          ...(durationMs === undefined ? {} : { duration_ms: durationMs })
        }
      }
    );
    return Buffer.from(data);
  }

  async streamCapture(
    sessionId: string,
    callId: string,
    track: "agent" | "customer" | "mixed"
  ): Promise<Readable> {
    this.assertConfigured();
    const { data } = await this.http.get(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/capture/${track}`,
      { responseType: "stream", timeout: 120000 }
    );
    return data as Readable;
  }

  async deleteCapture(sessionId: string, callId: string): Promise<void> {
    this.assertConfigured();
    await this.http.delete(
      `/api/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/capture`
    );
  }

  async openEventStream(
    onEvent: (event: WaCallsEvent) => Promise<void>,
    onDisconnect: () => void
  ): Promise<() => void> {
    this.assertConfigured();
    const response = await this.http.get(
      "/api/events?clientId=ticketz-backend",
      {
        responseType: "stream",
        timeout: 0
      }
    );
    const stream = response.data;
    let buffer = "";
    let processing = Promise.resolve();

    stream.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";
      blocks.forEach(block => {
        const raw = block
          .split("\n")
          .filter(line => line.startsWith("data:"))
          .map(line => line.slice(5).trim())
          .join("");
        if (!raw) return;
        try {
          const event = JSON.parse(raw) as WaCallsEvent;
          processing = processing
            .catch(() => undefined)
            .then(() => onEvent(event));
        } catch {
          // Keep the bridge alive when the upstream emits a malformed event.
        }
      });
    });

    let disconnected = false;
    const notifyDisconnect = () => {
      if (disconnected) return;
      disconnected = true;
      onDisconnect();
    };
    stream.once("end", notifyDisconnect);
    stream.once("error", notifyDisconnect);
    stream.once("close", notifyDisconnect);

    return () => stream.destroy();
  }
}

export const waCallsClient = new WaCallsClient();
