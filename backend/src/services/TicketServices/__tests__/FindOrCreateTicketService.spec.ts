import Contact from "../../../models/Contact";
import { getConnectionScope } from "../FindOrCreateTicketService";

describe("FindOrCreateTicketService connection scope", () => {
  it("does not scope a WhatsApp group ticket to one connection", () => {
    const groupContact = { id: 42, isGroup: true } as Contact;

    expect(getConnectionScope(groupContact, 10)).toEqual({});
    expect(getConnectionScope(groupContact, 20)).toEqual({});
  });

  it("keeps direct conversations scoped to their connection", () => {
    expect(getConnectionScope(undefined, 10)).toEqual({ whatsappId: 10 });
  });
});
