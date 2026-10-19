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

const mockApi = ({ enabled = true } = {}) => {
  api.get.mockImplementation(url => {
    if (url === "/whatsapp-status/availability")
      return Promise.resolve({ data: { enabled } });
    if (url === "/whatsapp-status/connections")
      return Promise.resolve({ data: connections });
    if (url === "/whatsapp-status/posts")
      return Promise.resolve({ data: posts });
    return Promise.reject(new Error(`unexpected ${url}`));
  });
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
});
