import Company from "../../models/Company";
import Partner from "../../models/Partner";
import Plan from "../../models/Plan";
import CreateCompanyService from "../../services/CompanyService/CreateCompanyService";
import UpdateCompanyService from "../../services/CompanyService/UpdateCompanyService";
import {
  CreatePartnerCompany,
  UpdatePartnerCompany
} from "../../services/PartnerServices/PartnerCompanyService";

jest.mock("../../models/Company");
jest.mock("../../models/Partner");
jest.mock("../../models/Plan");
jest.mock("../../models/Invoices");
jest.mock("../../services/CompanyService/CreateCompanyService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/CompanyService/UpdateCompanyService", () => ({
  __esModule: true,
  default: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
  (Partner.findByPk as jest.Mock).mockResolvedValue({ id: 1, discountPct: 0 });
  (Plan.findByPk as jest.Mock).mockResolvedValue({ id: 2, value: 30 });
});

it.each(["normal", "meta"])(
  "preserves %s provider selection when provisioning through a partner",
  async mode => {
    await CreatePartnerCompany(1, {
      name: "Partner tenant",
      email: "tenant@example.com",
      planId: 2,
      saleValue: 30,
      whatsappMode: mode as "normal" | "meta"
    });
    expect(CreateCompanyService).toHaveBeenCalledWith(
      expect.objectContaining({ whatsappMode: mode })
    );
  }
);

it("passes attempted provider changes to the immutable company update validation", async () => {
  (Company.findOne as jest.Mock).mockResolvedValue({
    id: 3,
    name: "Existing",
    planId: 2,
    whatsappMode: "normal"
  });
  await UpdatePartnerCompany(1, 3, { whatsappMode: "meta" });
  expect(UpdateCompanyService).toHaveBeenCalledWith(
    expect.objectContaining({ id: 3, whatsappMode: "meta" })
  );
});
