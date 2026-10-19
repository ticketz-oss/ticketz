import Ticket from "../../../models/Ticket";
import ShowTicketUUIDService from "../ShowTicketFromUUIDService";

jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));

beforeEach(() => jest.clearAllMocks());

it.each(["official", "baileys"])(
  "loads the tenant's ticket with its %s provider and no credentials",
  async apiMode => {
    const ticket = {
      id: 7,
      companyId: 9,
      whatsapp: { id: 3, name: "Sales", apiMode }
    };
    (Ticket.findOne as jest.Mock).mockResolvedValue(ticket);
    await expect(ShowTicketUUIDService("ticket-uuid", 9)).resolves.toBe(ticket);
    expect(Ticket.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { uuid: "ticket-uuid", companyId: 9 }
      })
    );
    const options = (Ticket.findOne as jest.Mock).mock.calls[0][0];
    expect(
      options.include.find(item => item.as === "whatsapp").attributes
    ).toEqual(["id", "name", "apiMode"]);
  }
);

it("does not fall back to an unscoped UUID when the tenant has no matching ticket", async () => {
  (Ticket.findOne as jest.Mock).mockResolvedValue(null);
  await expect(
    ShowTicketUUIDService("other-tenant-uuid", 9)
  ).rejects.toMatchObject({ message: "ERR_NO_TICKET_FOUND", statusCode: 404 });
  expect(Ticket.findOne).toHaveBeenCalledTimes(1);
  expect(Ticket.findOne).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { uuid: "other-tenant-uuid", companyId: 9 }
    })
  );
});
