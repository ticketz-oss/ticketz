import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { organizarBlocos } from "./modeloFluxo";

export default function useFluxo(queueId, companyId) {
  const [fluxo, setFluxo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [arquivos, setArquivos] = useState({});
  const [historico, setHistorico] = useState({ antes: [], depois: [] });
  const chave = `fluxo:${companyId}:${queueId}`;
  const referencia = useRef(null);

  const receber = useCallback(dados => {
    referencia.current = dados;
    setFluxo(dados);
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      const { data } = await api.get(`/queue/${queueId}/flow`);
      let salvo;
      try {
        salvo = JSON.parse(localStorage.getItem(chave));
      } catch (_) {
        salvo = null;
      }
      const restaurar =
        salvo?.version === data.version &&
        Array.isArray(salvo.nodes) &&
        Array.isArray(salvo.edges);
      receber(
        restaurar
          ? salvo
          : data.nodes.some(no => no.positioned === false)
            ? organizarBlocos(data)
            : data
      );
      setAlterado(!!restaurar);
      setHistorico({ antes: [], depois: [] });
      if (salvo && !restaurar) toast.info(i18n.t("fluxos.rascunhoAntigo"));
    } catch (error) {
      setErro(true);
      toastError(error);
    } finally {
      setCarregando(false);
    }
  }, [queueId, chave, receber]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!alterado || !fluxo) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(chave, JSON.stringify(fluxo));
      } catch (_) {
        toast.error(i18n.t("fluxos.erroRascunho"));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fluxo, alterado, chave]);

  useEffect(() => {
    const avisar = event => {
      if (alterado) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [alterado]);

  const registrar = () =>
    setHistorico(atual => ({
      antes: [...atual.antes.slice(-49), referencia.current],
      depois: []
    }));
  const atualizar = (novo, guardar = true) => {
    if (guardar) registrar();
    receber(typeof novo === "function" ? novo(referencia.current) : novo);
    setAlterado(true);
  };
  const desfazer = () => {
    if (!historico.antes.length) return;
    const anterior = historico.antes[historico.antes.length - 1];
    setHistorico({
      antes: historico.antes.slice(0, -1),
      depois: [referencia.current, ...historico.depois]
    });
    receber(anterior);
    setAlterado(true);
  };
  const refazer = () => {
    if (!historico.depois.length) return;
    setHistorico({
      antes: [...historico.antes, referencia.current],
      depois: historico.depois.slice(1)
    });
    receber(historico.depois[0]);
    setAlterado(true);
  };
  const publicar = async () => {
    setPublicando(true);
    try {
      const { data } = await api.put(
        `/queue/${queueId}/flow`,
        referencia.current
      );
      receber(data);
      const pendentes = Object.fromEntries(
        Object.entries(arquivos)
          .filter(([id]) => data.idMap[id])
          .map(([id, file]) => [data.idMap[id], file])
      );
      setArquivos(pendentes);
      for (const [id, file] of Object.entries(pendentes)) {
        if (file === null)
          await api.delete(`/queue-options/${id}/media-upload`);
        else {
          const form = new FormData();
          form.append("file", file);
          await api.post(`/queue-options/${id}/media-upload`, form);
        }
        delete pendentes[id];
        setArquivos({ ...pendentes });
      }
      const resposta = await api.get(`/queue/${queueId}/flow`);
      receber(resposta.data);
      setAlterado(false);
      setHistorico({ antes: [], depois: [] });
      localStorage.removeItem(chave);
      toast.success(i18n.t("fluxos.publicado"));
      return true;
    } catch (error) {
      setAlterado(true);
      toastError(error);
      return false;
    } finally {
      setPublicando(false);
    }
  };
  return {
    fluxo,
    carregando,
    erro,
    carregar,
    publicando,
    alterado,
    atualizar,
    registrar,
    desfazer,
    refazer,
    historico,
    publicar,
    arquivos,
    anexar: (id, arquivo) => {
      if (arquivo === undefined) return;
      setArquivos(atual => {
        const proximo = { ...atual };
        const original = referencia.current.nodes.find(no => no.id === id);
        if (arquivo === null && !original?.mediaName) delete proximo[id];
        else proximo[id] = arquivo;
        return proximo;
      });
      setAlterado(true);
    }
  };
}
