import Contact from "../../../models/Contact";
import WhatsappLidMap from "../../../models/WhatsappLidMap";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";
import { verifyContact } from "../verifyContact";

jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
}));
jest.mock("../../../models/WhatsappLidMap", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  }
}));
jest.mock("../../ContactServices/CreateOrUpdateContactService", () => ({
  __esModule: true,
  default: jest.fn(),
  updateContact: jest.fn()
}));
jest.mock("../../ContactServices/MergeContactsService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../GetProfilePicUrl", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}));

describe("verifyContact LID safety", () => {
  const wbot = {
    onWhatsApp: jest.fn()
  } as never;

  beforeEach(() => {
    (Contact.findAll as jest.Mock).mockResolvedValue([]);
    (WhatsappLidMap.findOne as jest.Mock).mockResolvedValue(null);
    (WhatsappLidMap.findAll as jest.Mock).mockResolvedValue([]);
  });

  it("never creates a contact using a bare WhatsApp LID as its number", async () => {
    await expect(
      verifyContact(
        {
          id: "701234567890123@lid",
          name: "Contato sem telefone"
        },
        wbot,
        7
      )
    ).rejects.toThrow("ERR_WAPP_CONTACT_PHONE_UNAVAILABLE");

    expect(CreateOrUpdateContactService).not.toHaveBeenCalled();
  });

  it("uses the canonical phone JID when WhatsApp supplies it with a LID", async () => {
    const createdContact = { id: 99 };
    (CreateOrUpdateContactService as jest.Mock).mockResolvedValue(
      createdContact
    );
    (wbot as { onWhatsApp: jest.Mock }).onWhatsApp.mockResolvedValue([
      {
        exists: true,
        jid: "5568999999999@s.whatsapp.net",
        lid: "701234567890123@lid"
      }
    ]);

    await expect(
      verifyContact(
        {
          id: "701234567890123@lid",
          jid: "5568999999999@s.whatsapp.net",
          name: "Contato correto"
        },
        wbot,
        7
      )
    ).resolves.toBe(createdContact);

    expect(CreateOrUpdateContactService).toHaveBeenCalledWith(
      expect.objectContaining({
        number: "5568999999999",
        isGroup: false,
        companyId: 7
      })
    );
  });
});
