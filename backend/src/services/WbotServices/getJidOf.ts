import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";

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

  if (address.includes("@")) {
    return address;
  }

  return `${address}@${isGroup ? "g.us" : "s.whatsapp.net"}`;
}
