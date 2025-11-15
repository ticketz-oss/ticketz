import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import { i18n } from "../translate/i18n";


const IOSInstallInstructionsDialog = ({ open, onClose }) => {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [closeLabel, setCloseLabel] = useState("");

  useEffect(() => {
    if (open) {
      setDescription(i18n.t("pwa.installIosDescription"));
      setTitle(i18n.t("pwa.installIosTitle"));
      setCloseLabel(i18n.t("common.close"));
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="ios-pwa-dialog">
      <DialogTitle id="ios-pwa-dialog">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div" style={{ whiteSpace: 'pre-line' }}>
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {closeLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IOSInstallInstructionsDialog;
