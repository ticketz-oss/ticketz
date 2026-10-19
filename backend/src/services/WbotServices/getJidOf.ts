import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import normalizePhone from "../../helpers/NormalizePhone";

export function getJidOf(reference: string | Contact | Ticket) {
  let address = reference;
  let isGroup = false;
  if (reference instanceof Contact) {
    isGroup = reference.isGroup;
    address = reference.number;
  } else if (reference instanceof Ticket) {
    isGroup = reference.isGroup;
    address = reference.contact.number;
  }

  if (typeof address !== "string") {
    throw new Error("Invalid reference type");
  }

  if (isGroup) {
    if (address.includes("@")) {
      return address;
    }

    return `${address}@g.us`;
  }

  if (address.includes("@")) {
    const standardJidSuffix = "@s.whatsapp.net";

    if (address.endsWith(standardJidSuffix)) {
      const number = address.slice(0, -standardJidSuffix.length);

      if (!/^\d+$/.test(number)) {
        throw new Error("Invalid contact number");
      }

      return `${normalizePhone(number).wphone}${standardJidSuffix}`;
    }

    return address;
  }

  if (!/^\d+$/.test(address)) {
    throw new Error("Invalid contact number");
  }

  return `${normalizePhone(address).wphone}@s.whatsapp.net`;
}
