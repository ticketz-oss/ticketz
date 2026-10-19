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
import NewStoryModal from "./NewStoryModal";
import StoriesStrip from "./StoriesStrip";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() }
}));

const baileys = {
  id: 1,
  name: "Espaço Whats",
  number: null,
  apiMode: "baileys",
  status: "CONNECTED",
  capabilities: {
    publishStatus: true,
    kinds: ["text", "image", "video"],
    reason: null,
    manualExport: false,
    ownPostsSync: false
  }
};

const official = {
  id: 2,
  name: "Oficial Meta",
  number: null,
  apiMode: "official",
  status: "CONNECTED",
  capabilities: {
    publishStatus: false,
    kinds: [],
    reason: "OFFICIAL_API",
    manualExport: true,
    ownPostsSync: false
  }
};

const draftPost = (overrides = {}) => ({
  id: 5,
  whatsappId: 1,
  kind: "text",
  body: "Olá",
  backgroundColor: "#024BF4",
  state: "draft",
  hasMedia: false,
  audienceMode: "connection_contacts",
  audienceCount: 3,
  createdAt: new Date().toISOString(),
  createdBy: { id: 7, name: "Guilherme Santos" },
  ...overrides
});

const mockGets = ({ connections = [baileys], preview } = {}) => {
  api.get.mockImplementation((url, config) => {
    if (url === "/whatsapp-status/availability")
      return Promise.resolve({ data: { enabled: true } });
    if (url === "/whatsapp-status/connections")
      return Promise.resolve({ data: connections });
    if (url === "/whatsapp-status/posts") return Promise.resolve({ data: [] });
    if (url === "/whatsapp-status/audience-preview")
      return preview
        ? preview(config)
        : Promise.resolve({
            data: { count: 3, sample: ["Ana", "João", "Maria"] }
          });
    if (url === "/contact-lists")
      return Promise.resolve({
        data: {
          records: [{ id: 4, name: "Clientes VIP" }],
          count: 1,
          hasMore: false
        }
      });
    if (url.startsWith("/whatsapp-status/posts/"))
      return Promise.resolve({
        data: new Blob(["jpg"], { type: "image/jpeg" })
      });
    return Promise.reject(new Error(`unexpected ${url}`));
  });
};

const renderModal = (props = {}) =>
  render(<NewStoryModal onClose={jest.fn()} onSaved={jest.fn()} {...props} />);

const publishButton = () =>
  screen.getByRole("button", { name: /Publicar story/ });

const waitAudience = () => screen.findByText(/Será visto por 3 contatos/);

describe("New story modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.URL.createObjectURL = jest.fn(() => "blob:preview");
    global.URL.revokeObjectURL = jest.fn();
  });

  it("counts characters up to 700 and blocks publishing above it", async () => {
    mockGets();
    renderModal();
    await waitAudience();
    const textbox = screen.getByRole("textbox", { name: "Texto" });
    fireEvent.change(textbox, { target: { value: "a".repeat(700) } });
    expect(screen.getByText("700 / 700 caracteres")).toBeVisible();
    expect(publishButton()).toBeEnabled();
    fireEvent.change(textbox, { target: { value: "a".repeat(701) } });
    expect(screen.getByText("701 / 700 caracteres")).toBeVisible();
    expect(publishButton()).toBeDisabled();
  });

  it("shows the audience count before publishing and blocks an empty audience", async () => {
    mockGets({
      preview: config =>
        config.params.audienceMode === "contact_list"
          ? Promise.reject({
              response: {
                status: 400,
                data: { error: "ERR_STATUS_AUDIENCE_EMPTY" }
              }
            })
          : Promise.resolve({
              data: { count: 3, sample: ["Ana", "João", "Maria"] }
            })
    });
    renderModal();
    expect(
      await screen.findByText("Será visto por 3 contatos (Ana, João, Maria)")
    ).toBeVisible();
    expect(api.get).toHaveBeenCalledWith("/whatsapp-status/audience-preview", {
      params: { whatsappId: 1, audienceMode: "connection_contacts" }
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Texto" }), {
      target: { value: "Promoção" }
    });
    expect(publishButton()).toBeEnabled();

    fireEvent.change(screen.getByRole("combobox", { name: "Quem pode ver" }), {
      target: { value: "contact_list" }
    });
    expect(publishButton()).toBeDisabled();
    const list = await screen.findByRole("combobox", {
      name: "Lista de contatos"
    });
    await within(list).findByRole("option", { name: "Clientes VIP" });
    fireEvent.change(list, { target: { value: "4" } });
    expect(
      await screen.findByText(
        "Nenhum contato pode ver este story. Escolha outra audiência."
      )
    ).toBeVisible();
    expect(api.get).toHaveBeenCalledWith("/whatsapp-status/audience-preview", {
      params: { whatsappId: 1, audienceMode: "contact_list", contactListId: 4 }
    });
    expect(
      screen.getByRole("link", { name: "Adicionar contatos a esta lista" })
    ).toHaveAttribute("href", "/contact-lists/4/contacts");
    expect(publishButton()).toBeDisabled();
  });

  it("sends the same Idempotency-Key when the user clicks publish twice", async () => {
    mockGets();
    let rejectFirst;
    api.post
      .mockImplementationOnce(
        () => new Promise((_, reject) => (rejectFirst = reject))
      )
      .mockResolvedValueOnce({ data: draftPost() })
      .mockResolvedValueOnce({ data: draftPost({ state: "queued" }) });
    renderModal();
    await waitAudience();
    fireEvent.change(screen.getByRole("textbox", { name: "Texto" }), {
      target: { value: "Olá" }
    });
    fireEvent.click(publishButton());
    expect(publishButton()).toBeDisabled();
    fireEvent.click(publishButton());
    expect(api.post).toHaveBeenCalledTimes(1);
    await act(async () => rejectFirst(new Error("Network Error")));
    expect(publishButton()).toBeEnabled();

    fireEvent.click(publishButton());
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/whatsapp-status/posts/5/publish",
        {}
      )
    );
    const [firstCall, secondCall] = api.post.mock.calls;
    expect(firstCall[0]).toBe("/whatsapp-status/posts");
    expect(secondCall[0]).toBe("/whatsapp-status/posts");
    const firstKey = firstCall[2].headers["Idempotency-Key"];
    expect(firstKey).toEqual(expect.any(String));
    expect(firstKey.length).toBeGreaterThan(8);
    expect(secondCall[2].headers["Idempotency-Key"]).toBe(firstKey);
    expect(firstCall[1].get("kind")).toBe("text");
    expect(firstCall[1].get("body")).toBe("Olá");
    expect(firstCall[1].get("backgroundColor")).toBe("#024BF4");
    expect(firstCall[1].get("audienceMode")).toBe("connection_contacts");
  });

  it("disables publish with the Cloud API reason and offers draft and download", async () => {
    mockGets({ connections: [official] });
    const onSaved = jest.fn();
    api.post.mockResolvedValueOnce({
      data: draftPost({
        whatsappId: 2,
        kind: "image",
        body: "",
        hasMedia: true,
        mediaMime: "image/jpeg"
      })
    });
    renderModal({ onSaved });
    expect(
      await screen.findByText(
        "Esta conexão usa a API oficial da Meta, que não publica Status. Salve o rascunho e baixe o arquivo para publicar pelo aplicativo."
      )
    ).toBeVisible();
    await waitAudience();
    expect(publishButton()).toBeDisabled();

    fireEvent.click(screen.getByRole("tab", { name: "Imagem" }));
    expect(screen.getByText("Arraste uma imagem aqui")).toBeVisible();
    const file = new File(["jpg"], "promo.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Selecionar arquivo"), {
      target: { files: [file] }
    });
    expect(publishButton()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [url, form, config] = api.post.mock.calls[0];
    expect(url).toBe("/whatsapp-status/posts");
    expect(form.get("whatsappId")).toBe("2");
    expect(form.get("kind")).toBe("image");
    expect(form.get("media")).toBeInstanceOf(File);
    expect(config.headers["Idempotency-Key"]).toEqual(expect.any(String));
    expect(onSaved.mock.calls[0][0]).toMatchObject({
      action: "draft",
      connection: { id: 2 }
    });

    fireEvent.click(screen.getByRole("button", { name: "Baixar arquivo" }));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/whatsapp-status/posts/5/media", {
        params: { download: 1 },
        responseType: "blob"
      })
    );
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(
      api.post.mock.calls.some(([path]) => path.endsWith("/publish"))
    ).toBe(false);
  });

  it("offers a manual download when QR story publishing is unverified", async () => {
    mockGets({
      connections: [
        {
          ...baileys,
          capabilities: {
            publishStatus: false,
            kinds: [],
            reason: "LIB_NOT_VERIFIED",
            manualExport: true,
            ownPostsSync: false
          }
        }
      ]
    });
    renderModal();
    expect(
      await screen.findByText(
        /A publicação automática nesta conexão está em teste/
      )
    ).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Vídeo" }));
    expect(publishButton()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Salvar rascunho" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Baixar arquivo" })
    ).toBeVisible();
  });

  it("schedules with the chosen date and labels the button Agendar story", async () => {
    mockGets();
    api.post
      .mockResolvedValueOnce({ data: draftPost() })
      .mockResolvedValueOnce({ data: draftPost({ state: "queued" }) });
    const onSaved = jest.fn();
    renderModal({ onSaved });
    await waitAudience();
    fireEvent.change(screen.getByRole("textbox", { name: "Texto" }), {
      target: { value: "Olá" }
    });
    fireEvent.click(screen.getByRole("radio", { name: "Agendar" }));
    const when = new Date(Date.now() + 2 * 86400000);
    const local = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}T10:30`;
    fireEvent.change(screen.getByLabelText("Data e hora do agendamento"), {
      target: { value: local }
    });
    const button = screen.getByRole("button", { name: /Agendar story/ });
    expect(
      screen.queryByRole("button", { name: /Publicar story/ })
    ).not.toBeInTheDocument();
    fireEvent.click(button);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/whatsapp-status/posts/5/publish",
        { scheduledAt: new Date(local).toISOString() }
      )
    );
    await waitFor(() =>
      expect(onSaved.mock.calls[0][0]).toMatchObject({ action: "schedule" })
    );
  });

  it("lets a disconnected connection schedule but not publish now", async () => {
    mockGets({
      connections: [
        {
          ...baileys,
          status: "DISCONNECTED",
          capabilities: {
            ...baileys.capabilities,
            publishStatus: false,
            reason: "DISCONNECTED"
          }
        }
      ]
    });
    renderModal();
    await waitAudience();
    expect(screen.getByText("Conexão desconectada.")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Texto" }), {
      target: { value: "Olá" }
    });
    expect(publishButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Agendar" }));
    const when = new Date(Date.now() + 86400000);
    const local = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}T09:00`;
    fireEvent.change(screen.getByLabelText("Data e hora do agendamento"), {
      target: { value: local }
    });
    expect(screen.getByRole("button", { name: /Agendar story/ })).toBeEnabled();
  });

  describe("publish toasts", () => {
    const publishFromStrip = async socket => {
      render(
        <SocketContext.Provider value={{ GetSocket: () => socket }}>
          <StoriesStrip companyId={1} userId={7} />
        </SocketContext.Provider>
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "Novo story" })
      );
      expect(screen.getByRole("dialog", { name: "Novo story" })).toBeVisible();
      await waitAudience();
      fireEvent.change(screen.getByRole("textbox", { name: "Texto" }), {
        target: { value: "Atendimento até as 20h hoje." }
      });
      fireEvent.click(publishButton());
      return socket.on.mock.calls.find(
        ([event]) => event === "company-1-whatsapp-status-post"
      )[1];
    };

    const newSocket = () => ({
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn()
    });

    afterEach(() => jest.useRealTimers());

    it("says the story was sent for publishing, not published, right after the request", async () => {
      mockGets();
      api.post
        .mockResolvedValueOnce({ data: draftPost() })
        .mockResolvedValueOnce({ data: draftPost({ state: "queued" }) });
      await publishFromStrip(newSocket());
      expect(
        await screen.findByText(
          "Story enviado para publicação na conexão Espaço Whats"
        )
      ).toBeVisible();
      expect(
        screen.queryByText(
          "Story publicado no WhatsApp da conexão Espaço Whats"
        )
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("dialog", { name: "Novo story" })
      ).not.toBeInTheDocument();
    });

    it("announces the publication once when the socket reports it published", async () => {
      mockGets();
      api.post
        .mockResolvedValueOnce({ data: draftPost() })
        .mockResolvedValueOnce({ data: draftPost({ state: "queued" }) });
      const onPost = await publishFromStrip(newSocket());
      await screen.findByText(
        "Story enviado para publicação na conexão Espaço Whats"
      );

      jest.useFakeTimers();
      // Another user's story does not touch the toast.
      act(() =>
        onPost({
          action: "update",
          post: draftPost({ id: 99, state: "published" })
        })
      );
      expect(
        screen.getByText(
          "Story enviado para publicação na conexão Espaço Whats"
        )
      ).toBeVisible();

      act(() =>
        onPost({
          action: "update",
          post: draftPost({
            state: "published",
            publishedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString()
          })
        })
      );
      expect(
        screen.getByText("Story publicado no WhatsApp da conexão Espaço Whats")
      ).toBeVisible();

      act(() => jest.advanceTimersByTime(5000));
      expect(
        screen.queryByText(
          "Story publicado no WhatsApp da conexão Espaço Whats"
        )
      ).not.toBeInTheDocument();
      act(() =>
        onPost({
          action: "update",
          post: draftPost({
            state: "published",
            audienceCount: 4,
            publishedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString()
          })
        })
      );
      expect(
        screen.queryByText(
          "Story publicado no WhatsApp da conexão Espaço Whats"
        )
      ).not.toBeInTheDocument();
    });

    it("shows the translated failure when the socket reports it failed", async () => {
      mockGets();
      api.post
        .mockResolvedValueOnce({ data: draftPost() })
        .mockResolvedValueOnce({ data: draftPost({ state: "queued" }) });
      const onPost = await publishFromStrip(newSocket());
      await screen.findByText(
        "Story enviado para publicação na conexão Espaço Whats"
      );
      act(() =>
        onPost({
          action: "update",
          post: draftPost({
            state: "failed",
            failureCode: "ERR_STATUS_CONNECTION_UNAVAILABLE"
          })
        })
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Story não publicado na conexão Espaço Whats: A conexão estava indisponível no momento da publicação."
      );
      expect(
        screen.queryByText(
          "Story publicado no WhatsApp da conexão Espaço Whats"
        )
      ).not.toBeInTheDocument();
    });
  });
});
