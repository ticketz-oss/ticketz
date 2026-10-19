import { Request, Response } from "express";
import { show, remove } from "../QuickMessageController";
import QuickMessage from "../../models/QuickMessage";
import { getIO } from "../../libs/socket";

jest.mock("../../models/QuickMessage", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), findOne: jest.fn() }
}));
jest.mock("../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../../services/QuickMessageService/ListService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/QuickMessageService/CreateService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/QuickMessageService/UpdateService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/QuickMessageService/FindService", () => ({
  __esModule: true,
  default: jest.fn()
}));

describe("quick messages: isolated tenant guards without database", () => {
  const destroy = jest.fn();
  const emit = jest.fn();
  const request = () =>
    ({
      params: { id: "42" },
      user: { id: "1", companyId: 7, profile: "admin", isSuper: false }
    }) as unknown as Request;
  const response = () => {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res as unknown as Response;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (getIO as jest.Mock).mockReturnValue({ emit });
  });

  it("denies reading another company's record and sends no body/event", async () => {
    (QuickMessage.findByPk as jest.Mock).mockResolvedValue({
      id: 42,
      companyId: 8,
      destroy
    });
    const res = response();
    await expect(show(request(), res)).rejects.toMatchObject({
      statusCode: 404,
      message: "ERR_NO_QUICKMESSAGE_FOUND"
    });
    expect(res.json).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("allows reading the authenticated company's record", async () => {
    const record = { id: 42, companyId: 7 };
    (QuickMessage.findByPk as jest.Mock).mockResolvedValue(record);
    const res = response();
    await show(request(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(record);
  });

  it("scopes deletion lookup by company and does not mutate when absent", async () => {
    // The foreign row exists in the mock dataset, but is inaccessible through the scoped query.
    const foreign = { id: "42", companyId: 8, destroy };
    (QuickMessage.findOne as jest.Mock).mockImplementation(async ({ where }) =>
      where.id === foreign.id && where.companyId === foreign.companyId
        ? foreign
        : null
    );
    const res = response();
    await expect(remove(request(), res)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(QuickMessage.findOne).toHaveBeenCalledWith({
      where: { id: "42", companyId: 7 }
    });
    expect(destroy).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("deletes only the scoped record and emits only its company's event", async () => {
    (QuickMessage.findOne as jest.Mock).mockResolvedValue({
      id: 42,
      companyId: 7,
      destroy
    });
    const res = response();
    await remove(request(), res);
    expect(QuickMessage.findOne).toHaveBeenCalledWith({
      where: { id: "42", companyId: 7 }
    });
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith("company-7-quickmessage", {
      action: "delete",
      id: "42"
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
