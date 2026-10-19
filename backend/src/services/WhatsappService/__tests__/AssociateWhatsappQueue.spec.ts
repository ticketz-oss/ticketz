import Queue from "../../../models/Queue";
import Whatsapp from "../../../models/Whatsapp";
import AssociateWhatsappQueue from "../AssociateWhatsappQueue";

jest.mock("../../../models/Queue");

const queueCount = Queue.count as jest.MockedFunction<typeof Queue.count>;

it("associates only queues validated inside the connection company", async () => {
  const setAssociations = jest.fn().mockResolvedValue(undefined);
  const reload = jest.fn().mockResolvedValue(undefined);
  const whatsapp = {
    companyId: 7,
    $set: setAssociations,
    reload
  } as unknown as Whatsapp;
  queueCount.mockResolvedValue(2);

  await AssociateWhatsappQueue(whatsapp, [4, 5]);

  expect(queueCount).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ companyId: 7 })
    })
  );
  expect(setAssociations).toHaveBeenCalledWith("queues", [4, 5]);
  expect(reload).toHaveBeenCalled();
});

it("rejects queues from another company", async () => {
  const whatsapp = {
    companyId: 7,
    $set: jest.fn(),
    reload: jest.fn()
  } as unknown as Whatsapp;
  queueCount.mockResolvedValue(1);

  await expect(AssociateWhatsappQueue(whatsapp, [4, 5])).rejects.toMatchObject({
    message: "ERR_WAPP_INVALID_QUEUE"
  });
});

it("rejects malformed queue payloads", async () => {
  const whatsapp = { companyId: 7 } as Whatsapp;

  await expect(
    AssociateWhatsappQueue(whatsapp, "4" as unknown as number[])
  ).rejects.toMatchObject({ message: "ERR_WAPP_INVALID_QUEUE" });
});
