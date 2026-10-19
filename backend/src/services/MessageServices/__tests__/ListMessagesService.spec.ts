import { Op } from "sequelize";
import { GetCompanySetting } from "../../../helpers/CheckSettings";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import ShowTicketService from "../../TicketServices/ShowTicketService";
import ListMessagesService from "../ListMessagesService";

jest.mock("../../../helpers/CheckSettings");
jest.mock("../../TicketServices/ShowTicketService");

const showTicket = ShowTicketService as jest.MockedFunction<
  typeof ShowTicketService
>;
const getSetting = GetCompanySetting as jest.MockedFunction<
  typeof GetCompanySetting
>;

const makeTicket = (data: Partial<Ticket> = {}) =>
  ({
    id: 22,
    status: "pending",
    isGroup: false,
    contactId: 10,
    whatsappId: 7,
    companyId: 1,
    channel: "whatsapp",
    ...data
  }) as Ticket;

const getMessageFindOptions = () =>
  (Message.findAll as jest.Mock).mock.calls[0][0];

describe("ListMessagesService ticket history", () => {
  beforeEach(() => {
    getSetting.mockImplementation(async (_companyId, _key, fallback) =>
      Promise.resolve(fallback)
    );
    jest.spyOn(Message, "findAll").mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("includes prior tickets for the same contact across connections", async () => {
    const ticket = makeTicket();
    showTicket.mockResolvedValue(ticket);
    jest
      .spyOn(Ticket, "findAll")
      .mockResolvedValue([{ id: 22 }, { id: 18 }] as Ticket[]);

    await ListMessagesService({ ticketId: "22", companyId: 1 });

    const ticketOptions = (Ticket.findAll as jest.Mock).mock.calls[0][0];
    expect(ticketOptions).toEqual(
      expect.objectContaining({
        attributes: ["id"],
        where: expect.objectContaining({
          contactId: 10,
          companyId: 1,
          channel: "whatsapp",
          isGroup: false
        })
      })
    );
    expect(ticketOptions.where).not.toHaveProperty("whatsappId");
    expect(ticketOptions.where.id[Op.lte]).toBe(22);

    const options = getMessageFindOptions();
    expect(options.where.ticketId[Op.in]).toEqual([22, 18]);
    expect(options.include[2].where.ticketId[Op.in]).toEqual([22, 18]);
  });

  it("keeps a closed ticket isolated to its own messages", async () => {
    showTicket.mockResolvedValue(makeTicket({ status: "closed" }));
    const ticketFindAll = jest.spyOn(Ticket, "findAll");

    await ListMessagesService({ ticketId: "22", companyId: 1 });

    expect(ticketFindAll).not.toHaveBeenCalled();
    const options = getMessageFindOptions();
    expect(options.where.ticketId).toBe(22);
    expect(options.include[2].where.ticketId).toBe(22);
  });

  it("keeps active group conversations isolated to their own ticket", async () => {
    showTicket.mockResolvedValue(makeTicket({ status: "open", isGroup: true }));
    const ticketFindAll = jest.spyOn(Ticket, "findAll");

    await ListMessagesService({ ticketId: "22", companyId: 1 });

    expect(ticketFindAll).not.toHaveBeenCalled();
    expect(getMessageFindOptions().where.ticketId).toBe(22);
  });

  it("accepts a pagination cursor that belongs to a historical ticket", async () => {
    const ticket = makeTicket();
    const cursorCreatedAt = new Date("2026-09-01T12:00:00.000Z");
    showTicket.mockResolvedValue(ticket);
    jest
      .spyOn(Ticket, "findAll")
      .mockResolvedValue([{ id: 22 }, { id: 18 }] as Ticket[]);
    const findOne = jest.spyOn(Message, "findOne").mockResolvedValue({
      id: "cursor-message",
      createdAt: cursorCreatedAt
    } as Message);

    await ListMessagesService({
      ticketId: "22",
      companyId: 1,
      nextId: "cursor-message"
    });

    const cursorWhere = (findOne as jest.Mock).mock.calls[0][0].where;
    expect(cursorWhere.ticketId[Op.in]).toEqual([22, 18]);
    expect(getMessageFindOptions().where.createdAt[Op.lt]).toEqual(
      cursorCreatedAt
    );
  });
});
