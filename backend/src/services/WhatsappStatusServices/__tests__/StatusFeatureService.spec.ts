import Company from "../../../models/Company";
import { getIO } from "../../../libs/socket";
import { cancelPendingForCompany } from "../StatusPostService";
import {
  isStatusEnabled,
  listCompaniesWithStatusFlag,
  setStatusEnabled
} from "../StatusFeatureService";

jest.mock("../../../models/Company");
jest.mock("../../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../StatusPostService", () => ({
  cancelPendingForCompany: jest.fn()
}));

const emit = jest.fn();
const to = jest.fn(() => ({ emit }));

const fakeCompany = (whatsappStatusEnabled: boolean) => {
  const company = {
    id: 7,
    name: "Empresa A",
    whatsappStatusEnabled,
    update: jest.fn(async (values: { whatsappStatusEnabled: boolean }) => {
      company.whatsappStatusEnabled = values.whatsappStatusEnabled;
      return company;
    })
  };
  return company;
};

beforeEach(() => {
  jest.clearAllMocks();
  (getIO as jest.Mock).mockReturnValue({ to });
  (cancelPendingForCompany as jest.Mock).mockResolvedValue(undefined);
});

it("treats missing company or false flag as disabled", async () => {
  (Company.findByPk as jest.Mock).mockResolvedValueOnce(null);
  await expect(isStatusEnabled(7)).resolves.toBe(false);

  (Company.findByPk as jest.Mock).mockResolvedValueOnce({
    whatsappStatusEnabled: false
  });
  await expect(isStatusEnabled(7)).resolves.toBe(false);

  (Company.findByPk as jest.Mock).mockResolvedValueOnce({
    whatsappStatusEnabled: true
  });
  await expect(isStatusEnabled(7)).resolves.toBe(true);
});

it("enables a company and emits availability to its channel only", async () => {
  const company = fakeCompany(false);
  (Company.findByPk as jest.Mock).mockResolvedValue(company);

  const result = await setStatusEnabled(7, true);

  expect(company.update).toHaveBeenCalledWith({ whatsappStatusEnabled: true });
  expect(result).toEqual({
    id: 7,
    name: "Empresa A",
    whatsappStatusEnabled: true
  });
  expect(to).toHaveBeenCalledTimes(1);
  expect(to).toHaveBeenCalledWith("company-7-mainchannel");
  expect(emit).toHaveBeenCalledWith("company-7-whatsapp-status-availability", {
    enabled: true
  });
  expect(cancelPendingForCompany).not.toHaveBeenCalled();
});

it("cancels pending posts when disabling", async () => {
  const company = fakeCompany(true);
  (Company.findByPk as jest.Mock).mockResolvedValue(company);

  await setStatusEnabled(7, false);

  expect(company.update).toHaveBeenCalledWith({ whatsappStatusEnabled: false });
  expect(cancelPendingForCompany).toHaveBeenCalledWith(7);
  expect(emit).toHaveBeenCalledWith("company-7-whatsapp-status-availability", {
    enabled: false
  });
});

it("rejects unknown company with ERR_COMPANY_NOT_FOUND", async () => {
  (Company.findByPk as jest.Mock).mockResolvedValue(null);

  await expect(setStatusEnabled(99, true)).rejects.toMatchObject({
    message: "ERR_COMPANY_NOT_FOUND",
    statusCode: 404
  });
  expect(emit).not.toHaveBeenCalled();
  expect(cancelPendingForCompany).not.toHaveBeenCalled();
});

it("lists 20 companies per page ordered by name with the status flag", async () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({
    get: () => ({
      id: index + 1,
      name: `Empresa ${index + 1}`,
      whatsappMode: "normal",
      whatsappStatusEnabled: index === 0
    })
  }));
  (Company.findAndCountAll as jest.Mock).mockResolvedValue({
    rows,
    count: 25
  });

  const result = await listCompaniesWithStatusFlag({
    searchParam: "Emp",
    pageNumber: 1
  });

  const options = (Company.findAndCountAll as jest.Mock).mock.calls[0][0];
  expect(options.limit).toBe(20);
  expect(options.offset).toBe(0);
  expect(options.order[0]).toEqual(["name", "ASC"]);
  expect(options.attributes).toEqual([
    "id",
    "name",
    "whatsappMode",
    "whatsappStatusEnabled"
  ]);
  expect(options.where).toHaveProperty("name");
  expect(result.hasMore).toBe(true);
  expect(result.companies[0]).toEqual({
    id: 1,
    name: "Empresa 1",
    whatsappMode: "normal",
    whatsappStatusEnabled: true
  });
});
