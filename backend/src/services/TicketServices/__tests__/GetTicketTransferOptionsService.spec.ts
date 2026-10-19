import Queue from "../../../models/Queue";
import Ticket from "../../../models/Ticket";
import Whatsapp from "../../../models/Whatsapp";
import GetTicketTransferOptionsService from "../GetTicketTransferOptionsService";
import ShowTicketService from "../ShowTicketService";

jest.mock("../../../models/Queue");
jest.mock("../../../models/Whatsapp");
jest.mock("../ShowTicketService");

const showTicket = ShowTicketService as jest.MockedFunction<
  typeof ShowTicketService
>;
const whatsappFindAll = Whatsapp.findAll as jest.MockedFunction<
  typeof Whatsapp.findAll
>;
const queueFindAll = Queue.findAll as jest.MockedFunction<typeof Queue.findAll>;

it("returns only global or explicitly linked queues for each connection", async () => {
  showTicket.mockResolvedValue({
    id: 10,
    companyId: 7,
    whatsappId: 1,
    channel: "whatsapp",
    isGroup: false,
    contact: { isGroup: false }
  } as Ticket);
  whatsappFindAll.mockResolvedValue([
    {
      id: 1,
      name: "Matriz",
      channel: "whatsapp",
      status: "CONNECTED"
    },
    {
      id: 2,
      name: "Filial",
      channel: "whatsapp",
      status: "CONNECTED"
    }
  ] as Whatsapp[]);
  queueFindAll.mockResolvedValue([
    { id: 10, name: "Legado", color: "#111111", whatsapps: [] },
    {
      id: 11,
      name: "Matriz",
      color: "#222222",
      whatsapps: [{ id: 1 }]
    },
    {
      id: 12,
      name: "Filial",
      color: "#333333",
      whatsapps: [{ id: 2 }]
    }
  ] as Queue[]);

  const result = await GetTicketTransferOptionsService({
    ticketId: 10,
    companyId: 7
  });

  expect(result.connections).toEqual([
    expect.objectContaining({
      id: 1,
      isCurrent: true,
      queues: [
        expect.objectContaining({ id: 10 }),
        expect.objectContaining({ id: 11 })
      ]
    }),
    expect.objectContaining({
      id: 2,
      isCurrent: false,
      queues: [
        expect.objectContaining({ id: 10 }),
        expect.objectContaining({ id: 12 })
      ]
    })
  ]);
});
