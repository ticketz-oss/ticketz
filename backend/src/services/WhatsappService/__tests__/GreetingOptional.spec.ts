import Company from "../../../models/Company";
import Whatsapp from "../../../models/Whatsapp";
import CreateWhatsAppService from "../CreateWhatsAppService";
import UpdateWhatsAppService from "../UpdateWhatsAppService";
import AssociateWhatsappQueue from "../AssociateWhatsappQueue";
import ShowWhatsAppService from "../ShowWhatsAppService";

jest.mock("../../../models/Company");
jest.mock("../../../models/Whatsapp");
jest.mock("../AssociateWhatsappQueue");
jest.mock("../ShowWhatsAppService");

const companyFindOne = Company.findOne as jest.MockedFunction<
  typeof Company.findOne
>;
const whatsappCount = Whatsapp.count as jest.MockedFunction<
  typeof Whatsapp.count
>;
const whatsappFindOne = Whatsapp.findOne as jest.MockedFunction<
  typeof Whatsapp.findOne
>;
const whatsappCreate = Whatsapp.create as jest.MockedFunction<
  typeof Whatsapp.create
>;
const associateQueues = AssociateWhatsappQueue as jest.MockedFunction<
  typeof AssociateWhatsappQueue
>;
const showWhatsapp = ShowWhatsAppService as jest.MockedFunction<
  typeof ShowWhatsAppService
>;

beforeEach(() => {
  jest.clearAllMocks();
  companyFindOne.mockResolvedValue({
    id: 7,
    plan: { connections: 10 }
  } as Company);
  whatsappCount.mockResolvedValue(0);
  whatsappFindOne.mockResolvedValue(null);
  associateQueues.mockResolvedValue(undefined);
});

it("creates a multi-queue connection without a greeting", async () => {
  const whatsapp = { id: 12, companyId: 7 } as Whatsapp;
  whatsappCreate.mockResolvedValue(whatsapp);

  await expect(
    CreateWhatsAppService({
      name: "Atendimento",
      companyId: 7,
      queueIds: [3, 4],
      greetingMessage: ""
    })
  ).resolves.toMatchObject({ whatsapp });

  expect(associateQueues).toHaveBeenCalledWith(whatsapp, [3, 4]);
});

it("updates a multi-queue connection without a greeting", async () => {
  const update = jest.fn().mockResolvedValue(undefined);
  const whatsapp = { id: 12, companyId: 7, update } as unknown as Whatsapp;
  showWhatsapp.mockResolvedValue(whatsapp);

  await expect(
    UpdateWhatsAppService({
      whatsappId: "12",
      companyId: 7,
      whatsappData: {
        name: "Atendimento",
        queueIds: [3, 4],
        greetingMessage: ""
      }
    })
  ).resolves.toMatchObject({ whatsapp });

  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ greetingMessage: "" })
  );
  expect(associateQueues).toHaveBeenCalledWith(whatsapp, [3, 4]);
});
