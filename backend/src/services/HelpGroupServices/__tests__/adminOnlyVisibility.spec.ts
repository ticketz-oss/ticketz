import Help from "../../../models/Help";
import HelpGroup from "../../../models/HelpGroup";
import FindPublicService from "../FindPublicService";
import ShowPublicService from "../ShowPublicService";

describe("help center admin-only visibility", () => {
  beforeEach(() => jest.restoreAllMocks());

  it("filters restricted groups and contents for regular company users", async () => {
    const findGroups = jest.spyOn(HelpGroup, "findAll").mockResolvedValue([
      {
        id: 1,
        title: "General",
        subtitle: "",
        icon: "HelpOutline",
        order: 0,
        isGlobal: true,
        adminOnly: false
      }
    ] as HelpGroup[]);
    const findContents = jest.spyOn(Help, "findAll").mockResolvedValue([]);

    await FindPublicService("company", 9, false);

    expect(findGroups).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ adminOnly: false })
      })
    );
    expect(findContents).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ adminOnly: false })
      })
    );
  });

  it("returns restricted groups and contents to company administrators", async () => {
    const findGroups = jest.spyOn(HelpGroup, "findAll").mockResolvedValue([
      {
        id: 2,
        title: "Admin",
        subtitle: "",
        icon: "Settings",
        order: 0,
        isGlobal: true,
        adminOnly: true
      }
    ] as HelpGroup[]);
    const findContents = jest.spyOn(Help, "findAll").mockResolvedValue([]);

    const result = await FindPublicService("company", 9, true);

    expect(result[0]).toMatchObject({ id: 2, adminOnly: true });
    const groupWhere = findGroups.mock.calls[0][0].where;
    const contentWhere = findContents.mock.calls[0][0].where;
    expect(groupWhere).not.toHaveProperty("adminOnly");
    expect(contentWhere).not.toHaveProperty("adminOnly");
  });

  it("rejects a restricted card when a regular user guesses its URL", async () => {
    jest.spyOn(HelpGroup, "findByPk").mockResolvedValue({
      id: 3,
      isActive: true,
      audience: "company",
      companyId: 1,
      isGlobal: true,
      adminOnly: true
    } as HelpGroup);

    await expect(
      ShowPublicService({
        groupId: 3,
        audience: "company",
        companyId: 9,
        isAdmin: false
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("filters restricted articles inside a general card for regular users", async () => {
    jest.spyOn(HelpGroup, "findByPk").mockResolvedValue({
      id: 4,
      title: "Mixed",
      subtitle: "",
      icon: "HelpOutline",
      isActive: true,
      audience: "company",
      companyId: 1,
      isGlobal: true,
      adminOnly: false
    } as HelpGroup);
    const findContents = jest.spyOn(Help, "findAll").mockResolvedValue([]);

    await ShowPublicService({
      groupId: 4,
      audience: "company",
      companyId: 9,
      isAdmin: false
    });

    expect(findContents).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: 4, isActive: true, adminOnly: false }
      })
    );
  });
});
