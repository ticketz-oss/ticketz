import Contact from "../../../models/Contact";
import Ticket from "../../../models/Ticket";
import FindOrCreateTicketService from "../FindOrCreateTicketService";
import FindOrCreateTicketServiceMeta from "../FindOrCreateTicketServiceMeta";

jest.mock("../FindOrCreateTicketService", () => jest.fn());

const findTicket = FindOrCreateTicketService as jest.Mock;

describe("FindOrCreateTicketServiceMeta", () => {
  beforeEach(() => jest.clearAllMocks());

  it("usa o mesmo ciclo de atendimento e timeout das demais conexoes", async () => {
    const contact = { id: 7 } as Contact;
    const ticket = {
      id: 55,
      channel: "whatsapp",
      update: jest.fn()
    } as unknown as Ticket;
    findTicket.mockResolvedValue({ ticket, justCreated: true });

    await expect(
      FindOrCreateTicketServiceMeta(contact, 16, 1, 9, "whatsapp")
    ).resolves.toEqual({ ticket, justCreated: true });

    expect(findTicket).toHaveBeenCalledWith(contact, 16, 9, {
      incrementUnread: true
    });
    expect(ticket.update).not.toHaveBeenCalled();
  });
});
