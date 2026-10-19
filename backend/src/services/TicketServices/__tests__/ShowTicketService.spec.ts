import Ticket from "../../../models/Ticket";
import ShowTicketService from "../ShowTicketService";

jest.mock("../../../models/Ticket");

const getWhatsappInclude = () => {
  const options = (Ticket.findOne as jest.Mock).mock.calls[0][0];
  return options.include.find((entry: any) => entry.as === "whatsapp");
};

describe("ShowTicketService whatsapp association", () => {
  it("includes apiMode so the UI can gate official-mode-only features", async () => {
    (Ticket.findOne as jest.Mock).mockResolvedValue({ companyId: 1 });

    await ShowTicketService(10, 1);

    expect(getWhatsappInclude().attributes).toContain("apiMode");
  });
});
