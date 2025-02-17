import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Agent } from "https";

// Type Definition
export type ProxyConfig = {
  enabled: boolean;
  type: "http" | "https" | "socks5" | "socks5h";
  host: string;
  port: number;
  username?: string;
  password?: string;
};

export function createProxyAgent(proxyConfig: ProxyConfig): Agent {
  if (!proxyConfig || !proxyConfig.enabled) return null;

  const { host, port, username, password } = proxyConfig;
  let { type } = proxyConfig;

  if (type === "socks5") {
    type = "socks5h";
  }

  let proxyUrl = `${type}://${host}:${port}`;

  if (username && password) {
    proxyUrl = `${type}://${username}:${password}@${host}:${port}`;
  }

  if (type.startsWith("socks")) {
    return new SocksProxyAgent(proxyUrl);
  }
  if (type === "http" || type === "https") {
    return new HttpsProxyAgent(proxyUrl);
  }
  throw new Error(`Unsupported proxy type: ${type}`);
}
