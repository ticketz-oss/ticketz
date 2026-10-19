import Queue from "../../../models/Queue";
import Whatsapp from "../../../models/Whatsapp";
import AssociateQueueWhatsapp from "../AssociateQueueWhatsapp";

jest.mock("../../../models/Whatsapp");

const whatsappCount = Whatsapp.count as jest.MockedFunction<
  typeof Whatsapp.count
>;

it("associates only connections validated inside the queue company", async () => {
  const setAssociations = jest.fn().mockResolvedValue(undefined);
  const queue = { $set: setAssociations } as unknown as Queue;
  whatsappCount.mockResolvedValue(2);

  await AssociateQueueWhatsapp({
    queue,
    whatsappIds: [2, 3],
    companyId: 7
  });

  expect(whatsappCount).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ companyId: 7 })
    })
  );
  expect(setAssociations).toHaveBeenCalledWith("whatsapps", [2, 3], {
    transaction: undefined
  });
});

it("rejects a connection from another company", async () => {
  const queue = { $set: jest.fn() } as unknown as Queue;
  whatsappCount.mockResolvedValue(1);

  await expect(
    AssociateQueueWhatsapp({
      queue,
      whatsappIds: [2, 3],
      companyId: 7
    })
  ).rejects.toMatchObject({ message: "ERR_QUEUE_INVALID_CONNECTION" });
});

it("rejects malformed association payloads", async () => {
  const queue = { $set: jest.fn() } as unknown as Queue;

  await expect(
    AssociateQueueWhatsapp({
      queue,
      whatsappIds: "2" as unknown as number[],
      companyId: 7
    })
  ).rejects.toMatchObject({ message: "ERR_QUEUE_INVALID_CONNECTION" });
});

it("does not change associations when an old client omits whatsappIds", async () => {
  const setAssociations = jest.fn();
  const queue = { $set: setAssociations } as unknown as Queue;

  await AssociateQueueWhatsapp({ queue, companyId: 7 });

  expect(setAssociations).not.toHaveBeenCalled();
});
