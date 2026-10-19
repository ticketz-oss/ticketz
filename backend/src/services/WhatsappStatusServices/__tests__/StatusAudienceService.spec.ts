import Contact from "../../../models/Contact";
import Ticket from "../../../models/Ticket";
import ContactList from "../../../models/ContactList";
import ContactListItem from "../../../models/ContactListItem";
import { resolveAudienceJids, previewAudience } from "../StatusAudienceService";

// Models are classes (getJidOf uses instanceof), with static finders mocked.
jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: class MockContact {
    static findAll = jest.fn();
  }
}));
jest.mock("../../../models/Ticket", () => ({
  __esModule: true,
  default: class MockTicket {}
}));
jest.mock("../../../models/ContactList", () => ({
  __esModule: true,
  default: class MockContactList {
    static findOne = jest.fn();
  }
}));
jest.mock("../../../models/ContactListItem", () => ({
  __esModule: true,
  default: class MockContactListItem {
    static findAll = jest.fn();
  }
}));

const contactFindAll = Contact.findAll as unknown as jest.Mock;
const listFindOne = ContactList.findOne as unknown as jest.Mock;
const itemFindAll = ContactListItem.findAll as unknown as jest.Mock;

describe("StatusAudienceService", () => {
  const originalMax = process.env.WHATSAPP_STATUS_MAX_AUDIENCE;

  beforeEach(() => {
    contactFindAll.mockReset();
    listFindOne.mockReset();
    itemFindAll.mockReset();
  });

  afterEach(() => {
    if (originalMax === undefined) {
      delete process.env.WHATSAPP_STATUS_MAX_AUDIENCE;
    } else {
      process.env.WHATSAPP_STATUS_MAX_AUDIENCE = originalMax;
    }
  });

  it("builds JIDs only from contacts that talked to this connection", async () => {
    contactFindAll.mockResolvedValue([
      { id: 1, name: "Ana", number: "14155550101", isGroup: false },
      { id: 2, name: "Broken", number: "not-a-number", isGroup: false },
      { id: 3, name: "Bruno", number: "14155550102", isGroup: false }
    ]);

    const jids = await resolveAudienceJids({
      companyId: 7,
      whatsappId: 3,
      audienceMode: "connection_contacts"
    });

    expect(jids).toEqual([
      "14155550101@s.whatsapp.net",
      "14155550102@s.whatsapp.net"
    ]);
    const query = contactFindAll.mock.calls[0][0];
    expect(query.where).toMatchObject({ companyId: 7, isGroup: false });
    expect(query.include).toEqual([
      expect.objectContaining({
        model: Ticket,
        required: true,
        where: { whatsappId: 3, companyId: 7 }
      })
    ]);
    expect(listFindOne).not.toHaveBeenCalled();
    expect(itemFindAll).not.toHaveBeenCalled();
  });

  it("uses only WhatsApp-valid items of a contact list of the same company", async () => {
    listFindOne.mockResolvedValue({ id: 11, companyId: 7 });
    itemFindAll.mockResolvedValue([
      { name: "Carla", number: "14155550103", isWhatsappValid: true },
      { name: "Davi", number: "14155550104", isWhatsappValid: true }
    ]);

    const jids = await resolveAudienceJids({
      companyId: 7,
      whatsappId: 3,
      audienceMode: "contact_list",
      contactListId: 11
    });

    expect(jids).toEqual([
      "14155550103@s.whatsapp.net",
      "14155550104@s.whatsapp.net"
    ]);
    expect(listFindOne.mock.calls[0][0].where).toEqual({
      id: 11,
      companyId: 7
    });
    expect(itemFindAll.mock.calls[0][0].where).toEqual({
      contactListId: 11,
      companyId: 7,
      isWhatsappValid: true
    });
    expect(contactFindAll).not.toHaveBeenCalled();
  });

  it("throws ERR_STATUS_AUDIENCE_EMPTY instead of treating empty as everyone", async () => {
    contactFindAll.mockResolvedValue([]);

    await expect(
      resolveAudienceJids({
        companyId: 7,
        whatsappId: 3,
        audienceMode: "connection_contacts"
      })
    ).rejects.toMatchObject({
      message: "ERR_STATUS_AUDIENCE_EMPTY",
      statusCode: 400
    });

    listFindOne.mockResolvedValue({ id: 11, companyId: 7 });
    itemFindAll.mockResolvedValue([]);
    await expect(
      resolveAudienceJids({
        companyId: 7,
        whatsappId: 3,
        audienceMode: "contact_list",
        contactListId: 11
      })
    ).rejects.toMatchObject({ message: "ERR_STATUS_AUDIENCE_EMPTY" });
  });

  it("throws ERR_STATUS_NOT_FOUND for another company's contact list", async () => {
    listFindOne.mockResolvedValue(null);

    await expect(
      resolveAudienceJids({
        companyId: 8,
        whatsappId: 3,
        audienceMode: "contact_list",
        contactListId: 11
      })
    ).rejects.toMatchObject({
      message: "ERR_STATUS_NOT_FOUND",
      statusCode: 404
    });
    expect(listFindOne.mock.calls[0][0].where).toEqual({
      id: 11,
      companyId: 8
    });
    expect(itemFindAll).not.toHaveBeenCalled();
  });

  it("deduplicates JIDs and caps at WHATSAPP_STATUS_MAX_AUDIENCE", async () => {
    contactFindAll.mockResolvedValue([
      { id: 1, name: "Ana", number: "14155550101", isGroup: false },
      { id: 1, name: "Ana", number: "14155550101", isGroup: false },
      {
        id: 4,
        name: "Ana JID",
        number: "14155550101@s.whatsapp.net",
        isGroup: false
      },
      { id: 3, name: "Bruno", number: "14155550102", isGroup: false }
    ]);

    process.env.WHATSAPP_STATUS_MAX_AUDIENCE = "2";
    await expect(
      resolveAudienceJids({
        companyId: 7,
        whatsappId: 3,
        audienceMode: "connection_contacts"
      })
    ).resolves.toEqual([
      "14155550101@s.whatsapp.net",
      "14155550102@s.whatsapp.net"
    ]);

    process.env.WHATSAPP_STATUS_MAX_AUDIENCE = "1";
    await expect(
      resolveAudienceJids({
        companyId: 7,
        whatsappId: 3,
        audienceMode: "connection_contacts"
      })
    ).rejects.toMatchObject({
      message: "ERR_STATUS_AUDIENCE_TOO_LARGE",
      statusCode: 400
    });
  });

  it("previews count and up to five names", async () => {
    contactFindAll.mockResolvedValue(
      ["Ana", "Bruno", "Carla", "Davi", "Eva", "Fabio", "Gabi"].map(
        (name, index) => ({
          id: index + 1,
          name,
          number: `1415555010${index}`,
          isGroup: false
        })
      )
    );

    const preview = await previewAudience({
      companyId: 7,
      whatsappId: 3,
      audienceMode: "connection_contacts"
    });

    expect(preview).toEqual({
      count: 7,
      sample: ["Ana", "Bruno", "Carla", "Davi", "Eva"]
    });
    expect(JSON.stringify(preview)).not.toMatch(/1415555010/);
  });
});
