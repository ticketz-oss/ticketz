import moment from "moment";
import { Op } from "sequelize";
import Company from "../../../models/Company";
import Invoices from "../../../models/Invoices";
import { GetCompanySetting } from "../../../helpers/CheckSettings";
import { subscriptionDeadline } from "../../../helpers/subscriptionDeadline";
import SubscriptionNoticeService from "../SubscriptionNoticeService";

jest.mock("../../../models/Company", () => ({ findByPk: jest.fn() }));
jest.mock("../../../models/Invoices", () => ({ findOne: jest.fn() }));
jest.mock("../../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn()
}));

describe("subscription billing notice", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 25, 12));
    (Company.findByPk as jest.Mock).mockResolvedValue({
      id: 9,
      dueDate: "2026-09-25"
    });
    (Invoices.findOne as jest.Mock).mockResolvedValue({
      id: 18,
      dueDate: "2026-09-25"
    });
    (GetCompanySetting as jest.Mock).mockResolvedValue("5");
  });
  afterEach(() => jest.useRealTimers());

  it("exposes trial status and delays billing notice until the exact expiration", async () => {
    const trial = {
      id: 9,
      trialEndsAt: "2026-09-25",
      trialStartedAt: "2026-09-11T18:00:00Z",
      trialExpiresAt: "2026-09-25T18:00:00Z"
    };
    (Company.findByPk as jest.Mock).mockResolvedValue(trial);
    jest.setSystemTime(new Date("2026-09-25T17:59:59Z"));
    expect(await SubscriptionNoticeService(9)).toMatchObject({
      notice: null,
      trial: { status: "active" }
    });
    expect(Invoices.findOne).not.toHaveBeenCalled();
    jest.setSystemTime(new Date("2026-09-25T18:00:00Z"));
    expect(await SubscriptionNoticeService(9)).toMatchObject({
      trial: { status: "expired" }
    });
    expect(Invoices.findOne).toHaveBeenCalled();
  });

  it.each([
    [25, "warning", 6],
    [26, "error", 5],
    [27, "error", 4],
    [28, "error", 3],
    [29, "error", 2],
    [30, "error", 1]
  ])(
    "shows the correct severity and inclusive payment days on September %i",
    async (day, severity, remainingDays) => {
      jest.setSystemTime(new Date(2026, 8, day, 12));
      const { notice } = await SubscriptionNoticeService(9);
      expect(notice).toMatchObject({
        severity,
        remainingDays,
        deadline: "2026-09-30",
        blocked: false
      });
      expect(Invoices.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyId: 9,
            status: "open",
            dueDate: { [Op.lte]: moment().format("YYYY-MM-DD") }
          }
        })
      );
    }
  );

  it("allows the entire fifth day and blocks at the beginning of day six", () => {
    const deadline = subscriptionDeadline("2026-09-25", 5);
    expect(deadline.format("YYYY-MM-DD HH:mm:ss.SSS")).toBe(
      "2026-09-30 23:59:59.999"
    );
    expect(
      moment(new Date(2026, 8, 30, 23, 59, 59, 999)).isSameOrBefore(deadline)
    ).toBe(true);
    expect(moment(new Date(2026, 9, 1)).isAfter(deadline)).toBe(true);
  });

  it("reports an expired deadline after the five complete grace days", async () => {
    jest.setSystemTime(new Date(2026, 9, 1));
    expect((await SubscriptionNoticeService(9)).notice).toMatchObject({
      blocked: true,
      remainingDays: 0
    });
  });

  it("removes the notice once no due open invoice remains", async () => {
    (Invoices.findOne as jest.Mock).mockResolvedValue(null);
    expect((await SubscriptionNoticeService(9)).notice).toBeNull();
  });

  it("uses the open invoice even when the company subscription date was extended", async () => {
    (Company.findByPk as jest.Mock).mockResolvedValue({
      id: 9,
      dueDate: "2026-10-19"
    });
    expect((await SubscriptionNoticeService(9)).notice).toMatchObject({
      deadline: "2026-09-30"
    });
  });

  it.each([
    { id: 1 },
    { id: 9, platformBilling: "plataforma" },
    { id: 9, trialEndsAt: "2026-10-01" }
  ])(
    "excludes exempt companies, external billing and active trials",
    async company => {
      (Company.findByPk as jest.Mock).mockResolvedValue(company);
      expect((await SubscriptionNoticeService(company.id)).notice).toBeNull();
      expect(Invoices.findOne).not.toHaveBeenCalled();
    }
  );
});
