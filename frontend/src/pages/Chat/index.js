import React, { useState } from "react";
import { useMediaQuery } from "@material-ui/core";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { PanelRight, Files } from "lucide-react";
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  X,
  Pencil
} from "../../components/AnimatedIcon";
import ChatModal from "./ChatModal";
import ChatList from "./ChatList";
import ChatMessages from "./ChatMessages";
import useChatInterno from "./useChatInterno";
import useFecharConversaComEscape from "../../hooks/useFecharConversaComEscape";
import AvatarUsuario from "../../components/AvatarUsuario";
import { Botao, BotaoIcone, useIdentidade } from "../../components/interface";
import PainelMensagens from "../../components/Conversa/PainelMensagens";
import { i18n } from "../../translate/i18n";
import "../../components/Conversa/conversa.css";
import "./chat.css";

export { ChatModal };

export default function Chat() {
  const chat = useChatInterno();
  const identidade = useIdentidade();
  const compacto = useMediaQuery("(max-width:959px)");
  const [modal, definirModal] = useState(null);
  const [contexto, definirContexto] = useState(null);
  const fecharConversa = () => {
    definirContexto(null);
    chat.voltar();
  };
  useFecharConversaComEscape(fecharConversa, Boolean(chat.conversa) && !modal);
  const tituloFechar = `${i18n.t("conversa.voltar")} (Esc)`;
  const participante = chat.conversa?.users?.find(
    item => item.userId !== chat.user.id
  )?.user;
  const usuarioAvatar =
    chat.conversa?.users?.length === 2
      ? participante
      : { name: chat.conversa?.title };
  const lista = (
    <section className="chat-fila">
      <header>
        <div>
          <strong>{i18n.t("internalChat.title")}</strong>
          <small>{i18n.t("conversa.equipe")}</small>
        </div>
        <BotaoIcone
          titulo={i18n.t("conversa.nova")}
          onClick={() => definirModal("new")}
        >
          <Plus size={18} />
        </BotaoIcone>
      </header>
      <div className="chat-fila-busca">
        <label className="conversa-busca">
          <Search size={16} />
          <input
            value={chat.busca}
            onChange={e => chat.definirBusca(e.target.value)}
            aria-label={i18n.t("conversa.buscarConversas")}
            placeholder={i18n.t("conversa.buscarConversas")}
          />
        </label>
      </div>
      <ChatList
        chats={chat.conversas}
        loading={chat.carregandoConversas}
        handleSelectChat={chat.selecionar}
        handleDeleteChat={chat.excluir}
        handleEditChat={conversa => {
          chat.selecionar(conversa);
          definirModal("edit");
        }}
      />
      {chat.maisConversas && (
        <Botao
          className="chat-carregar"
          disabled={chat.carregandoConversas}
          onClick={() => chat.carregarConversas()}
        >
          {i18n.t("conversa.carregarMais")}
        </Botao>
      )}
    </section>
  );
  const conversa = chat.conversa ? (
    <section className="chat-conversa conversa-painel">
      <header className="conversa-cabecalho">
        {compacto && <span className="chat-espaco-menu" aria-hidden="true" />}
        <AvatarUsuario usuario={usuarioAvatar} tamanho={40} />
        <div className="chat-identidade">
          <strong>{chat.conversa.title}</strong>
          <small>
            {i18n.t("conversa.participantes", {
              count: chat.conversa.users?.length || 0
            })}
          </small>
        </div>
        <div className="conversa-cabecalho-acoes">
          <BotaoIcone
            titulo={tituloFechar}
            aria-keyshortcuts="Escape"
            onClick={fecharConversa}
          >
            <X size={18} />
          </BotaoIcone>
          <BotaoIcone
            titulo={i18n.t("conversa.pesquisa")}
            onClick={() =>
              definirContexto(contexto === "pesquisa" ? null : "pesquisa")
            }
          >
            <Search size={18} />
          </BotaoIcone>
          <BotaoIcone
            titulo={i18n.t("conversa.pessoas")}
            onClick={() =>
              definirContexto(contexto === "pessoas" ? null : "pessoas")
            }
          >
            <PanelRight size={18} />
          </BotaoIcone>
        </div>
      </header>
      <div className="conversa-fatos">
        <span>
          <Users size={12} />
          {i18n.t("conversa.somenteEquipe")}
        </span>
      </div>
      <div className="conversa-corpo">
        <ChatMessages
          key={chat.conversa.id}
          chat={chat.conversa}
          messages={chat.mensagens}
          handleSendMessage={chat.enviar}
          handleLoadMore={chat.carregarMensagens}
          scrollToBottomRef={chat.scrollToBottomRef}
          pageInfo={{ hasMore: chat.maisMensagens }}
          carregandoHistorico={chat.carregando}
        />
        <aside className="conversa-acoes">
          <BotaoIcone
            titulo={i18n.t("conversa.pessoas")}
            onClick={() => definirContexto("pessoas")}
          >
            <Users size={18} />
          </BotaoIcone>
          <BotaoIcone
            titulo={i18n.t("conversa.arquivos")}
            onClick={() => definirContexto("arquivos")}
          >
            <Files size={18} />
          </BotaoIcone>
          {chat.conversa.ownerId === chat.user.id && (
            <BotaoIcone
              titulo={i18n.t("conversa.editar")}
              onClick={() => definirModal("edit")}
            >
              <Pencil size={18} />
            </BotaoIcone>
          )}
        </aside>
      </div>
    </section>
  ) : (
    <section className="chat-vazio">
      <MessageSquare size={44} strokeWidth={1.2} />
      <strong>{i18n.t("conversa.selecione")}</strong>
      <p>{i18n.t("conversa.selecioneAjuda")}</p>
      <Botao onClick={() => definirModal("new")} variante="primary">
        <Plus size={16} />
        {i18n.t("conversa.nova")}
      </Botao>
    </section>
  );
  return (
    <div
      className="ew-ui chat-layout"
      data-stardew-screen="chat"
      style={identidade}
    >
      <ChatModal
        open={Boolean(modal)}
        type={modal || "new"}
        chat={chat.conversa}
        user={chat.user}
        handleClose={() => definirModal(null)}
        handleLoadNewChat={chat.selecionar}
      />
      {compacto ? (
        chat.conversa ? (
          conversa
        ) : (
          lista
        )
      ) : (
        <PanelGroup direction="horizontal" autoSaveId="chat-interno-paineis">
          <Panel defaultSize={29} minSize={23} maxSize={42}>
            {lista}
          </Panel>
          <PanelResizeHandle className="atendimento-divisor" />
          <Panel minSize={40}>{conversa}</Panel>
        </PanelGroup>
      )}
      {chat.conversa && contexto === "pessoas" && (
        <aside className="conversa-pesquisa chat-contexto">
          <header>
            <strong>{i18n.t("conversa.pessoas")}</strong>
            <BotaoIcone
              titulo={i18n.t("fluxos.fechar")}
              onClick={() => definirContexto(null)}
            >
              <X size={16} />
            </BotaoIcone>
          </header>
          <div className="chat-contexto-identidade">
            <AvatarUsuario usuario={usuarioAvatar} tamanho={56} />
            <strong>{chat.conversa.title}</strong>
            <small>
              {i18n.t("conversa.participantes", {
                count: chat.conversa.users?.length || 0
              })}
            </small>
          </div>
          <div className="chat-participantes">
            {chat.conversa.users?.map(membro => (
              <div key={membro.userId}>
                <AvatarUsuario
                  usuario={membro.user || { id: membro.userId }}
                  tamanho={34}
                />
                <span>
                  <strong>
                    {membro.user?.name || i18n.t("conversa.usuario")}
                  </strong>
                  <small>
                    {i18n.t(
                      membro.userId === chat.conversa.ownerId
                        ? "conversa.criador"
                        : "conversa.membro"
                    )}
                  </small>
                </span>
              </div>
            ))}
          </div>
          {chat.conversa.ownerId === chat.user.id && (
            <Botao onClick={() => definirModal("edit")}>
              <Users size={16} />
              {i18n.t("conversa.gerenciar")}
            </Botao>
          )}
        </aside>
      )}
      {chat.conversa && ["pesquisa", "arquivos"].includes(contexto) && (
        <PainelMensagens
          key={`${chat.conversa.id}-${contexto}`}
          modo={contexto}
          mensagens={chat.mensagens}
          aoFechar={() => definirContexto(null)}
          aoSelecionar={id =>
            document
              .getElementById(`chat-mensagem-${id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        />
      )}
    </div>
  );
}
