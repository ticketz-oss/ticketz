import fs from "fs/promises";
import path from "path";
import os from "os";
import AgentTenantPolicy from "../../../models/AgentTenantPolicy";
import { getPolicy } from "../AgentPolicyService";
import { queryAgentData } from "../AgentDataService";
import {
  contextRoot,
  rebuildTenantDocuments,
  purgeBlockedDocuments
} from "../AgentDocumentService";

jest.mock("../../../config/privateFiles", () => {
  const mockFs = jest.requireActual<typeof import("fs")>("fs");
  const mockPath = jest.requireActual<typeof import("path")>("path");
  const mockOs = jest.requireActual<typeof import("os")>("os");
  return {
    __esModule: true,
    default: {
      directory: mockFs.mkdtempSync(
        mockPath.join(mockOs.tmpdir(), "ticketz-context-test-")
      )
    }
  };
});
jest.mock("../../../database", () => ({
  __esModule: true,
  default: { models: {}, query: jest.fn().mockResolvedValue([]) }
}));
jest.mock("../../../models/Company", () => ({ __esModule: true, default: {} }));
jest.mock("../../../models/AgentTenantPolicy", () => ({
  __esModule: true,
  default: { findByPk: jest.fn(), update: jest.fn() }
}));
jest.mock("../AgentPolicyService", () => ({ getPolicy: jest.fn() }));
jest.mock("../AgentDataService", () => ({ queryAgentData: jest.fn() }));
jest.mock("../../../config/redis", () => ({
  REDIS_URI_CONNECTION: "redis://test.invalid"
}));

const modules = { contatos: true };
const policy = {
  companyId: 1,
  enabled: true,
  revision: 1,
  modules,
  businessContext: "Business tenant one"
};
describe("Private dated tenant documents", () => {
  beforeEach(() => {
    (getPolicy as jest.Mock).mockResolvedValue(policy);
    (AgentTenantPolicy.findByPk as jest.Mock).mockResolvedValue(policy);
    (queryAgentData as jest.Mock).mockImplementation(
      async (_actor, filter) => ({
        records:
          filter.resource === "contacts" ? [{ id: 1, name: "Own tenant" }] : [],
        observedAt: "2026-10-07",
        nextCursor: null
      })
    );
  });
  afterAll(async () => {
    const temp = path.dirname(contextRoot);
    if (
      path.dirname(temp) !== os.tmpdir() ||
      !path.basename(temp).startsWith("ticketz-context-test-")
    )
      throw new Error("Unexpected test directory");
    await fs.rm(temp, { recursive: true, force: true });
  });
  it("writes business, functionality and record pages under the selected tenant", async () => {
    await rebuildTenantDocuments(1);
    expect(
      await fs.readFile(path.join(contextRoot, "tenants/1/negocio.md"), "utf8")
    ).toContain("Business tenant one");
    const main = await fs.readFile(
      path.join(contextRoot, "tenants/1/contatos.md"),
      "utf8"
    );
    expect(main).toContain("Contacts");
    expect(main).toContain("contatos/contacts-000001.md");
    expect(
      await fs.readFile(
        path.join(contextRoot, "tenants/1/contatos/contacts-000001.md"),
        "utf8"
      )
    ).toContain("Own tenant");
    expect(queryAgentData).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 1, exportMode: true }),
      expect.anything(),
      expect.objectContaining({ fullText: true })
    );
  });
  it("reflects deletions by removing obsolete pages", async () => {
    (queryAgentData as jest.Mock).mockResolvedValue({
      records: [],
      observedAt: "2026-10-07",
      nextCursor: null
    });
    await rebuildTenantDocuments(1);
    await expect(
      fs.access(path.join(contextRoot, "tenants/1/contatos/contacts-000001.md"))
    ).rejects.toBeDefined();
  });
  it("purges a blocked module without touching another tenant", async () => {
    const foreign = path.join(
      contextRoot,
      "tenants/2/contatos/contacts-000001.md"
    );
    await fs.mkdir(path.dirname(foreign), { recursive: true });
    await fs.writeFile(foreign, "foreign fixture");
    await rebuildTenantDocuments(1);
    await purgeBlockedDocuments({
      ...policy,
      modules: { contatos: false }
    });
    await expect(
      fs.access(path.join(contextRoot, "tenants/1/contatos.md"))
    ).rejects.toBeDefined();
    expect(await fs.readFile(foreign, "utf8")).toBe("foreign fixture");
  });
  it("records partial coverage on query failure without exporting error content", async () => {
    (queryAgentData as jest.Mock).mockRejectedValue(
      new Error("private secret must not appear")
    );
    await rebuildTenantDocuments(1);
    const text = await fs.readFile(
      path.join(contextRoot, "tenants/1/contatos.md"),
      "utf8"
    );
    expect(text).toContain("Fontes indisponíveis");
    expect(text).not.toContain("private secret");
    expect(AgentTenantPolicy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        documentStatus: expect.objectContaining({
          modules: expect.objectContaining({
            contatos: expect.objectContaining({ state: "partial" })
          })
        })
      }),
      expect.anything()
    );
  });
  it("refuses stale snapshots after a policy revision changes", async () => {
    (AgentTenantPolicy.findByPk as jest.Mock).mockResolvedValue({
      ...policy,
      revision: 2
    });
    await expect(rebuildTenantDocuments(1)).rejects.toThrow(
      "Context revision changed"
    );
  });
});
