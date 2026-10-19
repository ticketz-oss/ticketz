import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import AgentContextManager, {
  BusinessMarkdownPreview
} from "./AgentContextManager";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";

jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({ user: {} })
}));
jest.mock("../../services/api", () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn()
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() }
}));
jest.mock("../../translate/i18n", () => ({
  i18n: { language: "pt", t: key => key }
}));

const companies = [
  { id: 1, name: "Empresa A", enabled: true },
  { id: 2, name: "Empresa B", enabled: true }
];
const policy = {
  companyId: 1,
  enabled: true,
  revision: 3,
  businessContext: "# Meu negócio",
  modules: { contatos: true, tarefas: true },
  catalog: [
    { key: "contatos", title: "Contatos", description: "Cadastros do tenant" },
    { key: "tarefas", title: "Tarefas", description: "Trabalho da equipe" }
  ],
  documentStatus: {
    state: "ready",
    modules: {
      contatos: { state: "ready", recordCount: 5 },
      tarefas: { state: "ready", recordCount: 2 }
    }
  }
};
const panel = (superAdmin = true) => (
  <AuthContext.Provider value={{ user: { super: superAdmin } }}>
    <AgentContextManager />
  </AuthContext.Provider>
);

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation(url =>
    Promise.resolve({
      data: url === "/agent/admin/companies" ? companies : policy
    })
  );
  api.put.mockImplementation((_url, body) =>
    Promise.resolve({
      data: {
        ...policy,
        ...body,
        revision: 4,
        documentStatus: { state: "ready" }
      }
    })
  );
  api.post.mockResolvedValue({ data: { state: "pending" } });
});

async function openCompany() {
  render(panel());
  fireEvent.click(await screen.findByRole("button", { name: /Empresa A/ }));
  await screen.findByRole("checkbox", { name: "Contatos" });
}

test("does not render or request administrative data for ordinary admins", async () => {
  const { container } = render(panel(false));
  await act(async () => {
    await Promise.resolve();
  });
  expect(container.innerHTML).toBe("");
  expect(api.get).not.toHaveBeenCalled();
});

test("saves the selected tenant, module controls, business text and revision", async () => {
  await openCompany();
  fireEvent.click(screen.getByRole("checkbox", { name: "Contatos" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "agentManagement.business" }),
    { target: { value: "# Atendemos empresas\nTom amigável." } }
  );
  fireEvent.click(screen.getByRole("button", { name: "agentManagement.save" }));
  await waitFor(() =>
    expect(api.put).toHaveBeenCalledWith("/agent/admin/companies/1/context", {
      enabled: true,
      modules: { contatos: false, tarefas: true },
      businessContext: "# Atendemos empresas\nTom amigável.",
      revision: 3
    })
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "agentManagement.save" }).disabled
    ).toBe(true)
  );
});

test("keeps unsaved edits and requires confirmation before selecting another company", async () => {
  await openCompany();
  fireEvent.change(
    screen.getByRole("textbox", { name: "agentManagement.business" }),
    { target: { value: "Alteração ainda não salva" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /Empresa B/ }));
  const dialog = await screen.findByRole("dialog");
  expect(
    api.get.mock.calls.some(
      ([url]) => url === "/agent/admin/companies/2/context"
    )
  ).toBe(false);
  fireEvent.click(
    within(dialog).getByRole("button", { name: "agentManagement.cancel" })
  );
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "agentManagement.business" }).value
    ).toBe("Alteração ainda não salva")
  );
});

test("preserves edits when the server reports a revision conflict", async () => {
  api.put.mockRejectedValue({ response: { status: 409 } });
  await openCompany();
  fireEvent.change(
    screen.getByRole("textbox", { name: "agentManagement.business" }),
    { target: { value: "Minha alteração" } }
  );
  fireEvent.click(screen.getByRole("button", { name: "agentManagement.save" }));
  await screen.findByText("agentManagement.conflict");
  expect(
    screen.getByRole("textbox", { name: "agentManagement.business" }).value
  ).toBe("Minha alteração");
  expect(
    screen.getByRole("button", { name: "agentManagement.save" }).disabled
  ).toBe(true);
  expect(
    screen.getByRole("button", { name: "agentManagement.reload" })
  ).toBeTruthy();
});

test("rebuilds only the selected tenant and displays the pending document state", async () => {
  await openCompany();
  fireEvent.click(
    screen.getByRole("button", { name: "agentManagement.rebuild" })
  );
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      "/agent/admin/companies/1/context/rebuild"
    )
  );
  await screen.findByText("agentManagement.documentStates.pending");
  expect(
    screen.getByRole("button", { name: "agentManagement.rebuilding" }).disabled
  ).toBe(true);
});

/* DOM node checks verify that untrusted Markdown creates no executable nodes. */
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
test("renders Markdown preview without interpreting HTML, images or scripts", () => {
  const { container } = render(
    <BusinessMarkdownPreview
      value={
        '# Empresa\n**Serviços**\n<script>alert(1)</script>\n<img src="https://other.invalid/tracker" onerror="alert(1)">\n```\nconst texto = "seguro";\n```'
      }
    />
  );
  expect(screen.getByRole("heading", { name: "Empresa" })).toBeTruthy();
  expect(container.querySelector("strong").textContent).toBe("Serviços");
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy();
  expect(container.querySelector("pre code").textContent).toBe(
    'const texto = "seguro";'
  );
});
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
