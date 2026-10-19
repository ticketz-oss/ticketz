import GroupQueue from "../../../models/GroupQueue";
import GroupReadState from "../../../models/GroupReadState";
import Ticket from "../../../models/Ticket";
import User from "../../../models/User";
import { incrementGroupUnread, markGroupRead } from "../GroupUnreadService";
import { getIO } from "../../../libs/socket";

jest.mock("../../../libs/socket");
jest.mock("../../../models/GroupQueue");
jest.mock("../../../models/GroupReadState");
jest.mock("../../../models/User");

const findGroupQueues = GroupQueue.findAll as jest.MockedFunction<
  typeof GroupQueue.findAll
>;
const findUsers = User.findAll as jest.MockedFunction<typeof User.findAll>;
const findOrCreateState = GroupReadState.findOrCreate as jest.MockedFunction<
  typeof GroupReadState.findOrCreate
>;
const emit = jest.fn();
const to = jest.fn().mockReturnValue({ emit });

beforeEach(() => {
  (getIO as jest.Mock).mockReturnValue({ to });
});

it("increments unread only for eligible users and not for the sender", async () => {
  const increment = jest.fn().mockResolvedValue(undefined);
  findGroupQueues.mockResolvedValue([{ queueId: 4 }] as GroupQueue[]);
  findUsers.mockResolvedValue([
    { id: 1, profile: "admin", queues: [] },
    { id: 2, profile: "user", queues: [{ id: 4 }] },
    { id: 3, profile: "user", queues: [{ id: 9 }] },
    { id: 4, profile: "user", queues: [{ id: 4 }] }
  ] as User[]);
  findOrCreateState.mockResolvedValue([
    { increment } as unknown as GroupReadState,
    true
  ]);

  await incrementGroupUnread(
    {
      id: 20,
      companyId: 7,
      contactId: 31,
      isGroup: true,
      contact: { groupMode: "conversation" }
    } as Ticket,
    4
  );

  expect(findOrCreateState).toHaveBeenCalledTimes(2);
  expect(findOrCreateState).toHaveBeenCalledWith(
    expect.objectContaining({ where: { ticketId: 20, userId: 1 } })
  );
  expect(findOrCreateState).toHaveBeenCalledWith(
    expect.objectContaining({ where: { ticketId: 20, userId: 2 } })
  );
  expect(increment).toHaveBeenCalledTimes(2);
});

it("does not maintain individual unread for service-mode groups", async () => {
  await incrementGroupUnread({
    isGroup: true,
    contact: { groupMode: "ticket" }
  } as Ticket);

  expect(findGroupQueues).not.toHaveBeenCalled();
});

it("marks only the current user's group state as read", async () => {
  const update = jest.fn().mockResolvedValue(undefined);
  findOrCreateState.mockResolvedValue([
    { update } as unknown as GroupReadState,
    false
  ]);

  await markGroupRead(20, 2, 7);

  expect(findOrCreateState).toHaveBeenCalledWith({
    where: { ticketId: 20, userId: 2 },
    defaults: { ticketId: 20, userId: 2, companyId: 7, unreadCount: 0 }
  });
  expect(update).toHaveBeenCalledWith({
    unreadCount: 0,
    lastReadAt: expect.any(Date)
  });
  expect(to).toHaveBeenCalledWith("user-2");
  expect(emit).toHaveBeenCalledWith("company-7-ticket", {
    action: "updateUnread",
    ticketId: 20
  });
});
