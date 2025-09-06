import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";

import { i18n } from "../../translate/i18n";
import { FormControlLabel, Switch } from "@material-ui/core";

/** ConfirmationModal
 * @param {string} title - Title of the modal
 * @param {string} children - Content of the modal
 * @param {boolean} open - If the modal is open
 * @param {function} onClose - Function to be called when the modal is closed
 * @param {function} onConfirm - Function to be called when the OK button is clicked
 * @param {boolean} rawChildren - If the children is a raw HTML or React Components
 * @param {boolean} okEnabled - If the OK button is enabled
 * @returns {React.Component}
 * @constructor
 * @example
 * <Confirmation
 *  title="Title"
 *  children="Content"
 *  open={true}
 *  onClose={() => {}}
 *  onConfirm={() => {}}
 *  rawChildren={false}
 *  okEnabled={true}
 * />
 * */

const ConfirmationModal = ({ title, children, open, onClose, onConfirm, rawChildren, okEnabled=true, checkbox }) => {
  const [checked, setChecked] = React.useState(false);

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby="confirm-dialog"
    >
      <DialogTitle id="confirm-dialog">{title}</DialogTitle>
      <DialogContent dividers>
        {rawChildren ? children : <Typography>{children}</Typography>}
        {checkbox && (
          <FormControlLabel
            control={
              <Switch
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                name="confirmSwitch"
                color="primary"
              />
            }
            label={checkbox}
            style={{ marginTop: 16 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => onClose(false)}
          color="default"
        >
          {i18n.t("confirmationModal.buttons.cancel")}
        </Button>
        <Button
          disabled={!okEnabled}
          variant="contained"
          onClick={() => {
            onClose(false);
            onConfirm(checked);
          }}
          color="secondary"
        >
          {i18n.t("confirmationModal.buttons.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
