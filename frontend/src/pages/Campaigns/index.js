import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef
} from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { Rocket, Search, RefreshCw } from "lucide-react";
import NavegacaoEnvios from "../../components/NavegacaoEnvios";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import CabecalhoPagina from "../../components/CabecalhoPagina";
import { Botao, BotaoIcone, useIdentidade } from "../../components/interface";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import CampaignModal from "../../components/CampaignModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import TabelaCampanhas from "./TabelaCampanhas";
import IndicadoresCampanhas from "./IndicadoresCampanhas";

const reducer = (state, action) => {
  if (action.type === "LOAD_CAMPAIGNS") {
    return Array.isArray(action.payload) ? action.payload : [];
  }

  if (action.type === "UPDATE_CAMPAIGNS") {
    const campaign = action.payload;
    const campaignIndex = state.findIndex(u => u.id === campaign.id);

    if (campaignIndex !== -1) {
      state[campaignIndex] = campaign;
      return [...state];
    } else {
      return [campaign, ...state];
    }
  }

  if (action.type === "DELETE_CAMPAIGN") {
    const campaignId = action.payload;

    const campaignIndex = state.findIndex(u => u.id === campaignId);
    if (campaignIndex !== -1) {
      state.splice(campaignIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Campaigns = () => {
  const identidade = useIdentidade();
  const ultimaBusca = useRef(0);
  const [total, setTotal] = useState(0);
  const [atualizacao, setAtualizacao] = useState(0);

  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [campaigns, dispatch] = useReducer(reducer, []);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchCampaigns();
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
      ultimaBusca.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber, atualizacao]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyCampaign = data => {
      if (["update", "create", "delete"].includes(data.action)) {
        setAtualizacao(valor => valor + 1);
      }
    };

    socket.on(`company-${companyId}-campaign`, onCompanyCampaign);
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const fetchCampaigns = async (pagina = pageNumber, busca = searchParam) => {
    const buscaAtual = ++ultimaBusca.current;
    setLoading(true);
    try {
      const { data } = await api.get("/campaigns/", {
        params: { searchParam: busca, pageNumber: pagina }
      });
      if (buscaAtual !== ultimaBusca.current) return;
      dispatch({ type: "LOAD_CAMPAIGNS", payload: data.records });
      setTotal(data.count ?? data.records.length);
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      if (buscaAtual === ultimaBusca.current) {
        toastError(err);
        setLoading(false);
      }
    }
  };

  const handleOpenCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(true);
  };

  const handleCloseCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(false);
  };

  const handleSearch = event => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditCampaign = campaign => {
    setSelectedCampaign(campaign);
    setCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async campaignId => {
    try {
      await api.delete(`/campaigns/${campaignId}`);
      toast.success(i18n.t("campaigns.toasts.deleted"));
      fetchCampaigns(1, "");
    } catch (err) {
      toastError(err);
    }
    setDeletingCampaign(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const cancelCampaign = async campaign => {
    try {
      await api.post(`/campaigns/${campaign.id}/cancel`);
      toast.success(i18n.t("campaigns.toasts.cancel"));
      setPageNumber(1);
      fetchCampaigns(1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const restartCampaign = async campaign => {
    try {
      await api.post(`/campaigns/${campaign.id}/restart`);
      toast.success(i18n.t("campaigns.toasts.restart"));
      setPageNumber(1);
      fetchCampaigns(1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <MainContainer className="sd-business sd-campaigns">
      <ConfirmationModal
        title={
          deletingCampaign &&
          `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${
            deletingCampaign.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingCampaign.id)}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <CampaignModal
        resetPagination={() => {
          setPageNumber(1);
          fetchCampaigns(1);
        }}
        open={campaignModalOpen}
        onClose={handleCloseCampaignModal}
        aria-labelledby="form-dialog-title"
        campaignId={selectedCampaign && selectedCampaign.id}
      />
      <MainHeader>
        <CabecalhoPagina
          titulo={i18n.t("visual.campanhas")}
          descricao={i18n.t("visual.campanhasDescricao")}
        />
        <div className="ew-ui" style={identidade}>
          <Botao variante="primary" onClick={handleOpenCampaignModal}>
            <Rocket size={16} />
            {i18n.t("visual.novoEnvio")}
          </Botao>
        </div>
      </MainHeader>
      <NavegacaoEnvios />
      <div className="campanhas-conteudo ew-ui" style={identidade}>
        <IndicadoresCampanhas campanhas={campaigns} />
        <TabelaCampanhas
          campanhas={campaigns}
          carregando={loading}
          pagina={pageNumber}
          total={total}
          proxima={hasMore}
          aoPaginar={setPageNumber}
          editar={handleEditCampaign}
          excluir={campanha => {
            setDeletingCampaign(campanha);
            setConfirmModalOpen(true);
          }}
          pausar={cancelCampaign}
          retomar={restartCampaign}
          relatorio={campanha =>
            history.push(`/campaign/${campanha.id}/report`)
          }
          ferramentas={
            <>
              <label className="tabela-busca">
                <Search size={16} />
                <input
                  type="search"
                  aria-label={i18n.t("campaigns.searchPlaceholder")}
                  placeholder={i18n.t("campaigns.searchPlaceholder")}
                  value={searchParam}
                  onChange={handleSearch}
                />
              </label>
              <BotaoIcone
                titulo={i18n.t("visual.atualizar")}
                onClick={() => fetchCampaigns()}
                disabled={loading}
              >
                <RefreshCw size={16} />
              </BotaoIcone>
            </>
          }
        />
      </div>
    </MainContainer>
  );
};
export default Campaigns;
