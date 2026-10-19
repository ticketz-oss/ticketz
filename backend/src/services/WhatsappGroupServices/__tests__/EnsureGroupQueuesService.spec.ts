import GroupQueue from "../../../models/GroupQueue";
import Whatsapp from "../../../models/Whatsapp";
import EnsureGroupQueuesService from "../EnsureGroupQueuesService";

jest.mock("../../../models/GroupQueue");
jest.mock("../../../models/Whatsapp");

const countGroupQueues = GroupQueue.count as jest.MockedFunction<
  typeof GroupQueue.count
>;
const createGroupQueues = GroupQueue.bulkCreate as jest.MockedFunction<
  typeof GroupQueue.bulkCreate
>;
const findWhatsapp = Whatsapp.findByPk as jest.MockedFunction<
  typeof Whatsapp.findByPk
>;

it("inherits every queue from the receiving WhatsApp connection", async () => {
  countGroupQueues.mockResolvedValue(0);
  findWhatsapp.mockResolvedValue({
    queues: [{ id: 4 }, { id: 5 }]
  } as Whatsapp);
  createGroupQueues.mockResolvedValue([]);

  await EnsureGroupQueuesService(31, 12, 7);

  expect(createGroupQueues).toHaveBeenCalledWith(
    [
      { groupContactId: 31, queueId: 4, companyId: 7 },
      { groupContactId: 31, queueId: 5, companyId: 7 }
    ],
    { ignoreDuplicates: true }
  );
});

it("keeps a group administrator-only when its connection has no queues", async () => {
  countGroupQueues.mockResolvedValue(0);
  findWhatsapp.mockResolvedValue({ queues: [] } as unknown as Whatsapp);

  await EnsureGroupQueuesService(31, 12, 7);

  expect(createGroupQueues).not.toHaveBeenCalled();
});

it("does not overwrite queues already configured on the group", async () => {
  countGroupQueues.mockResolvedValue(1);

  await EnsureGroupQueuesService(31, 12, 7);

  expect(findWhatsapp).not.toHaveBeenCalled();
  expect(createGroupQueues).not.toHaveBeenCalled();
});
