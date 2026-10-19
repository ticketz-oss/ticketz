import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import ChatMessages from "./ChatMessages";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import MicRecorder from "mic-recorder-to-mp3";
import { i18n } from "../../translate/i18n";

jest.mock("../../services/config", () => ({ getBackendURL: () => "/backend" }));
jest.mock("../../services/api", () => ({ post: jest.fn() }));
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({})
}));
jest.mock("../../translate/i18n", () => ({
  i18n: {
    language: "pt",
    t: (key, args) => (args?.name ? `${key} ${args.name}` : key)
  }
}));
jest.mock("mic-recorder-to-mp3", () => jest.fn(() => ({ stop: jest.fn() })));
jest.mock("../../components/MediaGalleryLightbox", () => ({
  __esModule: true,
  default: () => null,
  buildMediaGalleryData: () => ({ slides: [], byMessageId: {} })
}));
jest.mock("../../components/AudioMessage", () => ({
  __esModule: true,
  default: ({ src }) => <audio src={src} />
}));

const theme = createTheme({
  palette: {
    chatlist: { main: "white" },
    chatBubbleReceived: { main: "white" },
    chatBubbleFromMe: { main: "white" }
  }
});
const setup = (
  messages = [],
  activeTheme = theme,
  handleSendMessage = jest.fn()
) =>
  render(
    <ThemeProvider theme={activeTheme}>
      <AuthContext.Provider value={{ user: { id: 1, name: "QA" } }}>
        <ChatMessages
          chat={{ id: 7 }}
          messages={messages}
          handleSendMessage={handleSendMessage}
          handleLoadMore={jest.fn()}
          scrollToBottomRef={{ current: null }}
          pageInfo={{ hasMore: false }}
        />
      </AuthContext.Provider>
    </ThemeProvider>
  );
const image = () => new File(["png"], "preview.png", { type: "image/png" });
beforeEach(() => {
  sessionStorage.clear();
  MicRecorder.mockImplementation(() => ({ stop: jest.fn() }));
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  api.post.mockResolvedValue({ data: {} });
});
test("usa o compositor compacto no chat interno sem cabeçalho redundante", () => {
  const { container } = setup();
  expect(container.querySelector(".chat-compositor--compact")).toBeTruthy();
  expect(screen.queryByText("conversa.responder")).toBeNull();
});
test("keeps draft editable with image preview, sends caption and clears only after success", async () => {
  const { container } = setup();
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Minha legenda" } });
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [image()] }
  });
  expect(screen.getByAltText("preview.png").getAttribute("src")).toBe(
    "blob:preview"
  );
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input.value).toBe("Minha legenda");
  await act(async () =>
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })
  );
  expect(api.post).toHaveBeenCalledTimes(1);
  const [url, form] = api.post.mock.calls[0];
  expect(url).toBe("/chats/7/messages");
  expect(form.get("message")).toBe("Minha legenda");
  expect(form.getAll("medias")).toHaveLength(1);
  expect(input.value).toBe("");
  expect(screen.queryByAltText("preview.png")).toBeNull();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
});
test("retains attachment and caption on failure, prevents concurrent sends", async () => {
  let fail;
  api.post.mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      })
  );
  const { container } = setup();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Não perder" }
  });
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [image()] }
  });
  fireEvent.click(screen.getByLabelText("conversa.enviar"));
  fireEvent.click(screen.getByLabelText("conversa.enviar"));
  expect(api.post).toHaveBeenCalledTimes(1);
  await act(async () => fail(new Error("offline")));
  expect(toastError).toHaveBeenCalled();
  expect(screen.getByRole("textbox").value).toBe("Não perder");
  expect(screen.getByAltText("preview.png")).toBeTruthy();
});
test("removes individual files without losing text and releases preview URLs", () => {
  const { container, unmount } = setup();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Rascunho" }
  });
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: {
      files: [
        image(),
        new File(["pdf"], "document.pdf", { type: "application/pdf" })
      ]
    }
  });
  fireEvent.click(screen.getByLabelText("conversa.removerAnexo preview.png"));
  expect(screen.queryByAltText("preview.png")).toBeNull();
  expect(screen.getByText("document.pdf")).toBeTruthy();
  expect(screen.getByRole("textbox").value).toBe("Rascunho");
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
});
test("repairs existing image and audio URLs and hides legacy duplicate filenames", () => {
  const { container } = setup(
    ["image", "audio"].map((type, i) => ({
      id: i + 1,
      senderId: 1,
      sender: { name: "QA" },
      createdAt: new Date().toISOString(),
      mediaType: type,
      mediaName: `${type}.png`,
      message: `${type}.png`,
      mediaPath: `https://dev.espacowhats.com.br/backend/public/${type}.png`
    }))
  );
  expect(screen.getByAltText("image.png").getAttribute("src")).toBe(
    "/backend/public/image.png"
  );
  expect(container.querySelector("audio").getAttribute("src")).toBe(
    "/backend/public/audio.png"
  );
  expect(container.querySelectorAll(".chat-texto")).toHaveLength(0);
});

test("annotates received and sent Stardew messages while leaving the composer and outgoing data plain", async () => {
  const text = "Olá 😊 mensagem original";
  const send = jest.fn(async () => true);
  const { container } = setup(
    [1, 2].map(senderId => ({
      id: senderId,
      senderId,
      sender: { name: "Pessoa" },
      message: text,
      createdAt: new Date().toISOString()
    })),
    createTheme({ ...theme, isStardew: true }),
    send
  );
  expect(
    container.querySelectorAll(".chat-texto .sd-junimo-text")
  ).toHaveLength(2);
  expect(
    container.querySelector(".chat-compositor .sd-junimo-text")
  ).toBeNull();
  expect(
    container
      .querySelector(".chat-mensagem.minha .chat-texto")
      .textContent.trimEnd()
  ).toBe(text);
  expect(
    container
      .querySelector(".chat-mensagem.recebida .chat-texto")
      .textContent.trimEnd()
  ).toBe(text);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  await act(async () =>
    fireEvent.keyDown(screen.getByRole("textbox"), {
      key: "Enter",
      code: "Enter"
    })
  );
  expect(send).toHaveBeenCalledWith(text);
});

test("restores text after closing chat and clears saved draft only after success", async () => {
  const { unmount } = setup();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Rascunho preservado" }
  });
  unmount();
  const send = jest.fn(async () => false);
  const reopened = setup([], theme, send);
  expect(screen.getByRole("textbox").value).toBe("Rascunho preservado");
  await act(async () =>
    fireEvent.click(screen.getByLabelText("conversa.enviar"))
  );
  expect(screen.getByRole("textbox").value).toBe("Rascunho preservado");
  send.mockResolvedValue(true);
  await act(async () =>
    fireEvent.click(screen.getByLabelText("conversa.enviar"))
  );
  reopened.unmount();
  setup();
  expect(screen.getByRole("textbox").value).toBe("");
});

test("blocks conversation Escape while attachments are selected", () => {
  const { container } = setup();
  const panel = container.querySelector(".chat-mensagens");
  expect(panel.getAttribute("data-conversation-escape-block")).toBeNull();
  fireEvent.change(container.querySelector('input[type="file"]'), {
    target: { files: [image()] }
  });
  expect(panel.getAttribute("data-conversation-escape-block")).toBe("true");
  fireEvent.click(screen.getByLabelText("conversa.removerAnexo preview.png"));
  expect(panel.getAttribute("data-conversation-escape-block")).toBeNull();
});

test("renders links and WhatsApp formatting using the same renderer as customer conversations", () => {
  const { container } = setup([
    {
      id: 1,
      senderId: 2,
      createdAt: new Date().toISOString(),
      message: "*Importante* https://example.com"
    }
  ]);
  expect(
    container.querySelector(".chat-texto strong, .chat-texto b").textContent
  ).toBe("Importante");
  expect(container.querySelector(".chat-texto a").getAttribute("href")).toBe(
    "https://example.com"
  );
});

test("renders real message dates and times for the supported pt_PT locale", () => {
  i18n.language = "pt_PT";
  try {
    const { container } = setup([
      {
        id: 1,
        senderId: 2,
        createdAt: "2026-10-05T14:21:00Z",
        message: "Mensagem em português"
      }
    ]);
    expect(screen.getByRole("textbox").getAttribute("lang")).toBe("pt-PT");
    expect(container.querySelector(".chat-balao time").textContent).toMatch(
      /14:21/
    );
    expect(container.querySelector(".chat-dia").textContent).toContain("2026");
  } finally {
    i18n.language = "pt";
  }
});
