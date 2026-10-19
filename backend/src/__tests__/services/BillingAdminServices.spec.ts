import { Op } from "sequelize";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import {
  canUseBillingConsole,
  hasCentralizedBillingFields,
  isBillingConsoleCompany
} from "../../helpers/billingConsole";
import {
  invoiceStatusLabel,
  invoiceWhere
} from "../../services/BillingAdminServices/BillingAdminQuery";
import BillingOverviewService from "../../services/BillingAdminServices/BillingOverviewService";
import CreateBillingInvoiceService from "../../services/BillingAdminServices/CreateBillingInvoiceService";
import DeleteBillingInvoiceService from "../../services/BillingAdminServices/DeleteBillingInvoiceService";
import {
  defaultChargeMessage,
  toWhatsAppNumber
} from "../../services/BillingAdminServices/SendBillingChargeService";
import { abacateReceiptUrl } from "../../services/PaymentGatewayServices/AbacatePayServices";

jest.mock("../../models/Company");
jest.mock("../../models/Invoices");
jest.mock("../../models/Plan");
jest.mock("../../database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(async (callback: (t: unknown) => unknown) =>
      callback({})
    )
  }
}));
jest.mock("../../services/PlatformServices/PlatformWebhookService", () => ({
  enqueueWebhook: jest.fn().mockResolvedValue(undefined)
}));

const companyFindByPk = Company.findByPk as jest.MockedFunction<
  typeof Company.findByPk
>;
const companyFindAll = Company.findAll as jest.MockedFunction<
  typeof Company.findAll
>;
const invoicesCreate = Invoices.create as jest.MockedFunction<
  typeof Invoices.create
>;
const invoicesFindAll = Invoices.findAll as jest.MockedFunction<
  typeof Invoices.findAll
>;
const invoicesFindByPk = Invoices.findByPk as jest.MockedFunction<
  typeof Invoices.findByPk
>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date("2026-09-17T12:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("acesso à Central de Cobrança", () => {
  it("só libera o tenant dono da plataforma", () => {
    expect(isBillingConsoleCompany({ slug: "teste" } as Company)).toBe(true);
    expect(isBillingConsoleCompany({ slug: "TESTE " } as Company)).toBe(true);
    expect(isBillingConsoleCompany({ slug: "acnorte" } as Company)).toBe(false);
    expect(isBillingConsoleCompany({ slug: null } as unknown as Company)).toBe(
      false
    );
    expect(isBillingConsoleCompany(null)).toBe(false);
  });

  it("aceita admin do tenant dono sem exigir super", () => {
    expect(
      canUseBillingConsole({ profile: "admin", super: false } as never)
    ).toBe(true);
    expect(
      canUseBillingConsole({ profile: "user", super: true } as never)
    ).toBe(true);
    expect(
      canUseBillingConsole({ profile: "user", super: false } as never)
    ).toBe(false);
  });

  it("identifica os campos financeiros que pertencem à Central", () => {
    expect(hasCentralizedBillingFields({ name: "AC Norte" })).toBe(false);
    expect(hasCentralizedBillingFields({ dueDate: "2026-10-19" })).toBe(true);
    expect(hasCentralizedBillingFields({ planId: 2 })).toBe(true);
  });
});

describe("DeleteBillingInvoiceService", () => {
  it("oculta a cobrança sem apagar o tombstone do ciclo", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    invoicesFindByPk.mockResolvedValue({
      id: 12,
      status: "open",
      update
    } as unknown as Invoices);

    await DeleteBillingInvoiceService(12);

    expect(update).toHaveBeenCalledWith({ status: "deleted" });
  });

  it("não permite excluir uma cobrança paga", async () => {
    invoicesFindByPk.mockResolvedValue({
      id: 12,
      status: "paid"
    } as Invoices);

    await expect(DeleteBillingInvoiceService(12)).rejects.toMatchObject({
      message: "ERR_PAID_INVOICE_CANNOT_BE_DELETED",
      statusCode: 409
    });
  });
});

describe("filtros de cobrança", () => {
  it("separa vencida de em aberto", () => {
    expect(invoiceStatusLabel("open", "2026-09-10")).toBe("overdue");
    expect(invoiceStatusLabel("open", "2026-09-30")).toBe("open");
    expect(invoiceStatusLabel("paid", "2026-01-01")).toBe("paid");
    expect(invoiceStatusLabel("cancelled", "2026-01-01")).toBe("cancelled");
  });

  it("monta o recorte de vencidas sem perder o intervalo pedido", () => {
    const where = invoiceWhere({
      status: "overdue",
      startDate: "2026-09-01",
      endDate: "2026-09-30"
    }) as Record<string, Record<symbol, string>>;

    expect(where.status).toBe("open");
    expect(where.dueDate[Op.gte]).toBe("2026-09-01");
    expect(where.dueDate[Op.lte]).toBe("2026-09-30");
    expect(where.dueDate[Op.lt]).toBe("2026-09-17");
  });
});

describe("CreateBillingInvoiceService", () => {
  const cliente = {
    id: 9,
    name: "AC Norte",
    slug: "acnorte",
    saleValue: null,
    plan: { name: "Mensalidade AI", value: 297, currency: "BRL" }
  } as unknown as Company;

  it("cai no valor contratado quando o financeiro não informa um", async () => {
    companyFindByPk.mockResolvedValue(cliente);
    invoicesCreate.mockImplementation(
      async (data: never) =>
        ({ ...(data as object), id: 1, createdAt: new Date() }) as Invoices
    );

    const invoice = await CreateBillingInvoiceService({
      companyId: 9,
      dueDate: "2026-10-05"
    });

    expect(invoice).toMatchObject({
      companyId: 9,
      value: 297,
      currency: "BRL",
      detail: "Mensalidade AI",
      status: "open",
      origem: "manual",
      competencia: "2026-10",
      dueDate: "2026-10-05"
    });
  });

  it("prefere o preço negociado ao do plano", async () => {
    companyFindByPk.mockResolvedValue({
      ...cliente,
      saleValue: 250
    } as unknown as Company);
    invoicesCreate.mockImplementation(
      async (data: never) =>
        ({ ...(data as object), id: 1, createdAt: new Date() }) as Invoices
    );

    const invoice = await CreateBillingInvoiceService({
      companyId: 9,
      dueDate: "2026-10-05"
    });

    expect(invoice.value).toBe(250);
  });

  it("recusa vencimento fora do formato e valor zerado", async () => {
    companyFindByPk.mockResolvedValue(cliente);

    await expect(
      CreateBillingInvoiceService({ companyId: 9, dueDate: "05/10/2026" })
    ).rejects.toMatchObject({ message: "ERR_INVALID_DUE_DATE" });

    await expect(
      CreateBillingInvoiceService({
        companyId: 9,
        dueDate: "2026-10-05",
        value: 0
      })
    ).rejects.toMatchObject({ message: "ERR_INVALID_INVOICE_VALUE" });
  });

  it("não deixa cobrar o próprio tenant dono", async () => {
    companyFindByPk.mockResolvedValue({
      ...cliente,
      slug: "teste"
    } as unknown as Company);

    await expect(
      CreateBillingInvoiceService({ companyId: 1, dueDate: "2026-10-05" })
    ).rejects.toMatchObject({ message: "ERR_CANNOT_BILL_OWNER_TENANT" });
  });
});

describe("BillingOverviewService", () => {
  it("soma por situação, ignora cancelada no faturado e monta o MRR", async () => {
    const plano = { id: 2, name: "Mensalidade AI", value: 297 } as Plan;

    invoicesFindAll.mockResolvedValue([
      {
        value: 297,
        status: "paid",
        dueDate: "2026-09-05",
        company: { planId: 2, plan: plano }
      },
      {
        value: 197,
        status: "open",
        dueDate: "2026-09-30",
        company: { planId: 1, plan: { id: 1, name: "Básica", value: 197 } }
      },
      {
        value: 100,
        status: "open",
        dueDate: "2026-09-10",
        company: { planId: 1, plan: { id: 1, name: "Básica", value: 197 } }
      },
      {
        value: 999,
        status: "cancelled",
        dueDate: "2026-09-12",
        company: { planId: 2, plan: plano }
      }
    ] as unknown as Invoices[]);

    companyFindAll.mockResolvedValue([
      { id: 9, status: true, planId: 2, saleValue: null, plan: plano },
      { id: 10, status: true, planId: 2, saleValue: 250, plan: plano },
      {
        id: 11,
        status: true,
        planId: 2,
        saleValue: null,
        trialEndsAt: "2026-09-30",
        plan: plano
      },
      { id: 12, status: false, planId: 2, saleValue: null, plan: plano }
    ] as unknown as Company[]);

    const overview = await BillingOverviewService({
      startDate: "2026-09-01",
      endDate: "2026-09-30"
    });

    expect(overview.totals).toMatchObject({
      billed: 594,
      received: 297,
      open: 197,
      overdue: 100,
      cancelled: 999,
      paidCount: 1,
      openCount: 1,
      overdueCount: 1
    });
    // Em teste e inativo ficam fora do MRR.
    expect(overview.mrr).toBe(547);
    expect(overview.clients).toEqual({
      total: 4,
      active: 2,
      trial: 1,
      inactive: 1
    });
    expect(overview.byMonth).toHaveLength(1);
    expect(overview.byMonth[0].label).toBe("09/2026");
  });
});

describe("envio da cobrança", () => {
  it("completa o DDI dos números nacionais e respeita os que já têm", () => {
    expect(toWhatsAppNumber("68999338737")).toBe("5568999338737");
    expect(toWhatsAppNumber("(68) 99991-7971")).toBe("5568999917971");
    expect(toWhatsAppNumber("+55 68 9950-1242")).toBe("556899501242");
    expect(toWhatsAppNumber("")).toBe("");
  });

  it("monta a mensagem com valor, vencimento e o copia-e-cola do PIX", () => {
    const texto = defaultChargeMessage({
      value: 297,
      currency: "BRL",
      dueDate: "2026-10-05",
      detail: "Mensalidade AI",
      forma: "pix",
      linkPagamento: "00020126...5204",
      company: { name: "AC Norte" }
    } as unknown as Invoices);

    expect(texto).toContain("AC Norte");
    expect(texto).toContain("Mensalidade AI");
    expect(texto).toContain("05/10/2026");
    expect(texto).toContain("PIX copia e cola");
    expect(texto).toContain("00020126...5204");
  });
});

describe("abacateReceiptUrl", () => {
  it("acha o comprovante em qualquer nível do payload guardado", () => {
    expect(
      abacateReceiptUrl({
        payGwData: JSON.stringify({
          method: "pix",
          checked: { status: "PAID", receiptUrl: "https://abacatepay.com/r/1" }
        })
      } as Invoices)
    ).toBe("https://abacatepay.com/r/1");
  });

  it("devolve null quando não há URL nem payload válido", () => {
    expect(
      abacateReceiptUrl({
        payGwData: JSON.stringify({ method: "pix" })
      } as Invoices)
    ).toBeNull();
    expect(
      abacateReceiptUrl({ payGwData: "não é json" } as Invoices)
    ).toBeNull();
  });
});
