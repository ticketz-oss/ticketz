import AppError from "../../../errors/AppError";
import Invoice from "../../../models/Invoices";
import ShowInvoiceService from "../ShowInvoiceService";
import UpdateInvoiceService from "../UpdateInvoiceService";
import { processInvoicePaid } from "../../PaymentGatewayServices/PaymentGatewayServices";

jest.mock("../../../models/Invoices");
jest.mock("../../PaymentGatewayServices/PaymentGatewayServices", () => ({
  processInvoicePaid: jest.fn()
}));

describe("invoice tenant and transition security", () => {
  beforeEach(() => jest.clearAllMocks());

  it("scopes invoice detail by authenticated company", async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue({ id: 9 });
    await ShowInvoiceService(9, 42);
    expect(Invoice.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 9, companyId: 42 })
      })
    );
  });

  it("does not permit arbitrary status transitions", async () => {
    (Invoice.findByPk as jest.Mock).mockResolvedValue({
      status: "open",
      update: jest.fn()
    });
    await expect(
      UpdateInvoiceService({ id: 9, status: "admin-forged" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("delegates the only stateful paid transition to replay-safe processing", async () => {
    const reload = jest.fn();
    const invoice = { status: "open", reload };
    (Invoice.findByPk as jest.Mock).mockResolvedValue(invoice);
    await UpdateInvoiceService({ id: 9, status: "paid" });
    expect(processInvoicePaid).toHaveBeenCalledWith(invoice);
    expect(reload).toHaveBeenCalled();
  });
});
