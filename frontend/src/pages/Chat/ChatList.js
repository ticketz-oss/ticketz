import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { Pencil, Trash2, MessageSquare } from "../../components/AnimatedIcon";
import { AuthContext } from "../../context/Auth/AuthContext";
import AvatarUsuario from "../../components/AvatarUsuario";
import MenuAcoes from "../../components/interface/MenuAcoes";
import ConfirmationModal from "../../components/ConfirmationModal";
import { i18n } from "../../translate/i18n";
import useWritingAssistance from "../../hooks/useWritingAssistance";

export default function ChatList({
  chats,
  handleSelectChat,
  handleDeleteChat,
  handleEditChat,
  loading
}) {
  const { user } = useContext(AuthContext);
  const { lang } = useWritingAssistance();
  const { id } = useParams();
  const [excluir, definirExcluir] = useState(null);
  return (
    <div className="chat-lista">
      <ConfirmationModal
        title={i18n.t("conversa.excluir")}
        open={Boolean(excluir)}
        onClose={() => definirExcluir(null)}
        onConfirm={() => {
          handleDeleteChat(excluir);
          definirExcluir(null);
        }}
      >
        {i18n.t("conversa.confirmarExclusao")}
      </ConfirmationModal>
      {!chats.length && (
        <div className="conversa-sem-resultados">
          <MessageSquare size={24} />
          <p>
            {i18n.t(loading ? "conversa.carregando" : "conversa.semConversas")}
          </p>
        </div>
      )}
      {chats.map(chat => {
        const naoLidas =
          chat.users?.find(membro => membro.userId === user.id)?.unreads || 0;
        const pessoa =
          chat.users?.length === 2
            ? chat.users.find(membro => membro.userId !== user.id)?.user
            : { name: chat.title };
        return (
          <article
            key={chat.id}
            className={`chat-item ${chat.uuid === id ? "selecionado" : ""}`}
          >
            <button
              type="button"
              className="chat-item-abrir"
              onClick={() => handleSelectChat(chat)}
              aria-current={chat.uuid === id ? "page" : undefined}
            >
              <AvatarUsuario usuario={pessoa} tamanho={40} />
              <span className="chat-item-dados">
                <span className="chat-item-topo">
                  <strong>{chat.title}</strong>
                  <time>
                    {chat.updatedAt &&
                      new Date(chat.updatedAt).toLocaleDateString(lang, {
                        day: "2-digit",
                        month: "2-digit"
                      })}
                  </time>
                </span>
                <span className="chat-item-previa">
                  {chat.lastMessage || i18n.t("conversa.semMensagens")}
                </span>
                <span className="chat-item-rodape">
                  <span>
                    {i18n.t("conversa.participantes", {
                      count: chat.users?.length || 0
                    })}
                  </span>
                  {naoLidas > 0 && <b>{naoLidas}</b>}
                </span>
              </span>
            </button>
            {chat.ownerId === user.id && (
              <MenuAcoes
                itens={[
                  {
                    rotulo: i18n.t("conversa.editar"),
                    icone: Pencil,
                    aoSelecionar: () => handleEditChat(chat)
                  },
                  {
                    rotulo: i18n.t("conversa.excluir"),
                    icone: Trash2,
                    perigo: true,
                    aoSelecionar: () => definirExcluir(chat)
                  }
                ]}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
