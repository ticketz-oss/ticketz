export interface LocationInfo {
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  thumbnail?: string;
  url: string;
}

export function parseLocationInfo(message: {
  body?: string;
  dataJson?: string;
  mediaType?: string | null;
}): LocationInfo | null {
  // 1. Try parsing from dataJson
  if (message.dataJson && typeof message.dataJson === "string") {
    try {
      const data = JSON.parse(message.dataJson);
      const msgObj = data.message || data;
      const loc = msgObj.locationMessage || msgObj.liveLocationMessage;
      if (loc && (loc.degreesLatitude || loc.latitude)) {
        const lat = loc.degreesLatitude || loc.latitude;
        const lng = loc.degreesLongitude || loc.longitude;
        return {
          name: loc.name || "Localização",
          address: loc.address || "",
          latitude: lat,
          longitude: lng,
          thumbnail: loc.jpegThumbnail ? `data:image/jpeg;base64,${loc.jpegThumbnail}` : undefined,
          url: `https://maps.google.com/maps?q=${lat}%2C${lng}&z=17&hl=pt-BR`,
        };
      }
    } catch {}
  }

  // 2. Try parsing from body (JSON or formatted text)
  if (message.body && typeof message.body === "string") {
    const trimmed = message.body.trim();

    // 2a. JSON location
    if (trimmed.startsWith("{") && (trimmed.includes("location") || trimmed.includes("localizacao"))) {
      try {
        const parsed = JSON.parse(trimmed);
        const loc = parsed.location || parsed.localizacao;
        if (loc && loc.degreesLatitude) {
          const lat = loc.degreesLatitude;
          const lng = loc.degreesLongitude;
          return {
            name: loc.name || "Localização",
            address: loc.address || "",
            latitude: lat,
            longitude: lng,
            url: `https://maps.google.com/maps?q=${lat}%2C${lng}&z=17&hl=pt-BR`,
          };
        }
      } catch {}
    }

    // 2b. Formatted location text with maps link
    if (trimmed.includes("maps.google.com/maps?q=")) {
      try {
        const urlMatch = trimmed.match(/https:\/\/maps\.google\.com\/maps\?q=([-\d.]+)[,%2C]+([-\d.]+)[^\s]*/i);
        if (urlMatch) {
          const lat = parseFloat(urlMatch[1]);
          const lng = parseFloat(urlMatch[2]);
          const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
          const nameLine = lines.find((l) => l.startsWith("*") && l.endsWith("*"))?.replace(/\*/g, "") || "Localização";
          const addrLine = lines.find((l) => l.startsWith("_") && l.endsWith("_"))?.replace(/_/g, "") || "";
          return {
            name: nameLine,
            address: addrLine,
            latitude: lat,
            longitude: lng,
            url: urlMatch[0],
          };
        }
      } catch {}
    }
  }

  return null;
}
