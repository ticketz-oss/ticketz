import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback
} from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import {
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Box,
  Fab,
  ButtonGroup,
  CircularProgress
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import SettingsIcon from "@material-ui/icons/Settings";
import FilterListIcon from "@material-ui/icons/FilterList";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import CampaignCard from "../../components/CampaignCard";
import ContactListCard from "../../components/ContactListCard";
import CampaignModal from "../../components/CampaignModal";
import CampaignConfigModal from "../../components/CampaignConfigModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import ContactListDialog from "../../components/ContactListDialog";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  sectionTitle: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    fontWeight: 600
  },
  fabButton: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000
  },
  headerActions: {
    display: "flex",
    gap: theme.spacing(1),
    alignItems: "center"
  },
  filterButton: {
    marginRight: theme.spacing(1)
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary
  },
  viewToggle: {
    marginBottom: theme.spacing(2)
  },
  viewToggleButton: {
    textTransform: "none",
    fontWeight: 600,
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        backgroundColor: theme.palette.primary.dark
      }
    }
  }
}));

const CampaignDashboard = () => {
  const classes = useStyles();
  const history = useHistory();
  const isMounted = useRef(true);

  const [campaigns, setCampaigns] = useState([]);
  const [campaignProgress, setCampaignProgress] = useState({});
  const [contactLists, setContactLists] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [viewMode, setViewMode] = useState("campaigns");
  const [campaignPage, setCampaignPage] = useState(1);
  const [contactListPage, setContactListPage] = useState(1);
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(false);
  const [hasMoreContactLists, setHasMoreContactLists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [contactListDialogOpen, setContactListDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedContactList, setSelectedContactList] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [deletingContactList, setDeletingContactList] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null);

  const socketManager = useContext(SocketContext);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/campaigns/", {
        params: {
          searchParam,
          pageNumber: campaignPage,
          showAll: showAll ? "true" : "false"
        }
      });
      if (campaignPage === 1) {
        setCampaigns(data.records || []);
      } else {
        setCampaigns(prev => [...prev, ...(data.records || [])]);
      }
      setHasMoreCampaigns(data.hasMore);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  }, [searchParam, campaignPage, showAll]);

  const fetchContactLists = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contact-lists/", {
        params: { searchParam, pageNumber: contactListPage }
      });
      if (contactListPage === 1) {
        setContactLists(Array.isArray(data.records) ? data.records : []);
      } else {
        setContactLists(prev => [
          ...prev,
          ...(Array.isArray(data.records) ? data.records : [])
        ]);
      }
      setHasMoreContactLists(data.hasMore);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  }, [searchParam, contactListPage]);

  const loadMoreCampaigns = useCallback(() => {
    if (hasMoreCampaigns && !loading) {
      setCampaignPage(prev => prev + 1);
    }
  }, [hasMoreCampaigns, loading]);

  const loadMoreContactLists = useCallback(() => {
    if (hasMoreContactLists && !loading) {
      setContactListPage(prev => prev + 1);
    }
  }, [hasMoreContactLists, loading]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const checkAndLoadMore = () => {
      const mainPaper = document.querySelector(`.${classes.mainPaper}`);
      if (!mainPaper) return;

      const { scrollHeight, clientHeight } = mainPaper;
      if (scrollHeight <= clientHeight) {
        if (viewMode === "campaigns" && hasMoreCampaigns) {
          loadMoreCampaigns();
        } else if (viewMode === "contactLists" && hasMoreContactLists) {
          loadMoreContactLists();
        }
      }
    };

    const timer = setTimeout(checkAndLoadMore, 300);
    return () => clearTimeout(timer);
  }, [
    campaigns,
    contactLists,
    loading,
    viewMode,
    hasMoreCampaigns,
    hasMoreContactLists,
    classes.mainPaper,
    loadMoreCampaigns,
    loadMoreContactLists
  ]);

  useEffect(() => {
    setCampaignPage(1);
    setContactListPage(1);
    setCampaigns([]);
    setContactLists([]);
  }, [searchParam, showAll]);

  useEffect(() => {
    if (viewMode === "campaigns") {
      fetchCampaigns();
    } else {
      fetchContactLists();
    }
  }, [
    viewMode,
    campaignPage,
    contactListPage,
    showAll,
    searchParam,
    fetchCampaigns,
    fetchContactLists
  ]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCampaignUpdate = data => {
      if (data.action === "update" || data.action === "create") {
        setCampaignPage(1);
        fetchCampaigns();
      }
      if (data.action === "delete") {
        setCampaigns(prev => prev.filter(c => c.id !== +data.id));
      }
    };

    const onCampaignProgress = data => {
      if (data.campaign?.id) {
        setCampaignProgress(prev => ({
          ...prev,
          [data.campaign.id]: {
            validContacts: data.valids,
            delivered: data.delivered,
            confirmationRequested: data.confirmationRequested,
            confirmed: data.confirmed
          }
        }));
      }
    };

    const onContactListUpdate = data => {
      if (data.action === "update" || data.action === "create") {
        setContactListPage(1);
        setContactLists([]);
      }
      if (data.action === "delete") {
        setContactLists(prev => prev.filter(c => c.id !== +data.id));
      }
    };

    socket.on(`company-${companyId}-campaign`, onCampaignUpdate);
    socket.on(`company-${companyId}-campaign`, onCampaignProgress);
    socket.on(`company-${companyId}-contactList`, onContactListUpdate);

    return () => {
      socket.off(`company-${companyId}-campaign`, onCampaignUpdate);
      socket.off(`company-${companyId}-campaign`, onCampaignProgress);
      socket.off(`company-${companyId}-contactList`, onContactListUpdate);
    };
  }, [socketManager, fetchCampaigns, fetchContactLists]);

  const handleScroll = e => {
    if (loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      if (viewMode === "campaigns") {
        loadMoreCampaigns();
      } else {
        loadMoreContactLists();
      }
    }
  };

  const fetchCampaignProgress = async campaignId => {
    try {
      const { data } = await api.get(`/campaigns/${campaignId}`);
      setCampaignProgress(prev => ({
        ...prev,
        [campaignId]: {
          validContacts: data.valids,
          delivered: data.delivered,
          confirmationRequested: data.confirmationRequested,
          confirmed: data.confirmed
        }
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    campaigns.forEach(campaign => {
      if (
        campaign.status === "EM_ANDAMENTO" ||
        campaign.status === "FINALIZADA"
      ) {
        fetchCampaignProgress(campaign.id);
      }
    });
  }, [campaigns]);

  const handleOpenCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(true);
  };

  const handleCloseCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(false);
    fetchCampaigns();
  };

  const handleEditCampaign = campaign => {
    setSelectedCampaign(campaign);
    setCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async () => {
    try {
      await api.delete(`/campaigns/${deletingCampaign.id}`);
      toast.success(i18n.t("campaigns.toasts.deleted"));
      fetchCampaigns();
    } catch (err) {
      toastError(err);
    }
    setDeletingCampaign(null);
    setConfirmModalOpen(false);
  };

  const handleDeleteContactList = async () => {
    try {
      await api.delete(`/contact-lists/${deletingContactList.id}`);
      toast.success(i18n.t("campaigns.toasts.deleted"));
      setContactListPage(1);
      setContactLists([]);
    } catch (err) {
      toastError(err);
    }
    setDeletingContactList(null);
    setConfirmModalOpen(false);
  };

  const cancelCampaign = async campaign => {
    try {
      await api.post(`/campaigns/${campaign.id}/cancel`);
      toast.success(i18n.t("campaigns.toasts.cancel"));
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const restartCampaign = async campaign => {
    try {
      await api.post(`/campaigns/${campaign.id}/restart`);
      toast.success(i18n.t("campaigns.toasts.restart"));
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenContactListDialog = contactList => {
    setSelectedContactList(contactList);
    setContactListDialogOpen(true);
  };

  const handleCloseContactListDialog = () => {
    setSelectedContactList(null);
    setContactListDialogOpen(false);
    setContactListPage(1);
    setContactLists([]);
  };

  const handleViewContactListContacts = contactList => {
    history.push(`/contact-lists/${contactList.id}/contacts`);
  };

  const confirmDelete = (item, type) => {
    if (type === "campaign") {
      setDeletingCampaign(item);
    } else {
      setDeletingContactList(item);
    }
    setConfirmType(type);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmType === "campaign") {
      handleDeleteCampaign();
    } else {
      handleDeleteContactList();
    }
  };

  const filteredCampaigns = showAll
    ? campaigns
    : campaigns.filter(c => {
        if (c.status === "PROGRAMADA" || c.status === "EM_ANDAMENTO") {
          return true;
        }
        if (c.status === "FINALIZADA" && c.completedAt) {
          const completedDate = new Date(c.completedAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return completedDate >= sevenDaysAgo;
        }
        return false;
      });

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          confirmType === "campaign"
            ? `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${
                deletingCampaign?.name
              }?`
            : `Excluir lista ${deletingContactList?.name}?`
        }
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <CampaignModal
        resetPagination={fetchCampaigns}
        open={campaignModalOpen}
        onClose={handleCloseCampaignModal}
        campaignId={selectedCampaign?.id}
      />

      <CampaignConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />

      <ContactListDialog
        open={contactListDialogOpen}
        onClose={handleCloseContactListDialog}
        contactListId={selectedContactList?.id}
      />

      <MainHeader>
        <Grid style={{ width: "99.6%" }} container>
          <Grid xs={12} sm={8} item>
            <Title>Dashboard de Campanhas</Title>
          </Grid>
          <Grid xs={12} sm={4} item>
            <Box className={classes.headerActions}>
              <TextField
                fullWidth
                placeholder={
                  viewMode === "campaigns"
                    ? "Buscar campanhas..."
                    : "Buscar listas..."
                }
                type="search"
                value={searchParam}
                onChange={e => setSearchParam(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: "gray" }} />
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setConfigModalOpen(true)}
                title="Configurações"
              >
                <SettingsIcon />
              </Button>
            </Box>
          </Grid>
        </Grid>
      </MainHeader>

      <Box className={classes.mainPaper} onScroll={handleScroll}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <ButtonGroup
            color="primary"
            variant="outlined"
            className={classes.viewToggle}
          >
            <Button
              className={classes.viewToggleButton}
              onClick={() => setViewMode("campaigns")}
              variant={viewMode === "campaigns" ? "contained" : "outlined"}
            >
              Campanhas
            </Button>
            <Button
              className={classes.viewToggleButton}
              onClick={() => setViewMode("contactLists")}
              variant={viewMode === "contactLists" ? "contained" : "outlined"}
            >
              Listas de Contatos
            </Button>
          </ButtonGroup>
          {viewMode === "campaigns" && (
            <Button
              onClick={() => setShowAll(!showAll)}
              color="primary"
              startIcon={<FilterListIcon />}
            >
              {showAll ? "Mostrar Ativas" : "Mostrar Todas"}
            </Button>
          )}
        </Box>

        {viewMode === "campaigns" ? (
          <>
            {filteredCampaigns.length === 0 ? (
              <Box className={classes.emptyState}>
                <Typography variant="body1">
                  Nenhuma campanha encontrada
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredCampaigns.map(campaign => {
                  const progress = campaignProgress[campaign.id] || {};
                  return (
                    <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                      <CampaignCard
                        campaign={campaign}
                        validContacts={progress.validContacts || 0}
                        delivered={progress.delivered || 0}
                        confirmationRequested={
                          progress.confirmationRequested || 0
                        }
                        confirmed={progress.confirmed || 0}
                        onView={() => handleEditCampaign(campaign)}
                        onEdit={() => handleEditCampaign(campaign)}
                        onCancel={() => cancelCampaign(campaign)}
                        onRestart={() => restartCampaign(campaign)}
                        onDelete={() => confirmDelete(campaign, "campaign")}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
            {loading && (
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress />
              </Box>
            )}
          </>
        ) : (
          <>
            {contactLists.length === 0 ? (
              <Box className={classes.emptyState}>
                <Typography variant="body1">
                  Nenhuma lista de contatos encontrada
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {contactLists.map(contactList => (
                  <Grid item xs={12} sm={6} md={4} key={contactList.id}>
                    <ContactListCard
                      contactList={contactList}
                      onEdit={() => handleOpenContactListDialog(contactList)}
                      onDelete={() => confirmDelete(contactList, "contactList")}
                      onViewContacts={() =>
                        handleViewContactListContacts(contactList)
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
            {loading && (
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress />
              </Box>
            )}
          </>
        )}
      </Box>

      <Fab
        color="primary"
        aria-label={
          viewMode === "campaigns" ? "add campaign" : "add contact list"
        }
        className={classes.fabButton}
        onClick={
          viewMode === "campaigns"
            ? handleOpenCampaignModal
            : () => handleOpenContactListDialog(null)
        }
      >
        <AddIcon />
      </Fab>
    </MainContainer>
  );
};

export default CampaignDashboard;
