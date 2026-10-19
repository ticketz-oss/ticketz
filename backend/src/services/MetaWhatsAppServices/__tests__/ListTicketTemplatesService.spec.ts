import Whatsapp from "../../../models/Whatsapp";
import ListTicketTemplatesService, {
  clearTicketTemplatesCache,
  countTemplateVariables
} from "../ListTicketTemplatesService";
import { listMetaTemplatesSafe } from "../MetaTemplateRegistryService";

jest.mock("../MetaTemplateRegistryService", () => ({
  ...jest.requireActual("../MetaTemplateRegistryService"),
  listMetaTemplatesSafe: jest.fn()
}));

const listSafe = listMetaTemplatesSafe as jest.MockedFunction<
  typeof listMetaTemplatesSafe
>;

const connection = { id: 16 } as unknown as Whatsapp;

const template = (values: Record<string, unknown>) => ({
  id: "1",
  name: "primeiro_contato",
  status: "APPROVED",
  language: "pt_BR",
  category: "UTILITY",
  components: [{ type: "BODY", text: "Olá {{1}}, aqui é a {{2}}." }],
  ...values
});

beforeEach(() => {
  jest.clearAllMocks();
  clearTicketTemplatesCache();
});

describe("countTemplateVariables", () => {
  it("counts by the highest index Meta assigned", () => {
    expect(countTemplateVariables("Olá {{1}}, aqui é a {{2}}.")).toBe(2);
    expect(countTemplateVariables("sem variáveis")).toBe(0);
    expect(countTemplateVariables("{{ 3 }}")).toBe(3);
  });
});

describe("ListTicketTemplatesService", () => {
  it("returns an empty list when the Graph API is unreachable", async () => {
    listSafe.mockResolvedValue(null);

    await expect(ListTicketTemplatesService(connection)).resolves.toEqual([]);
  });

  it("only asks the Graph API once inside the cache window", async () => {
    listSafe.mockResolvedValue([template({})]);

    await ListTicketTemplatesService(connection);
    await ListTicketTemplatesService(connection);

    expect(listSafe).toHaveBeenCalledTimes(1);
  });

  it("keeps only approved templates", async () => {
    listSafe.mockResolvedValue([
      template({}),
      template({ id: "2", name: "pendente", status: "PENDING" })
    ]);

    const result = await ListTicketTemplatesService(connection);

    expect(result.map(item => item.name)).toEqual(["primeiro_contato"]);
    expect(result[0]).toMatchObject({ language: "pt_BR", variables: 2 });
  });

  // Header de midia exige um handle de upload, que e o fluxo da cobranca e nao
  // cabe no chat do atendimento.
  it("drops templates with a media header", async () => {
    listSafe.mockResolvedValue([
      template({
        components: [
          { type: "HEADER", format: "DOCUMENT" },
          { type: "BODY", text: "boleto" }
        ]
      })
    ]);

    await expect(ListTicketTemplatesService(connection)).resolves.toEqual([]);
  });
});

it.each([
  [{ type: "HEADER", format: "TEXT", text: "Olá {{1}}" }],
  [{ type: "BODY", text: "Olá {{nome}}" }],
  [
    {
      type: "BUTTONS",
      buttons: [{ type: "URL", url: "https://example.com/{{1}}" }]
    }
  ],
  [{ type: "BUTTONS", buttons: [{ type: "COPY_CODE" }] }]
])("hides templates requiring unsupported parameters: %j", async component => {
  listSafe.mockResolvedValue([template({ components: [component] })]);
  await expect(ListTicketTemplatesService(connection)).resolves.toEqual([]);
});

it("keeps static headers and static URL buttons", async () => {
  listSafe.mockResolvedValue([
    template({
      components: [
        { type: "HEADER", format: "TEXT", text: "Aviso" },
        { type: "BODY", text: "Olá {{1}}" },
        {
          type: "BUTTONS",
          buttons: [{ type: "URL", url: "https://example.com" }]
        }
      ]
    })
  ]);
  expect(await ListTicketTemplatesService(connection)).toHaveLength(1);
});
