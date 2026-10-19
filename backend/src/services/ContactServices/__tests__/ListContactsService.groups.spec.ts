import ListContactsService from "../ListContactsService";
import Contact from "../../../models/Contact";

jest.mock("../../../models/Contact", () => ({
  __esModule: true,
  default: {
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] })
  }
}));

describe("segmentos de contatos", () => {
  it("filtra grupos no servidor, preservando o escopo da empresa", async () => {
    await ListContactsService({
      companyId: 3,
      isGroup: true,
      searchParam: "Grupo"
    });
    expect(Contact.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isGroup: true,
          companyId: expect.anything()
        })
      })
    );
  });
  it("mantém chamadas anteriores sem filtro de grupo", async () => {
    await ListContactsService({ companyId: 3, searchParam: "D'Ávila" });
    const consulta = (Contact.findAndCountAll as jest.Mock).mock.calls.slice(
      -1
    )[0][0];
    expect(consulta.where).not.toHaveProperty("isGroup");
  });
});
