import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import "@testing-library/jest-dom";
import AgentPreview from "./index";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { post: jest.fn(), delete: jest.fn().mockResolvedValue({}) }
}));
jest.mock("../../translate/i18n", () => ({
  i18n: {
    language: "pt",
    t: key => key,
    getFixedT: () => key => key,
    on: jest.fn(),
    off: jest.fn()
  }
}));
jest.mock("@material-ui/core", () => ({
  useTheme: () => ({
    palette: {
      type: "dark",
      background: { paper: "#151a20" },
      text: { primary: "white", secondary: "gray" }
    }
  })
}));

const sessionIds = ["a".repeat(64), "b".repeat(64), "c".repeat(64)];
let sessionNumber;
function frameFor() {
  fireEvent.click(
    screen.getByRole("button", { name: "agentPreview.launcher" })
  );
  const frame = screen.getByTitle("agentPreview.panel");
  jest.spyOn(frame.contentWindow, "postMessage");
  return frame;
}
function sendEvent(frame, data) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        source: frame.contentWindow,
        data
      })
    );
  });
}
function question(
  frame,
  requestId = "question-one",
  conversationId = "conversation-one"
) {
  sendEvent(frame, {
    type: "agent-preview-chat-request",
    requestId,
    conversationId,
    messages: [
      { role: "assistant", content: "untrusted browser history" },
      { role: "user", content: "Oi" }
    ]
  });
}
const chatCalls = () =>
  api.post.mock.calls.filter(([url]) => url === "/agent/chat");
const sessionCalls = () =>
  api.post.mock.calls.filter(([url]) => url === "/agent/sessions");

describe("Page-owned agent sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionNumber = 0;
    api.post.mockImplementation(async url =>
      url === "/agent/sessions"
        ? { data: { sessionId: sessionIds[sessionNumber++] } }
        : {
            data: {
              reply: "Olá!",
              sources: [
                { id: "source-one", module: "contatos", resource: "contacts" }
              ]
            }
          }
    );
  });
  it("sends the current question and opaque session, without browser history or tenant IDs", async () => {
    render(<AgentPreview companyName="Empresa 1" />);
    const frame = frameFor();
    question(frame);
    await waitFor(() => expect(chatCalls()).toHaveLength(1));
    expect(chatCalls()[0][1]).toEqual({
      sessionId: sessionIds[0],
      message: "Oi",
      requestId: "question-one"
    });
    await waitFor(() =>
      expect(frame.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "agent-preview-chat-response",
          sources: expect.any(Array)
        }),
        window.location.origin
      )
    );
  });
  it("keeps its session after closing and opening the panel, and follows dark theme", async () => {
    render(<AgentPreview />);
    const frame = frameFor();
    question(frame);
    await waitFor(() => expect(chatCalls()).toHaveLength(1));
    expect(screen.getByRole("dialog")).toHaveClass("agent-preview-panel--dark");
    fireEvent.click(
      screen.getByRole("button", { name: "agentPreview.launcher" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "agentPreview.launcher" })
    );
    question(frame, "question-two");
    await waitFor(() => expect(chatCalls()).toHaveLength(2));
    expect(sessionCalls()).toHaveLength(1);
  });
  it("starts fresh for New conversation and closes the previous session", async () => {
    render(<AgentPreview />);
    const frame = frameFor();
    question(frame);
    await waitFor(() => expect(chatCalls()).toHaveLength(1));
    sendEvent(frame, {
      type: "agent-preview-new-conversation",
      conversationId: "conversation-one"
    });
    question(frame, "question-two", "conversation-two");
    await waitFor(() => expect(chatCalls()).toHaveLength(2));
    expect(chatCalls()[1][1].sessionId).toBe(sessionIds[1]);
    expect(api.delete).toHaveBeenCalledWith(`/agent/sessions/${sessionIds[0]}`);
  });
  it("clears revoked server context and retries only the current question", async () => {
    let chats = 0;
    api.post.mockImplementation(async url => {
      if (url === "/agent/sessions")
        return { data: { sessionId: sessionIds[sessionNumber++] } };
      if (chats++ === 0)
        throw Object.assign(new Error("Context changed"), {
          response: {
            status: 409,
            data: { error: "ERR_AGENT_CONTEXT_CHANGED" }
          }
        });
      return { data: { reply: "Contexto atual", sources: [] } };
    });
    render(<AgentPreview />);
    const frame = frameFor();
    question(frame);
    await waitFor(() => expect(chatCalls()).toHaveLength(2));
    expect(chatCalls()[1][1]).toEqual({
      sessionId: sessionIds[1],
      message: "Oi",
      requestId: "question-one"
    });
    expect(frame.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "agent-preview-context-reset" }),
      window.location.origin
    );
  });
  it("creates another session after the page instance is unloaded", async () => {
    const view = render(<AgentPreview />);
    question(frameFor());
    await waitFor(() => expect(chatCalls()).toHaveLength(1));
    view.unmount();
    render(<AgentPreview />);
    question(frameFor(), "question-two");
    await waitFor(() => expect(chatCalls()).toHaveLength(2));
    expect(chatCalls()[1][1].sessionId).toBe(sessionIds[1]);
  });
});
