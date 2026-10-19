import { Request, Response } from "express";
import { storeTag, removeTag } from "../ContactController";
import ShowContactService from "../../services/ContactServices/ShowContactService";
import Tag from "../../models/Tag";
import { GetCompanySetting } from "../../helpers/CheckSettings";

jest.mock("../../services/ContactServices/ListContactsService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/ContactServices/CreateContactService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/ContactServices/ShowContactService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/ContactServices/UpdateContactService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/ContactServices/DeleteContactService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/ContactServices/GetContactService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/ContactServices/SimpleListService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock(
  "../../services/ContactServices/RefreshContactPictureService",
  () => ({ __esModule: true, default: jest.fn() })
);
jest.mock("../../services/WbotServices/CheckNumber", () => ({
  __esModule: true,
  default: jest.fn(),
  CheckNumberAndCreateContact: jest.fn()
}));
jest.mock("../../services/WbotServices/verifyContact", () => ({
  verifyContact: jest.fn()
}));
jest.mock("../../helpers/GetDefaultWhatsApp", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../helpers/CheckSettings", () => ({
  GetCompanySetting: jest.fn()
}));
jest.mock("../../database", () => ({ __esModule: true, default: {} }));
jest.mock("../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../../libs/wbot", () => ({ getWbot: jest.fn() }));
jest.mock("../../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));
jest.mock("../../models/Contact", () => ({ __esModule: true, default: {} }));
jest.mock("../../models/ContactCustomField", () => ({
  __esModule: true,
  default: {}
}));
jest.mock("../../models/WhatsappLidMap", () => ({
  __esModule: true,
  default: {}
}));
jest.mock("../../models/Tag", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));

describe("contact tags: reject cross-company relations before mutations", () => {
  const add = jest.fn();
  const remove = jest.fn();
  const request = () =>
    ({
      params: { contactId: "42", tagId: "3" },
      body: { tagId: 3, companyId: 8 },
      user: { id: "1", companyId: 7, profile: "user", isSuper: false }
    }) as unknown as Request;
  const response = () => {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res as unknown as Response;
  };
  beforeEach(() => {
    jest.resetAllMocks();
    (GetCompanySetting as jest.Mock).mockResolvedValue("both");
    (ShowContactService as jest.Mock).mockResolvedValue({
      id: 42,
      companyId: 7,
      $add: add,
      $remove: remove
    });
  });

  it.each([
    ["add", storeTag],
    ["remove", removeTag]
  ] as const)(
    "denies %s with a tag from another company without changing any relation",
    async (_name, controller) => {
      const foreign = { id: 3, companyId: 8 };
      (Tag.findOne as jest.Mock).mockImplementation(async ({ where }) =>
        where.id === foreign.id && where.companyId === foreign.companyId
          ? foreign
          : null
      );
      const res = response();
      await expect(controller(request(), res)).rejects.toMatchObject({
        statusCode: 404,
        message: "ERR_NO_TAG_FOUND"
      });
      expect(ShowContactService).toHaveBeenCalledWith("42", 7);
      expect(Tag.findOne).toHaveBeenCalledWith({
        where: { id: 3, companyId: 7 }
      });
      expect(add).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["add", storeTag],
    ["remove", removeTag]
  ] as const)(
    "denies %s when the contact belongs to another company",
    async (_name, controller) => {
      (ShowContactService as jest.Mock).mockRejectedValue({
        statusCode: 403,
        message: "wrong company"
      });
      const res = response();
      await expect(controller(request(), res)).rejects.toMatchObject({
        statusCode: 403
      });
      expect(ShowContactService).toHaveBeenCalledWith("42", 7);
      expect(Tag.findOne).not.toHaveBeenCalled();
      expect(add).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["add", storeTag],
    ["remove", removeTag]
  ] as const)(
    "respects tagsMode before %s without mutations",
    async (_name, controller) => {
      (GetCompanySetting as jest.Mock).mockResolvedValue("ticket");
      await expect(controller(request(), response())).rejects.toMatchObject({
        statusCode: 400,
        message: "ERR_INVALID_TAGMODE"
      });
      expect(add).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(Tag.findOne).not.toHaveBeenCalled();
    }
  );

  it("adds a tag only after validating contact and tag in the authenticated company", async () => {
    (Tag.findOne as jest.Mock).mockResolvedValue({ id: 3, companyId: 7 });
    const res = response();
    await storeTag(request(), res);
    expect(Tag.findOne).toHaveBeenCalledWith({
      where: { id: 3, companyId: 7 }
    });
    expect(add).toHaveBeenCalledWith("tags", 3);
    expect(remove).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("removes only the validated relation for the authenticated company", async () => {
    (Tag.findOne as jest.Mock).mockResolvedValue({ id: 3, companyId: 7 });
    const res = response();
    await removeTag(request(), res);
    expect(Tag.findOne).toHaveBeenCalledWith({
      where: { id: 3, companyId: 7 }
    });
    expect(remove).toHaveBeenCalledWith("tags", 3);
    expect(add).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
