import Partner from "../../models/Partner";
import PartnerPayout from "../../models/PartnerPayout";
import UpdatePartnerSettingsService from "../../services/PartnerServices/UpdatePartnerSettingsService";

jest.mock("../../models/Partner");
jest.mock("../../models/PartnerPayout");
jest.mock("../../services/PaymentGatewayServices/AbacatePayServices", () => ({
  __esModule: true,
  PIX_KEY_TYPES: ["CPF", "CNPJ", "PHONE", "EMAIL", "RANDOM"],
  getPartnerPixFee: jest.fn().mockResolvedValue(1.3)
}));
jest.mock("../../services/PartnerServices/AccrualPartnerPayoutService", () => ({
  __esModule: true,
  round2: (value: number) => Math.round(value * 100) / 100
}));

const findByPk = Partner.findByPk as jest.MockedFunction<
  typeof Partner.findByPk
>;
const payoutUpdate = PartnerPayout.update as jest.MockedFunction<
  typeof PartnerPayout.update
>;
const payoutFindAll = PartnerPayout.findAll as jest.MockedFunction<
  typeof PartnerPayout.findAll
>;

const partnerRecord = (fields: Partial<Partner> = {}) => {
  const record: any = {
    id: 1,
    pixKey: null,
    pixKeyType: null,
    payoutMode: "immediate",
    payoutDay: null,
    ...fields
  };

  record.update = jest.fn(async (payload: Record<string, any>) => {
    Object.assign(record, payload);
    return record;
  });
  record.reload = jest.fn(async () => record);

  return record;
};

beforeEach(() => {
  jest.clearAllMocks();
  payoutUpdate.mockResolvedValue([0] as any);
  payoutFindAll.mockResolvedValue([] as any);
});

describe("UpdatePartnerSettingsService", () => {
  it("aceita payoutDay nulo no modo imediato e salva a chave Pix", async () => {
    const partner = partnerRecord();
    findByPk.mockResolvedValue(partner);

    await UpdatePartnerSettingsService(1, {
      pixKey: "03677394295",
      pixKeyType: "CPF",
      payoutMode: "immediate",
      payoutDay: null
    });

    expect(partner.update).toHaveBeenCalledWith(
      expect.objectContaining({
        pixKey: "03677394295",
        pixKeyType: "CPF",
        payoutMode: "immediate",
        payoutDay: null
      })
    );
  });

  it("recusa limpar o dia quando o modo é agendado", async () => {
    const partner = partnerRecord({ payoutMode: "scheduled", payoutDay: 5 });
    findByPk.mockResolvedValue(partner);

    await expect(
      UpdatePartnerSettingsService(1, {
        payoutMode: "scheduled",
        payoutDay: null
      })
    ).rejects.toMatchObject({ message: "ERR_PAYOUT_DAY_REQUIRED" });
  });

  it("recusa dia fora do intervalo permitido", async () => {
    const partner = partnerRecord();
    findByPk.mockResolvedValue(partner);

    await expect(
      UpdatePartnerSettingsService(1, { payoutDay: 31 })
    ).rejects.toMatchObject({ message: "ERR_INVALID_PAYOUT_DAY" });
  });

  it("aceita dia válido no modo agendado", async () => {
    const partner = partnerRecord();
    findByPk.mockResolvedValue(partner);

    await UpdatePartnerSettingsService(1, {
      payoutMode: "scheduled",
      payoutDay: 10
    });

    expect(partner.update).toHaveBeenCalledWith(
      expect.objectContaining({ payoutMode: "scheduled", payoutDay: 10 })
    );
  });
});
