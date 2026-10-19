import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import "@testing-library/jest-dom";
import StoriesStrip from "./StoriesStrip";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() }
}));

const hoursFromNow = hours =>
  new Date(Date.now() + hours * 3600 * 1000).toISOString();

const connections = [
  {
    id: 1,
    name: "Espaço Whats",
    number: "5568992140001",
    apiMode: "baileys",
    status: "CONNECTED",
    capabilities: {
      publishStatus: true,
      kinds: ["text", "image", "video"],
      reason: null,
      manualExport: false,
      ownPostsSync: false
    }
  },
  {
    id: 2,
    name: "Comercial",
    number: "5568988310002",
    apiMode: "baileys",
    status: "CONNECTED",
    capabilities: {
      publishStatus: true,
      kinds: ["text"],
      reason: null,
      manualExport: false,
      ownPostsSync: false
    }
  },
  {
    id: 3,
    name: "Sem stories",
    number: "5568996400003",
    apiMode: "official",
    status: "CONNECTED",
    capabilities: {
      publishStatus: false,
      kinds: [],
      reason: "OFFICIAL_API",
      manualExport: true,
      ownPostsSync: false
    }
  }
];

const basePost = {
  kind: "text",
  hasMedia: false,
  mediaMime: null,
  font: null,
  audienceMode: "connection_contacts",
  contactListId: null,
  audienceCount: 120,
  scheduledAt: null,
  failureCode: null,
  createdBy: { id: 7, name: "Guilherme Santos" }
};

const posts = [
  {
    ...basePost,
    id: 11,
    whatsappId: 1,
    body: "Atendimento até as 20h hoje.",
    backgroundColor: "#024BF4",
    state: "published",
    publishedAt: hoursFromNow(-5),
    expiresAt: hoursFromNow(19),
    createdAt: hoursFromNow(-5)
  },
  {
    ...basePost,
    id: 12,
    whatsappId: 1,
    body: "Promoção de outubro",
    backgroundColor: "#15803D",
    state: "queued",
    scheduledAt: hoursFromNow(3),
    publishedAt: null,
    expiresAt: null,
    createdAt: hoursFromNow(-1)
  },
  {
    ...basePost,
    id: 13,
    whatsappId: 1,
    body: "Falhou",
    backgroundColor: "#27272A",
    state: "failed",
    failureCode: "ERR_STATUS_CONNECTION_UNAVAILABLE",
    publishedAt: null,
    expiresAt: null,
    createdAt: hoursFromNow(-0.5)
  },
  {
    ...basePost,
    id: 21,
    whatsappId: 2,
    body: "Demonstração gratuita toda quinta às 15h.",
    backgroundColor: "#6D28D9",
    state: "published",
    audienceMode: "contact_list",
    contactListId: 4,
    audienceCount: 35,
    publishedAt: hoursFromNow(-2),
    expiresAt: hoursFromNow(22),
    createdAt: hoursFromNow(-2),
    createdBy: { id: 8, name: "Ana Souza" }
  }
];

const socket = { on: jest.fn(), off: jest.fn(), disconnect: jest.fn() };
const socketManager = { GetSocket: () => socket };

const mockApi = ({ enabled = true, extraPosts = [] } = {}) => {
  api.get.mockImplementation(url => {
    if (url === "/whatsapp-status/availability")
      return Promise.resolve({ data: { enabled } });
    if (url === "/whatsapp-status/connections")
      return Promise.resolve({ data: connections });
    if (url === "/whatsapp-status/posts")
      return Promise.resolve({ data: [...posts, ...extraPosts] });
    if (url === "/whatsapp-status/audience-preview")
      return Promise.resolve({ data: { count: 3, sample: ["Ana"] } });
    if (url === "/contact-lists")
      return Promise.resolve({
        data: { records: [{ id: 4, name: "Clientes VIP" }], hasMore: false }
      });
    if (/^\/whatsapp-status\/posts\/\d+\/media$/.test(url))
      return Promise.resolve({
        data: new Blob(["jpg"], { type: "image/jpeg" })
      });
    return Promise.reject(new Error(`unexpected ${url}`));
  });
};

const imageDraft = {
  ...basePost,
  id: 31,
  whatsappId: 3,
  kind: "image",
  body: "Cardápio da semana",
  backgroundColor: null,
  hasMedia: true,
  mediaMime: "image/jpeg",
  state: "draft",
  publishedAt: null,
  expiresAt: null,
  createdAt: hoursFromNow(-30),
  updatedAt: hoursFromNow(-30)
};

const textDraft = {
  ...basePost,
  id: 32,
  whatsappId: 2,
  body: "Rascunho de promoção",
  backgroundColor: "#15803D",
  audienceMode: "contact_list",
  contactListId: 4,
  state: "draft",
  publishedAt: null,
  expiresAt: null,
  createdAt: hoursFromNow(-3)
};

const renderStrip = () =>
  render(
    <SocketContext.Provider value={socketManager}>
      <StoriesStrip companyId={1} userId={7} />
    </SocketContext.Provider>
  );

describe("Stories strip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders nothing until availability confirms the tenant is enabled", async () => {
    let resolve;
    api.get.mockImplementation(url =>
      url === "/whatsapp-status/availability"
        ? new Promise(done => (resolve = done))
        : Promise.resolve({ data: [] })
    );
    const view = renderStrip();
    expect(view.container).toBeEmptyDOMElement();
    await act(async () => resolve({ data: { enabled: false } }));
    expect(view.container).toBeEmptyDOMElement();
    view.unmount();

    mockApi();
    renderStrip();
    expect(await screen.findByText("Meus stories")).toBeVisible();
    expect(screen.getByText("Ficam 24 h no ar")).toBeVisible();
    expect(api.get).toHaveBeenCalledWith("/whatsapp-status/posts", {
      params: { active: true }
    });
    expect(socket.on).toHaveBeenCalledWith(
      "company-1-whatsapp-status-post",
      expect.any(Function)
    );
  });

  it("shows one ring per connection with one segment per active story", async () => {
    mockApi();
    renderStrip();
    const first = await screen.findByRole("button", {
      name: "Ver stories de Espaço Whats (3)"
    });
    const second = screen.getByRole("button", {
      name: "Ver stories de Comercial (1)"
    });
    expect(within(first).getByTestId("story-ring")).toHaveAttribute(
      "data-segments",
      "3"
    );
    expect(within(second).getByTestId("story-ring")).toHaveAttribute(
      "data-segments",
      "1"
    );
    expect(screen.queryByText("Sem stories")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo story" })).toBeVisible();
  });

  it("adds a story pushed by the socket to its connection ring", async () => {
    mockApi();
    renderStrip();
    await screen.findByRole("button", { name: "Ver stories de Comercial (1)" });
    const onPost = socket.on.mock.calls.find(
      ([event]) => event === "company-1-whatsapp-status-post"
    )[1];
    act(() =>
      onPost({
        action: "create",
        post: { ...posts[3], id: 22, createdAt: new Date().toISOString() }
      })
    );
    expect(
      screen.getByRole("button", { name: "Ver stories de Comercial (2)" })
    ).toBeVisible();
  });

  it("opens the viewer on the clicked connection and shows the state in details", async () => {
    mockApi();
    renderStrip();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver stories de Comercial (1)"
      })
    );
    const viewer = screen.getByRole("dialog", { name: "Meu story" });
    expect(
      within(viewer).getByText("Demonstração gratuita toda quinta às 15h.")
    ).toBeVisible();
    const details = within(viewer).getByRole("complementary", {
      name: "Detalhes do story"
    });
    expect(within(details).getAllByText("Comercial").length).toBeGreaterThan(0);
    expect(within(details).getByText("Ana Souza")).toBeVisible();
    expect(within(details).getByText("Lista de contatos (35)")).toBeVisible();
    expect(within(details).getByText("Estado")).toBeVisible();
    expect(within(details).getByText("Enviado à sessão")).toBeVisible();

    fireEvent.click(
      within(viewer).getByRole("button", { name: "Story anterior" })
    );
    expect(within(details).getByText("Falhou")).toBeVisible();
    expect(
      within(viewer).getByText(
        "A conexão estava indisponível no momento da publicação."
      )
    ).toBeVisible();
  });

  it("hides delete for published stories", async () => {
    mockApi();
    api.post.mockResolvedValue({
      data: { ...posts[1], state: "cancelled" }
    });
    renderStrip();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver stories de Espaço Whats (3)"
      })
    );
    const viewer = screen.getByRole("dialog", { name: "Meu story" });
    const details = within(viewer).getByRole("complementary", {
      name: "Detalhes do story"
    });
    expect(within(details).getByText("Enviado à sessão")).toBeVisible();
    expect(
      within(viewer).queryByRole("button", { name: "Excluir este story" })
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(viewer).getByRole("button", { name: "Próximo story" })
    );
    expect(within(details).getByText("Agendado")).toBeVisible();
    fireEvent.click(
      within(viewer).getByRole("button", { name: "Excluir este story" })
    );
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/whatsapp-status/posts/12/cancel")
    );

    // The cancelled story leaves the list and the viewer shows the next one.
    expect(await within(details).findByText("Falhou")).toBeVisible();
    expect(
      within(viewer).getByRole("button", { name: "Excluir este story" })
    ).toBeVisible();
  });

  it("never shows view counts", async () => {
    mockApi();
    renderStrip();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver stories de Espaço Whats (3)"
      })
    );
    const pattern = /visualiza(ç|c)(ões|oes)\s*\d/i;
    expect(document.body.textContent).not.toMatch(pattern);
    expect(document.body.textContent).not.toMatch(/\d+\s*visualiza/i);
    expect(
      screen.getByText(
        "A lista de quem visualizou não está disponível para stories publicados pela plataforma."
      )
    ).toBeVisible();
  });

  describe("drafts", () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => "blob:story");
      global.URL.revokeObjectURL = jest.fn();
    });

    it("shows a draft in the strip and in the viewer with its actions", async () => {
      mockApi({ extraPosts: [imageDraft] });
      renderStrip();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Ver stories de Sem stories (1)"
        })
      );
      const viewer = screen.getByRole("dialog", { name: "Meu story" });
      const details = within(viewer).getByRole("complementary", {
        name: "Detalhes do story"
      });
      expect(within(details).getByText("Rascunho")).toBeVisible();
      expect(
        await within(viewer).findByAltText("Imagem do story")
      ).toBeVisible();
      expect(
        within(details).getByRole("button", { name: "Editar rascunho" })
      ).toBeVisible();
      expect(
        within(details).getByRole("button", { name: "Baixar arquivo" })
      ).toBeVisible();
      expect(
        within(details).getByRole("button", { name: "Excluir este story" })
      ).toBeVisible();
    });

    it("downloads the draft media with download=1", async () => {
      mockApi({ extraPosts: [imageDraft] });
      renderStrip();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Ver stories de Sem stories (1)"
        })
      );
      fireEvent.click(screen.getByRole("button", { name: "Baixar arquivo" }));
      await waitFor(() =>
        expect(api.get).toHaveBeenCalledWith(
          "/whatsapp-status/posts/31/media",
          { params: { download: 1 }, responseType: "blob" }
        )
      );
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Baixar arquivo" })
        ).toBeEnabled()
      );
    });

    it("hides the download action for a text draft", async () => {
      mockApi({ extraPosts: [textDraft] });
      renderStrip();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Ver stories de Comercial (2)"
        })
      );
      const details = screen.getByRole("complementary", {
        name: "Detalhes do story"
      });
      expect(within(details).getByText("Rascunho")).toBeVisible();
      expect(
        within(details).queryByRole("button", { name: "Baixar arquivo" })
      ).not.toBeInTheDocument();
    });

    it("edits a text draft in a prefilled modal and saves it with PUT", async () => {
      mockApi({ extraPosts: [{ ...textDraft, whatsappId: 3 }] });
      api.put.mockResolvedValue({
        data: { ...textDraft, whatsappId: 3, body: "Promoção nova" }
      });
      renderStrip();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Ver stories de Sem stories (1)"
        })
      );
      fireEvent.click(screen.getByRole("button", { name: "Editar rascunho" }));
      expect(
        screen.queryByRole("dialog", { name: "Meu story" })
      ).not.toBeInTheDocument();
      const modal = await screen.findByRole("dialog", {
        name: "Editar rascunho"
      });
      await waitFor(() =>
        expect(
          within(modal).getByRole("combobox", { name: "Conexão" })
        ).toHaveValue("3")
      );
      expect(within(modal).getByRole("tab", { name: "Texto" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      const textbox = within(modal).getByRole("textbox", { name: "Texto" });
      expect(textbox).toHaveValue("Rascunho de promoção");
      expect(
        within(modal).getByRole("button", { name: "Verde" })
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        within(modal).getByRole("combobox", { name: "Quem pode ver" })
      ).toHaveValue("contact_list");
      await waitFor(() =>
        expect(
          within(modal).getByRole("combobox", { name: "Lista de contatos" })
        ).toHaveValue("4")
      );

      fireEvent.change(textbox, { target: { value: "Promoção nova" } });
      fireEvent.click(
        within(modal).getByRole("button", { name: "Salvar rascunho" })
      );
      await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
      const [url, form] = api.put.mock.calls[0];
      expect(url).toBe("/whatsapp-status/posts/32");
      expect(form.get("body")).toBe("Promoção nova");
      expect(form.get("contactListId")).toBe("4");
      expect(api.post).not.toHaveBeenCalled();
    });

    it("publishes an edited draft without creating a new post", async () => {
      mockApi({ extraPosts: [textDraft] });
      api.put.mockResolvedValue({ data: { ...textDraft, body: "Nova" } });
      api.post.mockResolvedValue({
        data: { ...textDraft, body: "Nova", state: "queued" }
      });
      renderStrip();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Ver stories de Comercial (2)"
        })
      );
      fireEvent.click(screen.getByRole("button", { name: "Editar rascunho" }));
      const modal = await screen.findByRole("dialog", {
        name: "Editar rascunho"
      });
      await within(modal).findByText(/Será visto por 3 contatos/);
      fireEvent.change(within(modal).getByRole("textbox", { name: "Texto" }), {
        target: { value: "Nova" }
      });
      fireEvent.click(
        within(modal).getByRole("button", { name: /Publicar story/ })
      );
      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith(
          "/whatsapp-status/posts/32/publish",
          {}
        )
      );
      expect(api.put).toHaveBeenCalledWith(
        "/whatsapp-status/posts/32",
        expect.any(FormData)
      );
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    it("shows the existing media of a draft as already attached", async () => {
      mockApi({ extraPosts: [imageDraft] });
      api.put.mockResolvedValue({ data: imageDraft });
      renderStrip();
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Ver stories de Sem stories (1)"
        })
      );
      fireEvent.click(screen.getByRole("button", { name: "Editar rascunho" }));
      const modal = await screen.findByRole("dialog", {
        name: "Editar rascunho"
      });
      expect(
        within(modal).getByRole("tab", { name: "Imagem" })
      ).toHaveAttribute("aria-selected", "true");
      expect(within(modal).getByText("Arquivo já anexado")).toBeVisible();
      expect(
        within(modal).getByPlaceholderText("Escreva uma legenda")
      ).toHaveValue("Cardápio da semana");
      await waitFor(() =>
        expect(
          within(modal).getByRole("combobox", { name: "Conexão" })
        ).toHaveValue("3")
      );
      fireEvent.change(
        within(modal).getByPlaceholderText("Escreva uma legenda"),
        { target: { value: "Cardápio novo" } }
      );
      fireEvent.click(
        within(modal).getByRole("button", { name: "Salvar rascunho" })
      );
      await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
      const [url, form] = api.put.mock.calls[0];
      expect(url).toBe("/whatsapp-status/posts/31");
      expect(form.get("body")).toBe("Cardápio novo");
      expect(form.get("media")).toBeNull();
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});
