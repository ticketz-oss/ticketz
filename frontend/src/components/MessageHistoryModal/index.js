import React, { useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import {
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  makeStyles,
  CircularProgress
} from "@material-ui/core";

import { parseISO, format } from "date-fns";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  timestamp: {
    minWidth: 250
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120
  }
}));

const MessageHistoryModal = ({ open, onClose, messageId }) => {
  const classes = useStyles();
  const [oldMessages, setOldMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !messageId) {
      return undefined;
    }

    let isMounted = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/messages/${messageId}/history`);
        if (isMounted) {
          setOldMessages(data.oldMessages || []);
        }
      } catch (err) {
        if (isMounted) {
          setOldMessages([]);
          toastError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [open, messageId]);

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby="dialog-title"
    >
      <DialogTitle id="dialog-title">
        {i18n.t("messageHistoryModal.title")}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress size={28} />
          </div>
        ) : (
          <TableContainer>
            <Table aria-label="message-history-table">
              <TableBody>
                {oldMessages.map(oldMessage => (
                  <TableRow key={oldMessage.id}>
                    <TableCell component="th" scope="row">
                      {oldMessage.body}
                    </TableCell>
                    <TableCell align="right" className={classes.timestamp}>
                      {format(parseISO(oldMessage.createdAt), "dd/MM HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={() => onClose(false)}>
          {i18n.t("messageHistoryModal.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageHistoryModal;
