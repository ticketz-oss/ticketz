import { Op } from "sequelize";
import Contact from "../../../models/Contact";
import CreateOrUpdateContactService, {
  updateContact
} from "../../ContactServices/CreateOrUpdateContactService";
import MergeContactsService from "../../ContactServices/MergeContactsService";
import FindOrCreateMetaContactService from "../FindOrCreateMetaContactService";

jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
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

const findAll = Contact.findAll as jest.MockedFunction<typeof Contact.findAll>;
const createOrUpdate = CreateOrUpdateContactService as jest.MockedFunction<
  typeof CreateOrUpdateContactService
>;
const update = updateContact as jest.MockedFunction<typeof updateContact>;
const merge = MergeContactsService as jest.MockedFunction<
  typeof MergeContactsService
>;

const contact = (id: number, number: string): Contact =>
  ({ id, number }) as Contact;

describe("FindOrCreateMetaContactService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("merges Brazilian contacts stored with and without the ninth digit", async () => {
    const legacy = contact(1695, "556899250808");
    const canonical = contact(4682, "5568999250808");

    findAll.mockResolvedValue([legacy, canonical]);
    merge.mockResolvedValue(canonical);
    update.mockResolvedValue(canonical);

    await expect(
      FindOrCreateMetaContactService({
        companyId: 9,
        name: "Irandy",
        number: "556899250808"
      })
    ).resolves.toBe(canonical);

    const query = findAll.mock.calls[0][0];
    expect(query.where).toEqual({
      companyId: 9,
      number: {
        [Op.in]: ["556899250808", "5568999250808"]
      }
    });
    expect(merge).toHaveBeenCalledWith([legacy, canonical], {
      companyId: 9,
      preferredWinner: canonical
    });
    expect(update).toHaveBeenCalledWith(
      canonical,
      {
        name: "Irandy",
        number: "5568999250808",
        isGroup: false
      },
      "external"
    );
    expect(createOrUpdate).not.toHaveBeenCalled();
  });

  it("creates a new contact using the canonical Brazilian number", async () => {
    const created = contact(5000, "5568999250808");

    findAll.mockResolvedValue([]);
    merge.mockResolvedValue(null);
    createOrUpdate.mockResolvedValue(created);

    await expect(
      FindOrCreateMetaContactService({
        companyId: 9,
        name: "Irandy",
        number: "556899250808"
      })
    ).resolves.toBe(created);

    expect(createOrUpdate).toHaveBeenCalledWith({
      name: "Irandy",
      number: "5568999250808",
      companyId: 9,
      channel: "whatsapp",
      isGroup: false,
      nameSource: "external"
    });
  });
});
