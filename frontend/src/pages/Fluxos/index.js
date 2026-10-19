import React, { useContext, useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { Workflow, Settings2, Plug, Plus } from "lucide-react";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import MainContainer from "../../components/MainContainer";
import EditorFluxo from "../../components/EditorFluxo";
import { Botao, useIdentidade } from "../../components/interface";
import QueueModal from "../../components/QueueModal";
import { canSeeScreen } from "../../helpers/screenAccess";

export default function Fluxos() {
  const { user } = useContext(AuthContext);
  const { queueId } = useParams();
  const history = useHistory();
  const identidade = useIdentidade();
  const [filas, setFilas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const carregar = async () => {
    try {
      const { data } = await api.get("/queue");
      setFilas(data);
    } catch (error) {
      toastError(error);
    } finally {
      setCarregando(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);
  const filaAtual = filas.find(fila => fila.id === Number(queueId)) || filas[0];
  if (!canSeeScreen(user, "fluxos")) return null;
  return (
    <MainContainer>
      <div
        className="ew-ui pagina-fluxos"
        data-stardew-screen="flows"
        style={{
          ...identidade,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "auto"
        }}
      >
        <h1 className="ew-sr-only">{i18n.t("fluxos.titulo")}</h1>
        <div className="fluxos-navegacao">
          <Tabs.Root value="editor">
            <Tabs.List className="ew-tabs" aria-label={i18n.t("fluxos.secoes")}>
              <Tabs.Trigger className="ew-tab" value="editor">
                <Workflow size={15} />
                {i18n.t("fluxos.editor")}
              </Tabs.Trigger>
              <Link className="ew-tab" to="/queues">
                <Settings2 size={15} />
                {i18n.t("fluxos.filasCanais")}
              </Link>
              <Link className="ew-tab" to="/chatgpt">
                <Plug size={15} />
                {i18n.t("fluxos.integracoes")}
              </Link>
            </Tabs.List>
          </Tabs.Root>
          <div className="fluxos-seletor">
            {!!filas.length && (
              <select
                className="ew-select"
                aria-label={i18n.t("fluxos.selecionarFluxo")}
                value={filaAtual?.id || ""}
                onChange={event =>
                  history.push(`/fluxos/${event.target.value}`)
                }
              >
                {filas.map(fila => (
                  <option key={fila.id} value={fila.id}>
                    {fila.name}
                  </option>
                ))}
              </select>
            )}
            <Botao onClick={() => setCriando(true)}>
              <Plus size={15} />
              {i18n.t("fluxos.novoFluxo")}
            </Botao>
          </div>
        </div>
        {carregando ? (
          <div className="fluxo-vazio">{i18n.t("fluxos.carregando")}</div>
        ) : filaAtual ? (
          <EditorFluxo
            key={filaAtual.id}
            queueId={filaAtual.id}
            filas={filas}
          />
        ) : (
          <div className="fluxo-vazio">
            <Workflow size={40} />
            <h2>{i18n.t("fluxos.primeiroFluxo")}</h2>
            <p className="ew-muted">{i18n.t("fluxos.descricaoInicio")}</p>
            <Botao variante="primary" onClick={() => setCriando(true)}>
              {i18n.t("fluxos.novoFluxo")}
            </Botao>
          </div>
        )}
        <QueueModal
          open={criando}
          onClose={() => {
            setCriando(false);
            carregar();
          }}
        />
      </div>
    </MainContainer>
  );
}
