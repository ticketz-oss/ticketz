import Contact from "../../../models/Contact";
import { resolveAudience } from "../audience";

describe("birthday schedule audience", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps only WhatsApp contacts with a valid birthday", async () => {
    jest.spyOn(Contact, "findAll").mockResolvedValue([
      {
        id: 1,
        birthdayDay: 15,
        birthdayMonth: 9
      },
      {
        id: 2,
        birthdayDay: 31,
        birthdayMonth: 2
      }
    ] as Contact[]);

    const contacts = await resolveAudience({
      companyId: 3,
      kind: "BIRTHDAY",
      audienceMode: "ALL"
    });

    expect(contacts.map(contact => contact.id)).toEqual([1]);
    expect(Contact.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 3,
          channel: "whatsapp",
          isGroup: false,
          birthdayDay: expect.any(Object),
          birthdayMonth: expect.any(Object)
        })
      })
    );
  });

  it("rejects an explicitly selected contact with an invalid birthday", async () => {
    jest.spyOn(Contact, "findAll").mockResolvedValue([
      {
        id: 2,
        birthdayDay: 31,
        birthdayMonth: 2
      }
    ] as Contact[]);

    await expect(
      resolveAudience({
        companyId: 3,
        kind: "BIRTHDAY",
        audienceMode: "SELECTED",
        contactIds: [2]
      })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_INVALID_RECIPIENT" });
  });
});
