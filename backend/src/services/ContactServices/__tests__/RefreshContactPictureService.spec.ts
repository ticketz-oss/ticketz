jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../helpers/GetDefaultWhatsApp", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../../libs/wbot", () => ({ getWbot: jest.fn() }));
jest.mock("../../../libs/cache", () => ({
  cacheLayer: { get: jest.fn(), set: jest.fn() }
}));
jest.mock("../../WbotServices/GetProfilePicUrl", () => ({
  __esModule: true,
  default: jest.fn(),
  invalidateProfilePicture: jest.fn()
}));
import Contact from "../../../models/Contact";
import GetDefaultWhatsApp from "../../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../../libs/wbot";
import { cacheLayer } from "../../../libs/cache";
import GetProfilePicUrl from "../../WbotServices/GetProfilePicUrl";
import refresh from "../RefreshContactPictureService";
let contact: Pick<
  Contact,
  | "id"
  | "companyId"
  | "number"
  | "channel"
  | "profilePicUrl"
  | "profileHiresPictureUrl"
  | "isGroup"
> & { update: jest.Mock };
beforeEach(() => {
  jest.resetAllMocks();
  contact = {
    id: 4,
    companyId: 9,
    number: "5568999999999",
    isGroup: false,
    channel: "whatsapp",
    profilePicUrl: "old",
    profileHiresPictureUrl: "",
    update: jest.fn(async values => Object.assign(contact, values))
  };
  (Contact.findOne as jest.Mock).mockResolvedValue(contact);
  (GetDefaultWhatsApp as jest.Mock).mockResolvedValue({ id: 8 });
  (getWbot as jest.Mock).mockReturnValue({ id: 8 });
});
it("uses only the authenticated tenant's contact and session, updating URLs only", async () => {
  (GetProfilePicUrl as jest.Mock)
    .mockResolvedValueOnce("preview")
    .mockResolvedValueOnce("hires");
  expect(await refresh("4", 9)).toEqual({
    profilePicUrl: "preview",
    profileHiresPictureUrl: "hires"
  });
  expect(Contact.findOne).toHaveBeenCalledWith({
    where: { id: "4", companyId: 9 }
  });
  expect(GetDefaultWhatsApp).toHaveBeenCalledWith(9);
  expect(GetProfilePicUrl).toHaveBeenCalledWith(
    "5568999999999@s.whatsapp.net",
    "preview",
    { id: 8 }
  );
  expect(contact.update).toHaveBeenCalledWith({
    profilePicUrl: "preview",
    profileHiresPictureUrl: "hires"
  });
});
it("rejects contacts outside the tenant before consulting WhatsApp", async () => {
  (Contact.findOne as jest.Mock).mockResolvedValue(null);
  await expect(refresh("4", 10)).rejects.toMatchObject({ statusCode: 404 });
  expect(GetDefaultWhatsApp).not.toHaveBeenCalled();
});
it("preserves photos when disconnected and does not start a session", async () => {
  (GetDefaultWhatsApp as jest.Mock).mockRejectedValue(
    new Error("disconnected")
  );
  expect(await refresh("4", 9)).toEqual({
    profilePicUrl: "old",
    profileHiresPictureUrl: ""
  });
  expect(getWbot).not.toHaveBeenCalled();
  expect(contact.update).not.toHaveBeenCalled();
});
it("preserves URLs on privacy errors and limits retries", async () => {
  (GetProfilePicUrl as jest.Mock).mockRejectedValue(new Error("private"));
  await refresh("4", 9);
  expect(contact.update).not.toHaveBeenCalled();
  expect(cacheLayer.set).toHaveBeenCalledWith(
    "contact-picture-refresh:9:4",
    "1",
    "EX",
    300
  );
  (cacheLayer.get as jest.Mock).mockResolvedValue("1");
  await refresh("4", 9);
  expect(GetDefaultWhatsApp).toHaveBeenCalledTimes(1);
});
it("supports group and LID identifiers", async () => {
  contact.isGroup = true;
  contact.number = "123";
  await refresh("4", 9);
  expect(GetProfilePicUrl).toHaveBeenCalledWith("123@g.us", "image", { id: 8 });
  contact.number = "456@lid";
  await refresh("4", 9);
  expect(GetProfilePicUrl).toHaveBeenCalledWith("456@lid", "preview", {
    id: 8
  });
});
it("does not request WhatsApp photos for other channels", async () => {
  contact.channel = "telegram";
  await refresh("4", 9);
  expect(GetDefaultWhatsApp).not.toHaveBeenCalled();
});
