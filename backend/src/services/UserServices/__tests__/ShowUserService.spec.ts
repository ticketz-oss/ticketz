import User from "../../../models/User";
import { SerializeUser } from "../../../helpers/SerializeUser";
import ShowUserService from "../ShowUserService";

jest.mock("../../../models/User", () => ({
  __esModule: true,
  default: { findByPk: jest.fn() }
}));
jest.mock("../../../models/Queue", () => ({
  __esModule: true,
  default: class MockQueue {}
}));
jest.mock("../../../models/Company", () => ({
  __esModule: true,
  default: class MockCompany {}
}));

const findUser = User.findByPk as jest.Mock;
const company = {
  id: 7,
  name: "Empresa de teste",
  slug: "teste",
  dueDate: "2030-01-01",
  status: true,
  platformStatus: "active"
};
const user = {
  id: 9,
  name: "Pessoa QA",
  email: "qa@example.com",
  profilePicUrl: null,
  profile: "user",
  super: false,
  companyId: 7,
  tokenVersion: 1,
  queues: [{ id: 3, name: "Comercial", color: "#FF7700" }]
};

describe("ShowUserService: contrato da sessão renovada", () => {
  beforeEach(() => {
    findUser.mockReset();
  });

  it("seleciona slug junto dos campos de identidade e estado da empresa", async () => {
    findUser.mockResolvedValue({ ...user, company });

    await ShowUserService(user.id);

    expect(findUser).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        attributes: expect.arrayContaining(["id", "companyId", "tokenVersion"]),
        include: expect.arrayContaining([
          expect.objectContaining({
            as: "company",
            attributes: expect.arrayContaining([
              "id",
              "name",
              "slug",
              "dueDate",
              "status",
              "platformStatus"
            ])
          })
        ])
      })
    );
  });

  it("mantém o slug na serialização após projetar somente os atributos pedidos ao banco", async () => {
    // Emulate Sequelize's attribute projection. This fails if a later edit
    // removes slug, even when the fixture itself still has the property.
    findUser.mockImplementation(async (_id, options) => {
      const attributes: string[] = options.include.find(
        (association: { as: string }) => association.as === "company"
      ).attributes;
      const projected = Object.fromEntries(
        attributes.map(attribute => [attribute, company[attribute]])
      );
      return { ...user, company: projected };
    });

    const result = await SerializeUser(await ShowUserService(user.id));

    expect(result.company).toMatchObject({
      id: user.companyId,
      name: company.name,
      slug: "teste"
    });
    expect(result.companyId).toBe(user.companyId);
    expect(result.queues).toEqual(user.queues);
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("preserva a recusa de solicitante não super de outra empresa", async () => {
    findUser
      .mockResolvedValueOnce({ id: 10, companyId: 8, super: false })
      .mockResolvedValueOnce({ ...user, company });

    await expect(ShowUserService(user.id, 10)).rejects.toMatchObject({
      message: "ERR_FORBIDDEN",
      statusCode: 403
    });
  });

  it("preserva 404 para usuário inexistente", async () => {
    findUser.mockResolvedValue(null);

    await expect(ShowUserService(999)).rejects.toMatchObject({
      message: "ERR_NO_USER_FOUND",
      statusCode: 404
    });
  });
});
