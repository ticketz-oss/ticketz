import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { alpha, makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";
import { FormControlLabel, Switch } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  confirmationProgress: {
    "&.Mui-disabled": {
      backgroundImage: `linear-gradient(${alpha(
        theme.palette.secondary.main,
        0.3
      )}, ${alpha(theme.palette.secondary.main, 0.3)})`,
      backgroundRepeat: "no-repeat",
      transition: "background-size 200ms ease",
      "@media (prefers-reduced-motion: reduce)": {
        transition: "none"
      }
    }
  }
}));

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

const ConfirmationModal = ({
  title,
  children,
  open,
  onClose,
  onConfirm,
  okEnabled = true,
  checkbox,
  confirmationText,
  confirmButtonText
}) => {
  const classes = useStyles();
  const [checked, setChecked] = React.useState(false);
  const [typedConfirmationText, setTypedConfirmationText] = React.useState("");
  const expectedText = confirmationText?.toUpperCase();
  const typedText = typedConfirmationText.toUpperCase();
  const confirmationMatches = typedText === expectedText;
  const confirmationProgress =
    expectedText && expectedText.startsWith(typedText)
      ? (Array.from(typedText).length / Array.from(expectedText).length) * 100
      : 0;
  const confirmDisabled =
    !okEnabled || (confirmationText && !confirmationMatches);
  const confirmationLabelTemplate =
    confirmationText &&
    i18n.t("confirmationModal.typeToConfirm", {
      word: "__CONFIRMATION_WORD__"
    });
  const [confirmationLabelPrefix, confirmationLabelSuffix] =
    confirmationLabelTemplate?.split("__CONFIRMATION_WORD__") || [];

  React.useEffect(() => {
    setTypedConfirmationText("");
  }, [open, confirmationText]);

  const handleClose = () => {
    setTypedConfirmationText("");
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="confirm-dialog">
      <DialogTitle id="confirm-dialog">
        {title || i18n.t("common.confirmation")}
      </DialogTitle>
      <DialogContent dividers>
        {children ? children : i18n.t("common.areyousure")}
        {checkbox && (
          <FormControlLabel
            control={
              <Switch
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                name="confirmSwitch"
                color="primary"
              />
            }
            label={checkbox}
            style={{ marginTop: 16 }}
          />
        )}
        {confirmationText && (
          <TextField
            id="confirmation-text"
            autoFocus
            fullWidth
            label={
              <>
                {confirmationLabelPrefix + '"'}
                <strong>{confirmationText.toUpperCase()}</strong>
                {'"' + confirmationLabelSuffix}
              </>
            }
            value={typedConfirmationText}
            onChange={event => setTypedConfirmationText(event.target.value)}
            inputProps={{
              autoComplete: "off",
              autoCapitalize: "none",
              spellCheck: false
            }}
            style={{ marginTop: 16 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleClose} color="default">
          {i18n.t("confirmationModal.buttons.cancel")}
        </Button>
        <Button
          disabled={confirmDisabled}
          className={
            confirmationText && confirmDisabled
              ? classes.confirmationProgress
              : undefined
          }
          style={
            confirmationText && confirmDisabled
              ? { backgroundSize: `${confirmationProgress}% 100%` }
              : undefined
          }
          variant="contained"
          onClick={() => {
            if (!confirmationText || confirmationMatches) {
              handleClose();
              onConfirm(checked);
            }
          }}
          color="secondary"
        >
          {confirmButtonText || i18n.t("confirmationModal.buttons.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
