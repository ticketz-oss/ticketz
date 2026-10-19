import Company from "../../../models/Company";
import Whatsapp from "../../../models/Whatsapp";
import CreateWhatsAppService from "../CreateWhatsAppService";
import UpdateWhatsAppService from "../UpdateWhatsAppService";
import ShowWhatsAppService from "../ShowWhatsAppService";

jest.mock("../../../models/Company");
jest.mock("../../../models/Whatsapp");
jest.mock("../AssociateWhatsappQueue");
jest.mock("../ShowWhatsAppService");

beforeEach(() => {
  jest.clearAllMocks();
  (Whatsapp.count as jest.Mock).mockResolvedValue(0);
  (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);
  (Whatsapp.create as jest.Mock).mockImplementation(async values => values);
});

it.each([
  ["meta", "baileys", "official", "DISCONNECTED"],
  ["normal", "official", "baileys", "OPENING"]
])(
  "derives %s company connections from the persisted company and ignores client provider injection",
  async (whatsappMode, injectedMode, expectedMode, status) => {
    (Company.findOne as jest.Mock).mockResolvedValue({
      id: 7,
      whatsappMode,
      plan: { connections: 10 }
    });
    await CreateWhatsAppService({
      name: "Atendimento",
      companyId: 7,
      status: "OPENING",
      apiMode: injectedMode
    } as never);
    expect(Whatsapp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 7,
        apiMode: expectedMode,
        status
      }),
      expect.anything()
    );
  }
);

it.each(["official", "baileys"])(
  "cannot change a %s connection provider through the update payload",
  async apiMode => {
    const update = jest.fn();
    (ShowWhatsAppService as jest.Mock).mockResolvedValue({
      id: 4,
      companyId: 7,
      apiMode,
      update
    });
    await UpdateWhatsAppService({
      whatsappId: "4",
      companyId: 7,
      whatsappData: {
        name: "Atendimento",
        apiMode: apiMode === "official" ? "baileys" : "official"
      }
    } as never);
    expect(update).toHaveBeenCalled();
    expect(update.mock.calls[0][0]).not.toHaveProperty("apiMode");
  }
);
