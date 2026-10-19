import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import MessageInputCustom from "./index";
import ChatMessages from "../../pages/Chat/ChatMessages";
import { AuthContext } from "../../context/Auth/AuthContext";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";
import { writingLanguage } from "../../hooks/useWritingAssistance";
import api from "../../services/api";
import MicRecorder from "mic-recorder-to-mp3";

jest.mock("../../translate/i18n", () => {
  const listeners = new Set();
  const instance = {
    language: "pt",
    t: key => key,
    on: (_, listener) => listeners.add(listener),
    off: (_, listener) => listeners.delete(listener),
    changeLanguage: language => {
      instance.language = language;
      listeners.forEach(listener => listener(language));
    }
  };
  return { i18n: instance };
});
jest.mock("../../services/api", () => ({
  post: jest.fn(),
  request: jest.fn().mockResolvedValue({ data: [] })
}));
jest.mock("@material-ui/core/withWidth", () => ({
  __esModule: true,
  default: () => Component => Component,
  isWidthUp: () => true
}));
jest.mock("mic-recorder-to-mp3", () => jest.fn(() => ({ stop: jest.fn() })));
jest.mock("../../components/MediaGalleryLightbox", () => ({
  __esModule: true,
  default: () => null,
  buildMediaGalleryData: () => ({ slides: [], byMessageId: {} })
}));

const socket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn()
};
const theme = createTheme({
  palette: {
    chatlist: { main: "white" },
    chatBubbleReceived: { main: "white" },
    chatBubbleFromMe: { main: "white" }
  }
});

const mount = internal =>
  render(
    <ThemeProvider theme={theme}>
      <SocketContext.Provider value={{ GetSocket: () => socket }}>
        <AuthContext.Provider value={{ user: { id: 1, name: "Agente" } }}>
          <ReplyMessageContext.Provider
            value={{ replyingMessage: null, setReplyingMessage: jest.fn() }}
          >
            <EditMessageContext.Provider
              value={{ editingMessage: null, setEditingMessage: jest.fn() }}
            >
              {internal ? (
                <ChatMessages
                  chat={{ id: 7 }}
                  messages={[]}
                  handleSendMessage={jest.fn()}
                  handleLoadMore={jest.fn()}
                  scrollToBottomRef={{ current: null }}
                  pageInfo={{ hasMore: false }}
                />
              ) : (
                <MessageInputCustom
                  ticket={{
                    id: 1,
                    status: "open",
                    isGroup: false,
                    contact: {}
                  }}
                  showTabGroups
                />
              )}
            </EditMessageContext.Provider>
          </ReplyMessageContext.Provider>
        </AuthContext.Provider>
      </SocketContext.Provider>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  i18n.changeLanguage("pt");
  jest.clearAllMocks();
  api.request.mockResolvedValue({ data: [] });
  MicRecorder.mockImplementation(() => ({ stop: jest.fn() }));
});

test.each([false, true])(
  "enables native spelling on the actual textarea, preserving drafts across language changes (internal=%s)",
  async internal => {
    const { unmount } = mount(internal);
    // Flush the WhatsApp quick-message options request.
    await act(async () => {});
    const input = screen.getByRole("textbox");
    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toHaveAttribute("spellcheck", "true");
    expect(input).toHaveAttribute("autocorrect", "on");
    expect(input).toHaveAttribute("autocapitalize", "sentences");
    expect(input).toHaveAttribute("lang", "pt-BR");

    fireEvent.change(input, { target: { value: "Minha mensagem para João" } });
    act(() => i18n.changeLanguage("pt_PT"));
    expect(input).toHaveAttribute("lang", "pt-PT");
    act(() => i18n.changeLanguage("es"));
    expect(input).toHaveAttribute("lang", "es");
    expect(input).toHaveValue("Minha mensagem para João");
    expect(screen.getByRole("textbox")).toBe(input);

    unmount();
    act(() => i18n.changeLanguage("en"));
  }
);

test.each([
  ["pt", "pt-BR"],
  ["pt_PT", "pt-PT"],
  ["pt-BR", "pt-BR"],
  ["en_US", "en-US"],
  ["es", "es"],
  ["fr", "fr"],
  ["de", "de"],
  ["it", "it"],
  ["id", "id"],
  [undefined, "pt-BR"],
  ["invalid_locale!", "pt-BR"]
])("normalizes application language %s to %s", (language, expected) => {
  expect(writingLanguage(language)).toBe(expected);
});
