import React, { useEffect, useState, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { DeleteOutline, Edit, ArrowBack } from "@material-ui/icons";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import QueueIntegrationModal from "../../components/QueueIntegrationModal";
import QueueIntegrationService from "../../services/QueueIntegrationService";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tableCell: {
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statusBadge: {
    borderRadius: 8,
    padding: theme.spacing(0.5, 1),
    fontSize: "0.75rem",
    color: "white",
    fontWeight: "bold",
  },
  active: {
    backgroundColor: theme.palette.success.main,
  },
  inactive: {
    backgroundColor: theme.palette.error.main,
  },
}));

const QueueIntegrations = () => {
  const classes = useStyles();
  const { queueId } = useParams();
  const history = useHistory();
  const socketManager = useContext(SocketContext);

  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [queueName, setQueueName] = useState("");

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const data = await QueueIntegrationService.findByQueue(queueId);
      setIntegrations(data);

      // Fetch queue details to display queue name
      const { data: queueData } = await api.get(`/queue/${queueId}`);
      setQueueName(queueData.name);

      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [queueId]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onQueueIntegration = (data) => {
      if (data.action === "update" || data.action === "create") {
        fetchIntegrations();
      }

      if (data.action === "delete") {
        setIntegrations((prevState) => 
          prevState.filter((integration) => integration.id !== data.id)
        );
      }
    };

    socket.on(`company-${companyId}-queueIntegration`, onQueueIntegration);

    return () => {
      socket.off(`company-${companyId}-queueIntegration`, onQueueIntegration);
    };
  }, [socketManager, queueId]);

  const handleOpenIntegrationModal = () => {
    setIntegrationModalOpen(true);
    setSelectedIntegration(null);
  };

  const handleCloseIntegrationModal = () => {
    setIntegrationModalOpen(false);
    setSelectedIntegration(null);
  };

  const handleEditIntegration = (integration) => {
    setSelectedIntegration(integration);
    setIntegrationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedIntegration(null);
  };

  const handleDeleteIntegration = async (integrationId) => {
    try {
      await QueueIntegrationService.delete(integrationId);
      toast.success(i18n.t("queueIntegration.toasts.deleted"));
      fetchIntegrations();
    } catch (err) {
      toastError(err);
    }
    setSelectedIntegration(null);
    setConfirmModalOpen(false);
  };

  const handleBackToQueues = () => {
    history.push("/queues");
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          selectedIntegration &&
          `${i18n.t("queueIntegration.confirmationModal.deleteTitle")} ${
            selectedIntegration.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteIntegration(selectedIntegration.id)}
      >
        {i18n.t("queueIntegration.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <QueueIntegrationModal
        open={integrationModalOpen}
        onClose={handleCloseIntegrationModal}
        queueId={queueId}
        integrationId={selectedIntegration?.id}
        reload={fetchIntegrations}
      />
      <MainHeader>
        <Button
          color="primary"
          size="small"
          onClick={handleBackToQueues}
          startIcon={<ArrowBack />}
          style={{ marginRight: 8 }}
        >
          {i18n.t("queueIntegration.buttons.back")}
        </Button>
        <Title>
          {i18n.t("queueIntegration.title")}
          {queueName && ` - ${queueName}`}
        </Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenIntegrationModal}
          >
            {i18n.t("queueIntegration.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">
                {i18n.t("queueIntegration.table.name")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("queueIntegration.table.provider")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("queueIntegration.table.status")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("queueIntegration.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell align="center">{integration.name}</TableCell>
                  <TableCell align="center">{integration.provider}</TableCell>
                  <TableCell align="center">
                    <div className={classes.customTableCell}>
                      <Typography
                        component="span"
                        className={`${classes.statusBadge} ${
                          integration.active ? classes.active : classes.inactive
                        }`}
                      >
                        {integration.active
                          ? i18n.t("queueIntegration.table.active")
                          : i18n.t("queueIntegration.table.inactive")}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditIntegration(integration)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setConfirmModalOpen(true);
                      }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
              {!loading && integrations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography>
                      {i18n.t("queueIntegration.table.noIntegrations")}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default QueueIntegrations;
