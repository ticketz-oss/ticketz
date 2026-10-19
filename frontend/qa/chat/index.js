import React, { useState } from "react";
import ReactDOM from "react-dom";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import { Smile, UsersRound, SunMoon } from "lucide-react";
import {
  MessageCircle,
  Send,
  Paperclip,
  MessageSquare,
  LayoutDashboard,
  Archive,
  Settings,
  Users
} from "../../src/components/AnimatedIcon";
import TicketCard from "../../src/components/TicketListItemCustom";
import TicketListSurface from "../../src/components/TicketsListCustom/TicketListSurface";
import criarAjustesVisuais from "../../src/theme/overrides";
import AudioMessage from "../../src/components/AudioMessage";
import {
  Botao,
  BotaoIcone,
  useIdentidade
} from "../../src/components/interface";
import { AuthContext, TicketsContext } from "./contexts";
import "../../src/components/Conversa/conversa.css";
import "../../src/pages/Chat/chat.css";
import "./preview.css";
const tickets = [
  { id: 1, name: "Natan", status: "open", unreadMessages: 2 },
  {
    id: 2,
    name: "Contato com um nome muito longo para testar telas pequenas",
    status: "pending"
  },
  {
    id: 3,
    name: "Equipe • Atendimento",
    status: "open",
    isGroup: true,
    lastSenderName: "Marina"
  }
].map(item => ({
  ...item,
  uuid: String(item.id),
  contact: { name: item.name, number: String(item.id) },
  user: { name: "Guilherme Santos" },
  whatsapp: { name: "Espaço Whats • Atendimento" },
  queue: { name: "Relacionamento com associados" },
  updatedAt: new Date().toISOString(),
  lastMessage: "Olá! Podemos conferir os detalhes juntos?",
  tags: Array.from({ length: 6 }, (_, index) => ({
    id: index,
    name: [
      "AC NORTE",
      "Financeiro",
      "Prioridade",
      "Renovação",
      "Cliente desde 2024",
      "Etiqueta de nome muito longo para testar a quebra de linha"
    ][index],
    color: ["#65a30d", "#2563eb", "#d97706"][index % 3]
  }))
}));
function Content({ dark, toggle }) {
  const vars = useIdentidade();
  const [width, setWidth] = useState(370);
  const [empty, setEmpty] = useState(false);
  return (
    <div className="qa-root" style={vars}>
      <header className="qa-toolbar">
        <strong>Chat • validação local</strong>
        <span>Dados fictícios · nenhum envio real</span>
        {[280, 320, 370, 480].map(size => (
          <button key={size} onClick={() => setWidth(size)}>
            {size}px
          </button>
        ))}
        <BotaoIcone titulo="Alternar tema" onClick={toggle}>
          <SunMoon size={18} />
        </BotaoIcone>
        <button onClick={() => setEmpty(value => !value)}>Lista vazia</button>
      </header>
      <section
        style={{ display: "flex", gap: 16, padding: 16 }}
        aria-label="SVG animation examples"
      >
        {[
          [LayoutDashboard, "Painel"],
          [MessageSquare, "Chat"],
          [Archive, "Resolvidos"],
          [Settings, "Configurações"],
          [Users, "Grupos"]
        ].map(([Icon, label]) => (
          <Botao key={label}>
            <Icon size={28} />
            {label}
          </Botao>
        ))}
        <Botao disabled>
          <Send />
          Desabilitado
        </Botao>
      </section>
      <div className="qa-workspace">
        <aside style={{ width }} className="qa-sidebar">
          <header>
            <MessageCircle size={18} />
            <strong>Central de atendimento</strong>
          </header>
          <div className="qa-tabs">
            <b>
              Atendendo <small>2</small>
            </b>
            <span>
              Aguardando <small>1</small>
            </span>
          </div>
          <TicketListSurface>
            <ul>
              {empty ? (
                <li
                  style={{
                    textAlign: "center",
                    padding: 32,
                    listStyle: "none"
                  }}
                >
                  <strong>Nada aqui!</strong>
                  <p>
                    Nenhum atendimento encontrado com esse status ou termo
                    pesquisado
                  </p>
                </li>
              ) : (
                tickets.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    groupActionButtons
                    setTabOpen={() => {}}
                  />
                ))
              )}
            </ul>
          </TicketListSurface>
        </aside>
        <section className="chat-conversa">
          <header className="conversa-cabecalho">
            <UsersRound size={20} />
            <div className="chat-identidade">
              <strong>Equipe • Atendimento</strong>
              <small>Chat interno · somente equipe</small>
            </div>
          </header>
          <div className="qa-messages chat-mensagens-lista">
            <div className="chat-dia">
              <span>Hoje</span>
            </div>
            <div className="chat-mensagem">
              <div className="chat-balao">
                <strong>Marina</strong>
                <div className="chat-texto">
                  Bom dia, equipe! Podemos revisar os atendimentos de hoje?
                </div>
                <time>09:41</time>
              </div>
            </div>
            <div className="chat-mensagem minha">
              <div className="chat-balao">
                <strong>Você</strong>
                <div className="chat-texto">
                  Claro! As etiquetas agora ficam organizadas, sem sobrepor os
                  botões.
                </div>
                <time>09:42</time>
              </div>
            </div>
            <div className="chat-mensagem">
              <div className="chat-balao">
                <strong>Marina</strong>
                <AudioMessage src="/sample.wav" />
                <time>09:43</time>
              </div>
            </div>
            <div className="chat-mensagem minha">
              <div className="chat-balao">
                <strong>Você</strong>
                <div className="chat-texto">
                  Áudio com forma de onda, velocidade e navegação pelo teclado.
                </div>
                <time>09:44</time>
              </div>
            </div>
          </div>
          <footer className="conversa-compositor">
            <div className="conversa-modos">
              <strong>Responder</strong>
            </div>
            <div className="qa-composer">
              <BotaoIcone titulo="Anexar">
                <Paperclip size={18} />
              </BotaoIcone>
              <input placeholder="Escreva uma mensagem…" />
              <BotaoIcone titulo="Emojis">
                <Smile size={18} />
              </BotaoIcone>
              <BotaoIcone titulo="Enviar (demonstração)">
                <Send size={18} />
              </BotaoIcone>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
function App() {
  const [dark, setDark] = useState(false);
  const theme = createTheme({
    overrides: criarAjustesVisuais(dark ? "dark" : "light"),
    palette: {
      type: dark ? "dark" : "light",
      primary: { main: "#2563eb" },
      background: {
        default: dark ? "#14171e" : "#f7f8fa",
        paper: dark ? "#1c212b" : "#fff"
      }
    }
  });
  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { id: 1, profile: "admin" } }}>
          <TicketsContext.Provider value={{ setCurrentTicket: () => {} }}>
            <Content dark={dark} toggle={() => setDark(!dark)} />
          </TicketsContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </ThemeProvider>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
