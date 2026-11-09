// Utility to extract and format Pix details from Baileys native interactive messages, JSON payloads, or formatted text

export interface PixInfo {
  merchantName: string;
  key: string;
  keyType: string;
  referenceId?: string;
}

export function parsePixInfo(message: { body?: string; dataJson?: string }): PixInfo | null {
  // 1. Try parsing dataJson (Baileys payment_info interactive message)
  if (message.dataJson && typeof message.dataJson === "string") {
    try {
      const data = JSON.parse(message.dataJson);
      const msgObj = data.message || data;
      const interactive =
        msgObj.interactiveMessage ||
        msgObj.viewOnceMessage?.message?.interactiveMessage ||
        msgObj.templateMessage?.interactiveMessageTemplate;

      const buttons = interactive?.nativeFlowMessage?.buttons;
      if (Array.isArray(buttons)) {
        for (const btn of buttons) {
          if (btn.name === "payment_info" && btn.buttonParamsJson) {
            const params =
              typeof btn.buttonParamsJson === "string"
                ? JSON.parse(btn.buttonParamsJson)
                : btn.buttonParamsJson;
            const settings = params.payment_settings;
            if (Array.isArray(settings)) {
              for (const s of settings) {
                if (s.pix_static_code) {
                  return {
                    merchantName: s.pix_static_code.merchant_name || "Beneficiário",
                    key: s.pix_static_code.key || "",
                    keyType: s.pix_static_code.key_type || "CNPJ",
                    referenceId: params.reference_id,
                  };
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  // 2. Try parsing body
  if (message.body && typeof message.body === "string") {
    const trimmed = message.body.trim();

    // 2a. JSON with pix or pix_static_code
    if (trimmed.startsWith("{") && trimmed.includes("pix")) {
      try {
        const parsed = JSON.parse(trimmed);
        const pix = parsed.pix || parsed.pix_static_code;
        if (pix && pix.key) {
          return {
            merchantName: pix.merchant_name || pix.merchantName || "Beneficiário",
            key: pix.key,
            keyType: pix.key_type || pix.keyType || "CNPJ",
          };
        }
      } catch {}
    }

    // 2b. PIX_KEY: format
    if (trimmed.startsWith("PIX_KEY:")) {
      try {
        const raw = trimmed.replace("PIX_KEY:", "").trim();
        const parsed = JSON.parse(raw);
        return {
          merchantName: parsed.name || parsed.merchantName || "Beneficiário",
          key: parsed.key,
          keyType: parsed.type || parsed.keyType || "CNPJ",
        };
      } catch {}
    }

    // 2c. Formatted text (e.g. *Chave Pix:* 12345678000199 or Chave Pix: 12345678000199)
    const pixMatch = trimmed.match(/(?:(?:Chave Pix|chave pix|CHAVE PIX)[:\s*]+)([^\n\r*]+)/i);
    if (pixMatch) {
      const key = pixMatch[1].trim();
      const titularMatch = trimmed.match(/(?:(?:Titular|Nome|Razão Social)[:\s*]+)([^\n\r*]+)/i);
      const tipoMatch = trimmed.match(/(?:(?:Tipo)[:\s*]+)([^\n\r*]+)/i);

      if (key && key.length >= 3) {
        return {
          merchantName: titularMatch ? titularMatch[1].trim() : "Beneficiário",
          key: key,
          keyType: tipoMatch ? tipoMatch[1].trim() : "CNPJ",
        };
      }
    }
  }

  return null;
}
