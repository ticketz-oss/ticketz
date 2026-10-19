import Contact from "../../../models/Contact";
import WhatsappLidMap from "../../../models/WhatsappLidMap";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";
import {
  normalizeVoicePeer,
  resolveVoiceContact
} from "../VoiceContactService";

jest.mock("../../../models/Contact");
jest.mock("../../../models/WhatsappLidMap");
jest.mock("../../ContactServices/CreateOrUpdateContactService");

const contactFindOne = Contact.findOne as jest.MockedFunction<
  typeof Contact.findOne
>;
const lidFindOne = WhatsappLidMap.findOne as jest.MockedFunction<
  typeof WhatsappLidMap.findOne
>;
const lidFindOrCreate = WhatsappLidMap.findOrCreate as jest.MockedFunction<
  typeof WhatsappLidMap.findOrCreate
>;
const createContact = CreateOrUpdateContactService as jest.MockedFunction<
  typeof CreateOrUpdateContactService
>;

describe("normalizeVoicePeer", () => {
  it("removes the device suffix without appending it to the contact number", () => {
    expect(normalizeVoicePeer("7013815844992:2@lid")).toEqual({
      peer: "7013815844992:2@lid",
      number: "7013815844992@lid",
      lid: "7013815844992@lid"
    });
  });

  it("keeps a WhatsApp phone JID as a normalized phone number", () => {
    expect(normalizeVoicePeer("5511999999999:4@s.whatsapp.net")).toEqual({
      peer: "5511999999999:4@s.whatsapp.net",
      number: "5511999999999",
      lid: null
    });
  });
});

describe("resolveVoiceContact", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses the saved contact name for a known phone number", async () => {
    const saved = { id: 31, name: "Cliente Salvo", number: "5511999999999" };
    contactFindOne.mockResolvedValue(saved as Contact);

    const result = await resolveVoiceContact(1, "5511999999999@s.whatsapp.net");

    expect(result.contact).toBe(saved);
    expect(result.contact.name).toBe("Cliente Salvo");
    expect(createContact).not.toHaveBeenCalled();
  });

  it("creates an unknown LID contact and stores its mapping", async () => {
    const created = {
      id: 44,
      name: "7013815844992@lid",
      number: "7013815844992@lid"
    };
    lidFindOne.mockResolvedValue(null);
    contactFindOne.mockResolvedValue(null);
    createContact.mockResolvedValue(created as Contact);
    lidFindOrCreate.mockResolvedValue([{} as WhatsappLidMap, true]);

    const result = await resolveVoiceContact(1, "7013815844992:2@lid");

    expect(result.contact).toBe(created);
    expect(createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 1,
        number: "7013815844992@lid",
        name: "7013815844992@lid"
      })
    );
    expect(lidFindOrCreate).toHaveBeenCalledWith({
      where: { companyId: 1, lid: "7013815844992@lid" },
      defaults: {
        companyId: 1,
        lid: "7013815844992@lid",
        contactId: 44
      }
    });
  });
});
