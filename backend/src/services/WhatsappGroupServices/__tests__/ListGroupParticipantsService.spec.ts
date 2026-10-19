import Whatsapp from "../../../models/Whatsapp";
import Contact from "../../../models/Contact";
import WhatsappLidMap from "../../../models/WhatsappLidMap";
import GetTicketWbot from "../../../helpers/GetTicketWbot";
import { getJidOf } from "../../WbotServices/getJidOf";
import { assertGroupAccess } from "../GroupAccessService";
import ListGroupParticipantsService from "../ListGroupParticipantsService";

jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findByPk: jest.fn() }
}));
beforeEach(() => jest.clearAllMocks());

jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
}));
jest.mock("../../../models/WhatsappLidMap", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
}));
jest.mock("../../../helpers/GetTicketWbot", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../WbotServices/getJidOf", () => ({ getJidOf: jest.fn() }));
jest.mock("../GroupAccessService", () => ({ assertGroupAccess: jest.fn() }));

it("returns group participants enriched with saved contact data", async () => {
  const ticket = {
    id: 20,
    companyId: 7,
    contact: { number: "123@g.us", name: "Equipe" }
  };
  (assertGroupAccess as jest.Mock).mockResolvedValue(ticket);
  (getJidOf as jest.Mock).mockReturnValue("123@g.us");
  (GetTicketWbot as jest.Mock).mockResolvedValue({
    user: { id: "5511999999999:4@s.whatsapp.net" },
    myJid: "5511999999999@s.whatsapp.net",
    groupMetadata: jest.fn().mockResolvedValue({
      subject: "Equipe",
      participants: [
        {
          id: "5511999999999:4@s.whatsapp.net",
          jid: "5511999999999@s.whatsapp.net",
          admin: "admin"
        },
        {
          id: "123456@lid",
          lid: "123456@lid",
          admin: null
        }
      ]
    })
  });
  (Contact.findAll as jest.Mock).mockResolvedValue([
    {
      id: 31,
      name: "Guilherme",
      number: "5511999999999",
      profilePicUrl: "avatar.jpg"
    }
  ]);
  (WhatsappLidMap.findAll as jest.Mock).mockResolvedValue([
    {
      lid: "123456@lid",
      contact: {
        id: 32,
        name: "Ana",
        number: "5511888888888",
        profilePicUrl: ""
      }
    }
  ]);

  const result = await ListGroupParticipantsService(20, {
    id: 2,
    companyId: 7,
    profile: "user"
  });

  expect(assertGroupAccess).toHaveBeenCalledWith(20, {
    id: 2,
    companyId: 7,
    profile: "user"
  });
  expect(result.count).toBe(2);
  expect(result.participants).toEqual([
    expect.objectContaining({
      contactId: 31,
      name: "Guilherme",
      isMe: true,
      admin: "admin"
    }),
    expect.objectContaining({
      contactId: 32,
      name: "Ana",
      isMe: false
    })
  ]);
});

it("rejects official group lookups before requesting a Baileys socket", async () => {
  (assertGroupAccess as jest.Mock).mockResolvedValue({
    id: 20,
    companyId: 7,
    whatsappId: 3
  });
  (Whatsapp.findByPk as jest.Mock).mockResolvedValue({ apiMode: "official" });
  await expect(
    ListGroupParticipantsService(20, {
      id: 1,
      companyId: 7,
      profile: "admin"
    } as never)
  ).rejects.toMatchObject({ message: "ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED" });
  expect(GetTicketWbot).not.toHaveBeenCalled();
});
