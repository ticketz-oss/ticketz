import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import {
  atualizarConversas,
  mesclarConversa,
  mesclarMensagens
} from "./estadoChat";

export default function useChatInterno() {
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const { id } = useParams();
  const history = useHistory();
  const [conversas, definirConversas] = useState([]);
  const [conversa, definirConversa] = useState(null);
  const [mensagens, definirMensagens] = useState([]);
  const [busca, definirBusca] = useState("");
  const [carregando, definirCarregando] = useState(false);
  const [carregandoConversas, definirCarregandoConversas] = useState(false);
  const [maisConversas, definirMaisConversas] = useState(false);
  const [maisMensagens, definirMaisMensagens] = useState(false);
  const paginaConversas = useRef(1);
  const paginaMensagens = useRef(1);
  const requisicao = useRef(0);
  const listagem = useRef(0);
  const buscandoMensagens = useRef(false);
  const buscandoConversas = useRef(false);
  const conversaAtual = useRef(null);
  const scrollToBottomRef = useRef(null);
  const conversasRef = useRef(conversas);
  conversasRef.current = conversas;
  const mensagensRef = useRef(mensagens);
  mensagensRef.current = mensagens;
  const sincronizacao = useRef(0);

  const carregarConversas = useCallback(
    async (reiniciar = false) => {
      if (buscandoConversas.current && !reiniciar) return;
      const versao = ++listagem.current;
      buscandoConversas.current = true;
      definirCarregandoConversas(true);
      const pagina = reiniciar ? 1 : paginaConversas.current;
      try {
        const { data } = await api.get("/chats", {
          params: { pageNumber: pagina, searchParam: busca }
        });
        if (versao !== listagem.current) return;
        definirConversas(atuais =>
          data.records.reduce(atualizarConversas, reiniciar ? [] : atuais)
        );
        definirMaisConversas(data.hasMore);
        paginaConversas.current = pagina + 1;
      } catch (erro) {
        if (versao === listagem.current) toastError(erro);
      } finally {
        if (versao === listagem.current) {
          definirCarregandoConversas(false);
          buscandoConversas.current = false;
        }
      }
    },
    [busca]
  );

  useEffect(() => {
    const timer = setTimeout(() => carregarConversas(true), 250);
    return () => {
      clearTimeout(timer);
      listagem.current += 1;
    };
  }, [carregarConversas]);

  const carregarMensagens = useCallback(async () => {
    const chatId = conversaAtual.current;
    if (!chatId || buscandoMensagens.current) return;
    buscandoMensagens.current = true;
    definirCarregando(true);
    const versao = requisicao.current;
    try {
      const { data } = await api.get(`/chats/${chatId}/messages`, {
        params: { pageNumber: paginaMensagens.current }
      });
      if (versao !== requisicao.current) return;
      const primeira = paginaMensagens.current === 1;
      paginaMensagens.current += 1;
      definirMaisMensagens(data.hasMore);
      definirMensagens(atuais => mesclarMensagens(atuais, data.records));
      if (primeira)
        requestAnimationFrame(() => {
          if (versao === requisicao.current) scrollToBottomRef.current?.();
        });
    } catch (erro) {
      if (versao === requisicao.current) toastError(erro);
    } finally {
      if (versao === requisicao.current) {
        buscandoMensagens.current = false;
        definirCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    requisicao.current += 1;
    conversaAtual.current = null;
    buscandoMensagens.current = false;
    paginaMensagens.current = 1;
    definirConversa(null);
    definirMensagens([]);
    definirMaisMensagens(false);
    definirCarregando(Boolean(id));
    if (id) {
      const abrir = async () => {
        try {
          const existente = conversasRef.current.find(item => item.uuid === id);
          const dados = existente || (await api.get(`/chats/${id}`)).data;
          if (!ativo) return;
          conversaAtual.current = dados.id;
          definirConversa(dados);
          await carregarMensagens();
          if (ativo)
            await api.post(`/chats/${dados.id}/read`, { userId: user.id });
        } catch (erro) {
          if (ativo) {
            toastError(erro);
            definirCarregando(false);
          }
        }
      };
      abrir();
    }
    return () => {
      ativo = false;
      requisicao.current += 1;
    };
  }, [id, user.id, carregarMensagens]);

  const sincronizarMensagens = useCallback(async () => {
    const chatId = conversaAtual.current;
    if (!chatId) return;
    const versao = requisicao.current;
    const sincronizando = ++sincronizacao.current;
    const ultima = mensagensRef.current[mensagensRef.current.length - 1]?.id;
    let pagina = 1;
    try {
      // Recover every missed page, including outages longer than one page.
      while (true) {
        const { data } = await api.get(`/chats/${chatId}/messages`, {
          params: { pageNumber: pagina }
        });
        if (
          versao !== requisicao.current ||
          sincronizando !== sincronizacao.current
        )
          return;
        definirMensagens(atuais => mesclarMensagens(atuais, data.records));
        if (
          !ultima ||
          !data.hasMore ||
          !data.records.length ||
          data.records.some(mensagem => mensagem.id <= ultima)
        )
          break;
        pagina += 1;
      }
      requestAnimationFrame(() => {
        if (versao === requisicao.current) scrollToBottomRef.current?.(false);
      });
      await api.post(`/chats/${chatId}/read`, { userId: user.id });
    } catch (erro) {
      if (versao === requisicao.current) toastError(erro);
    }
  }, [user.id]);

  useEffect(() => {
    const socket = socketManager.GetSocket(user.companyId);
    const recuperar = ativo => {
      if (!ativo) return;
      carregarConversas(true);
      sincronizarMensagens();
    };
    socket.on("wsRefreshRequired", recuperar);
    return () => socket.disconnect();
  }, [socketManager, user.companyId, carregarConversas, sincronizarMensagens]);

  useEffect(() => {
    const socket = socketManager.GetSocket(user.companyId);
    const atualizar = dados => {
      const registro = dados.record || dados.chat;
      if (registro) {
        definirConversas(atuais => atualizarConversas(atuais, registro));
        definirConversa(atual =>
          atual?.id === registro.id ? mesclarConversa(atual, registro) : atual
        );
      }
      if (dados.action === "delete") {
        definirConversas(atuais =>
          atuais.filter(item => item.id !== +dados.id)
        );
        if (conversaAtual.current === +dados.id) history.push("/chats");
      }
      if (
        dados.action === "new-message" &&
        dados.newMessage?.chatId === conversaAtual.current
      ) {
        definirMensagens(atuais =>
          mesclarMensagens(atuais, [dados.newMessage])
        );
        const chatId = conversaAtual.current;
        requestAnimationFrame(() => {
          if (chatId === conversaAtual.current)
            scrollToBottomRef.current?.(dados.newMessage.senderId === user.id);
        });
        if (dados.newMessage.senderId !== user.id)
          api
            .post(`/chats/${conversaAtual.current}/read`, { userId: user.id })
            .catch(toastError);
      }
    };
    const atualizarFoto = dados => {
      if (dados.action !== "update") return;
      const mesclarFoto = chat =>
        chat && {
          ...chat,
          users: chat.users?.map(membro =>
            membro.userId === dados.user.id
              ? { ...membro, user: { ...membro.user, ...dados.user } }
              : membro
          )
        };
      definirConversas(atuais => atuais.map(mesclarFoto));
      definirConversa(mesclarFoto);
      definirMensagens(atuais =>
        atuais.map(mensagem =>
          mensagem.senderId === dados.user.id
            ? { ...mensagem, sender: { ...mensagem.sender, ...dados.user } }
            : mensagem
        )
      );
    };
    socket.on(`company-${user.companyId}-chat-user-${user.id}`, atualizar);
    socket.on(`company-${user.companyId}-chat`, atualizar);
    socket.on(`company-${user.companyId}-user`, atualizarFoto);
    return () => {
      socket.disconnect();
    };
  }, [socketManager, user.companyId, user.id, history]);

  const enviar = async message => {
    const chatId = conversaAtual.current;
    if (!chatId) return false;
    try {
      const { data } = await api.post(`/chats/${chatId}/messages`, { message });
      if (chatId === conversaAtual.current && data?.id) {
        definirMensagens(atuais => mesclarMensagens(atuais, [data]));
        requestAnimationFrame(() => {
          if (chatId === conversaAtual.current) scrollToBottomRef.current?.();
        });
      }
      return true;
    } catch (erro) {
      toastError(erro);
      return false;
    }
  };
  const excluir = async chat => {
    try {
      await api.delete(`/chats/${chat.id}`);
    } catch (erro) {
      toastError(erro);
    }
  };
  return {
    user,
    conversas,
    conversa,
    mensagens,
    busca,
    definirBusca,
    carregando,
    carregandoConversas,
    maisConversas,
    maisMensagens,
    carregarConversas,
    carregarMensagens,
    scrollToBottomRef,
    enviar,
    excluir,
    selecionar: chat => history.push(`/chats/${chat.uuid}`),
    voltar: () => history.push("/chats")
  };
}
