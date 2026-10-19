import Contact from "../../../models/Contact";
import GroupQueue from "../../../models/GroupQueue";
import Ticket from "../../../models/Ticket";
import User from "../../../models/User";
import { assertGroupAccess } from "../GroupAccessService";

jest.mock("../../../models/GroupQueue");
jest.mock("../../../models/Ticket");
jest.mock("../../../models/User");

const findTicket = Ticket.findOne as jest.MockedFunction<typeof Ticket.findOne>;
const findUser = User.findByPk as jest.MockedFunction<typeof User.findByPk>;
const countGroupQueues = GroupQueue.count as jest.MockedFunction<
  typeof GroupQueue.count
>;

const ticket = {
  id: 15,
  companyId: 7,
  contactId: 31,
  isGroup: true,
  contact: { id: 31, groupMode: "conversation" } as Contact
} as Ticket;

beforeEach(() => {
  findTicket.mockResolvedValue(ticket);
});

it("lets a company administrator access every group", async () => {
  await expect(
    assertGroupAccess(15, { id: 3, companyId: 7, profile: "admin" })
  ).resolves.toBe(ticket);

  expect(findUser).not.toHaveBeenCalled();
  expect(countGroupQueues).not.toHaveBeenCalled();
});

it("lets an attendant access a group when one queue intersects", async () => {
  findUser.mockResolvedValue({ queues: [{ id: 4 }] } as User);
  countGroupQueues.mockResolvedValue(1);

  await expect(
    assertGroupAccess(15, { id: 9, companyId: 7, profile: "user" })
  ).resolves.toBe(ticket);

  expect(countGroupQueues).toHaveBeenCalledWith({
    where: { groupContactId: 31, queueId: [4] }
  });
});

it("rejects attendants whose queues do not intersect", async () => {
  findUser.mockResolvedValue({ queues: [{ id: 8 }] } as User);
  countGroupQueues.mockResolvedValue(0);

  await expect(
    assertGroupAccess(15, { id: 9, companyId: 7, profile: "user" })
  ).rejects.toMatchObject({ message: "ERR_NO_PERMISSION", statusCode: 403 });
});

it("does not reveal a group from another company", async () => {
  findTicket.mockResolvedValue(null);

  await expect(
    assertGroupAccess(15, { id: 3, companyId: 8, profile: "admin" })
  ).rejects.toMatchObject({ message: "ERR_NO_TICKET_FOUND", statusCode: 404 });
});
