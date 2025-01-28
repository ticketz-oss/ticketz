import http from "http";
import https from "https";

export default async function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (response: any) => {
        const data = [];

        response.on("data", (chunk: any) => {
          data.push(chunk);
        });

        response.on("end", () => {
          resolve(Buffer.concat(data));
        });
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
}

