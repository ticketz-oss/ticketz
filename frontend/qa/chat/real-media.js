// Renders the production ChatMessages component, not a duplicate mock layout.
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import ChatMessages from "../../src/pages/Chat/ChatMessages";
import { AuthContext } from "./contexts";
import { onMessage } from "./api";
import { useIdentidade } from "../../src/components/interface";
import "../../src/components/Conversa/conversa.css";
import "../../src/pages/Chat/chat.css";
import "./preview.css";

const user = { id: 1, name: "Validação local" };
const sampleImage =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280"><rect width="480" height="280" fill="#eff6ff"/><circle cx="240" cy="100" r="42" fill="#2563eb"/><text x="240" y="200" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#1e3a8a">Prévia de imagem · QA</text></svg>'
  );
function Content() {
  const vars = useIdentidade();
  const fixtureRoot = useRef(null);
  const scroll = useRef(null);
  const urls = useRef([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      senderId: 2,
      sender: { name: "Equipe" },
      message:
        "ChatMessages real: anexe uma imagem, escreva uma legenda e envie. Nenhuma conexão com o servidor.",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      senderId: 1,
      sender: user,
      message: "Imagem com legenda",
      mediaType: "image",
      mediaName: "qa.svg",
      mediaPath: sampleImage,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      senderId: 2,
      sender: { name: "Equipe" },
      message: "sample.wav",
      mediaType: "audio",
      mediaName: "sample.wav",
      mediaPath: "/sample.wav",
      createdAt: new Date().toISOString()
    }
  ]);
  useEffect(() => {
    onMessage(body => {
      const files = body instanceof FormData ? body.getAll("medias") : [];
      const text =
        body instanceof FormData ? body.get("message") : body.message;
      const records = (files.length ? files : [null]).map((file, index) => {
        const url = file ? URL.createObjectURL(file) : null;
        if (url) urls.current.push(url);
        return {
          id: Date.now() + index,
          senderId: 1,
          sender: user,
          createdAt: new Date().toISOString(),
          message: text || "",
          mediaPath: url,
          mediaType: file?.type.split("/")[0],
          mediaName: file?.name
        };
      });
      setMessages(previous => [...previous, ...records]);
      return records[0];
    });
    return () => {
      urls.current.forEach(url => URL.revokeObjectURL(url));
      onMessage(() => ({}));
    };
  }, []);
  return (
    <div className="qa-root" style={vars} ref={fixtureRoot}>
      <header className="qa-toolbar">
        <strong>Chat real · QA local</strong>
        <span>
          Mesmo componente do sistema · dados fictícios · sem envio externo
        </span>
        <button
          onClick={() => {
            const transfer = new DataTransfer();
            transfer.items.add(
              new File(
                [decodeURIComponent(sampleImage.split(",")[1])],
                "previa-qa.svg",
                { type: "image/svg+xml" }
              )
            );
            const input =
              fixtureRoot.current.querySelector('input[type="file"]');
            input.files = transfer.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }}
        >
          Selecionar imagem de teste
        </button>
      </header>
      <section
        className="chat-conversa"
        style={{
          height: "calc(100vh - 80px)",
          maxWidth: 1040,
          margin: "16px auto"
        }}
      >
        <ChatMessages
          chat={{ id: 1 }}
          messages={messages}
          handleLoadMore={() => {}}
          pageInfo={{ hasMore: false }}
          scrollToBottomRef={scroll}
          handleSendMessage={async message => {
            setMessages(previous => [
              ...previous,
              {
                id: Date.now(),
                senderId: 1,
                sender: user,
                createdAt: new Date().toISOString(),
                message
              }
            ]);
            return true;
          }}
        />
      </section>
    </div>
  );
}
const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" },
    chatlist: { main: "#f7f8fa" },
    chatBubbleReceived: { main: "white" },
    chatBubbleFromMe: { main: "#eff6ff" }
  }
});
ReactDOM.render(
  <ThemeProvider theme={theme}>
    <MemoryRouter>
      <AuthContext.Provider value={{ user }}>
        <Content />
      </AuthContext.Provider>
    </MemoryRouter>
  </ThemeProvider>,
  document.getElementById("root")
);
