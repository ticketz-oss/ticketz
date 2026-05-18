import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Button,
  TextField,
  DialogContent,
  DialogActions,
  Grid
} from "@material-ui/core";
import PropType from "prop-types";
import Dialog from "../Dialog";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { i18n } from "../../translate/i18n";
import { makeStyles } from "@material-ui/core/styles";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { AuthContext } from "../../context/Auth/AuthContext";
import VariablePicker from "../VariablePicker";
import insertTextAtCursor from "../../helpers/insertTextAtCursor";
import { quickMessageVariableCatalog } from "../../helpers/variableCatalog";

import { isNil, isObject, has, get } from "lodash";

const MessageSchema = Yup.object().shape({
  shortcode: Yup.string()
    .min(3, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  message: Yup.string().min(3, "Too Short!").required("Required")
});

const useStyles = makeStyles(theme => ({
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(1),
      width: "350px"
    }
  },
  list: {
    width: "100%",
    maxWidth: "350px",
    maxHeight: "200px",
    backgroundColor: theme.palette.background.paper
  },
  inline: {
    width: "100%"
  },
  variableToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    margin: theme.spacing(0, 1, 1)
  },
  variableHint: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize
  }
}));

function QuickMessageDialog(props) {
  const classes = useStyles();

  const initialMessage = {
    id: null,
    shortcode: "",
    message: ""
  };

  const { modalOpen, saveMessage, editMessage, onClose, messageSelected } =
    props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const messageInputRef = useRef(null);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    verifyAndSetMessage();
    setDialogOpen(modalOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    verifyAndSetMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageSelected]);

  const messageSelectedIsValid = () => {
    return (
      isObject(messageSelected) &&
      has(messageSelected, "id") &&
      !isNil(get(messageSelected, "id"))
    );
  };

  const verifyAndSetMessage = () => {
    if (messageSelectedIsValid()) {
      const { id, message, shortcode } = messageSelected;
      setMessage({ id, message, shortcode });
    } else {
      setMessage(initialMessage);
    }
  };

  const handleClose = () => {
    onClose();
    setLoading(false);
  };

  const handleSave = async values => {
    if (messageSelectedIsValid()) {
      editMessage({
        ...messageSelected,
        ...values,
        userId: user.id
      });
    } else {
      saveMessage({
        ...values,
        userId: user.id
      });
    }
    handleClose();
  };

  const handleInsertVariable = (token, bodyValue, setFieldValue) => {
    const {
      nextValue,
      nextSelectionStart,
      nextSelectionEnd
    } = insertTextAtCursor(bodyValue, token, messageInputRef.current);

    setFieldValue("message", nextValue);

    requestAnimationFrame(() => {
      const input = messageInputRef.current;

      if (!input) {
        return;
      }

      input.focus();

      if (typeof input.setSelectionRange === "function") {
        input.setSelectionRange(nextSelectionStart, nextSelectionEnd);
      }
    });
  };

  return (
    <Dialog
      title="Mensagem Rápida"
      modalOpen={dialogOpen}
      onClose={handleClose}
    >
      <Formik
        initialValues={message}
        enableReinitialize={true}
        validationSchema={MessageSchema}
        onSubmit={(values, actions) => {
          setLoading(true);
          setTimeout(() => {
            handleSave(values);
            actions.setSubmitting(false);
          }, 400);
        }}
      >
        {({ touched, errors, handleBlur, setFieldValue, values }) => (
          <Form>
            <DialogContent className={classes.root} dividers>
              <Grid direction="column" container>
                <Grid item>
                  <Field
                    as={TextField}
                    name="shortcode"
                    label={i18n.t("quickMessages.dialog.shortcode")}
                    error={touched.shortcode && Boolean(errors.shortcode)}
                    helperText={touched.shortcode && errors.shortcode}
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <TextField
                    name="message"
                    rows={6}
                    label={i18n.t("quickMessages.dialog.message")}
                    multiline={true}
                    spellCheck={true}
                    value={values.message}
                    onChange={event =>
                      setFieldValue("message", event.target.value)
                    }
                    onBlur={handleBlur}
                    error={touched.message && Boolean(errors.message)}
                    helperText={touched.message && errors.message}
                    variant="outlined"
                    inputRef={messageInputRef}
                  />
                </Grid>
                <Grid item>
                  <div className={classes.variableToolbar}>
                    <VariablePicker
                      items={quickMessageVariableCatalog}
                      onSelectVariable={token =>
                        handleInsertVariable(token, values.message, setFieldValue)
                      }
                      buttonAriaLabel={i18n.t("settings.mustacheVariables.title")}
                      menuTitle={i18n.t("settings.mustacheVariables.title")}
                    />
                    <span className={classes.variableHint}>
                      {i18n.t("settings.mustacheVariables.title")}{" "}
                      {quickMessageVariableCatalog
                        .map(variable => variable.token)
                        .join(" ")}
                    </span>
                  </div>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Cancelar
              </Button>
              <ButtonWithSpinner
                loading={loading}
                color="primary"
                type="submit"
                variant="contained"
                autoFocus
              >
                Salvar
              </ButtonWithSpinner>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

QuickMessageDialog.propType = {
  modalOpen: PropType.bool,
  onClose: PropType.func
};

export default QuickMessageDialog;
