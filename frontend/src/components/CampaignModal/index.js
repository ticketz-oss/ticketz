import React, { useState, useEffect, useMemo, useRef, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { head } from "lodash";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";

import { i18n } from "../../translate/i18n";
import moment from "moment";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs
} from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import ConfirmationModal from "../ConfirmationModal";
import VariablePicker from "../VariablePicker";
import insertTextAtCursor from "../../helpers/insertTextAtCursor";
import { buildCampaignVariableCatalog } from "../../helpers/variableCatalog";

const getCampaignSettingVariables = settings => {
  const variablesSetting = Array.isArray(settings)
    ? settings.find(setting => setting.key === "variables")
    : null;

  if (!variablesSetting?.value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(variablesSetting.value);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },

  textField: {
    marginRight: theme.spacing(1),
    flex: 1
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  btnWrapper: {
    position: "relative"
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  },
  variableToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1)
  },
  variableHint: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize
  }
}));

const CampaignSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required")
});

const CampaignModal = ({
  open,
  onClose,
  campaignId,
  initialValues,
  onSave,
  resetPagination
}) => {
  const classes = useStyles();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);
  const { companyId } = user;

  const initialState = {
    name: "",
    message1: "",
    message2: "",
    message3: "",
    message4: "",
    message5: "",
    confirmationMessage1: "",
    confirmationMessage2: "",
    confirmationMessage3: "",
    confirmationMessage4: "",
    confirmationMessage5: "",
    status: "INATIVA", // INATIVA, PROGRAMADA, EM_ANDAMENTO, CANCELADA, FINALIZADA,
    confirmation: false,
    scheduledAt: "",
    whatsappId: "",
    contactListId: "",
    companyId
  };

  const [campaign, setCampaign] = useState(initialState);
  const [whatsapps, setWhatsapps] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [messageTab, setMessageTab] = useState(0);
  const [attachment, setAttachment] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [campaignEditable, setCampaignEditable] = useState(true);
  const [campaignSettingsVariables, setCampaignSettingsVariables] = useState([]);
  const [contactExtraFieldNames, setContactExtraFieldNames] = useState([]);
  const attachmentFile = useRef(null);
  const messageInputRefs = useRef({});
  const campaignVariableCatalog = useMemo(() => {
    return buildCampaignVariableCatalog(
      campaignSettingsVariables,
      contactExtraFieldNames
    );
  }, [campaignSettingsVariables, contactExtraFieldNames]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      if (initialValues) {
        setCampaign(prevState => {
          return { ...prevState, ...initialValues };
        });
      }

      api
        .get(`/contact-lists/list`, { params: { companyId } })
        .then(({ data }) => setContactLists(data));

      api
        .get(`/whatsapp`, { params: { companyId, session: 0 } })
        .then(({ data }) => setWhatsapps(data));

      api
        .get("/campaign-settings")
        .then(({ data }) =>
          setCampaignSettingsVariables(getCampaignSettingVariables(data))
        );

      api
        .get("/contacts/extra-fields")
        .then(({ data }) =>
          setContactExtraFieldNames(Array.isArray(data) ? data : [])
        )
        .catch(() => setContactExtraFieldNames([]));

      if (!campaignId) return;

      api.get(`/campaigns/${campaignId}`).then(({ data }) => {
        setCampaign(prev => {
          let prevCampaignData = Object.assign({}, prev);

          Object.entries(data.campaign).forEach(([key, value]) => {
            if (key === "scheduledAt" && value !== "" && value !== null) {
              prevCampaignData[key] = moment(value).format("YYYY-MM-DDTHH:mm");
            } else {
              prevCampaignData[key] = value === null ? "" : value;
            }
          });

          return prevCampaignData;
        });
      });
    }
  }, [campaignId, open, initialValues, companyId]);

  useEffect(() => {
    const now = moment();
    const scheduledAt = moment(campaign.scheduledAt);
    const moreThenAnHour =
      !Number.isNaN(scheduledAt.diff(now)) && scheduledAt.diff(now, "hour") > 1;
    const isEditable =
      campaign.status === "INATIVA" ||
      (campaign.status === "PROGRAMADA" && moreThenAnHour);

    setCampaignEditable(isEditable);
  }, [campaign.status, campaign.scheduledAt]);

  const handleClose = () => {
    onClose();
    setCampaign(initialState);
  };

  const handleAttachmentFile = e => {
    const file = head(e.target.files);
    if (file) {
      setAttachment(file);
    }
  };

  const handleSaveCampaign = async values => {
    try {
      const dataValues = {};
      Object.entries(values).forEach(([key, value]) => {
        if (key === "scheduledAt" && value !== "" && value !== null) {
          dataValues[key] = moment(value).format("YYYY-MM-DD HH:mm:ss");
        } else {
          dataValues[key] = value === "" ? null : value;
        }
      });

      if (campaignId) {
        await api.put(`/campaigns/${campaignId}`, dataValues);

        if (attachment != null) {
          const formData = new FormData();
          formData.append("file", attachment);
          await api.post(`/campaigns/${campaignId}/media-upload`, formData);
        }
        handleClose();
      } else {
        const { data } = await api.post("/campaigns", dataValues);

        if (attachment != null) {
          const formData = new FormData();
          formData.append("file", attachment);
          await api.post(`/campaigns/${data.id}/media-upload`, formData);
        }
        if (onSave) {
          onSave(data);
        }
        handleClose();
      }
      toast.success(i18n.t("campaigns.toasts.success"));
    } catch (err) {
      console.log(err);
      toastError(err);
    }
  };

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      attachmentFile.current.value = null;
    }

    if (campaign.mediaPath) {
      await api.delete(`/campaigns/${campaign.id}/media-upload`);
      setCampaign(prev => ({ ...prev, mediaPath: null, mediaName: null }));
      toast.success(i18n.t("campaigns.toasts.deleted"));
    }
  };

  const handleInsertVariable = (identifier, token, fieldValue, setFieldValue) => {
    const { nextValue, nextSelectionStart, nextSelectionEnd } =
      insertTextAtCursor(fieldValue, token, messageInputRefs.current[identifier]);

    setFieldValue(identifier, nextValue);

    requestAnimationFrame(() => {
      const input = messageInputRefs.current[identifier];

      if (!input) {
        return;
      }

      input.focus();

      if (typeof input.setSelectionRange === "function") {
        input.setSelectionRange(nextSelectionStart, nextSelectionEnd);
      }
    });
  };

  const renderVariableToolbar = (identifier, values, setFieldValue) => {
    return (
      <div className={classes.variableToolbar}>
        <VariablePicker
          items={campaignVariableCatalog}
          onSelectVariable={token =>
            handleInsertVariable(
              identifier,
              token,
              values[identifier],
              setFieldValue
            )
          }
          buttonLabel="{ }"
          buttonAriaLabel={i18n.t("settings.mustacheVariables.title")}
          menuTitle={i18n.t("settings.mustacheVariables.title")}
        />
        <span className={classes.variableHint}>
          {i18n.t("settings.mustacheVariables.title")}{" "}
          {campaignVariableCatalog.map(variable => variable.token).join(" ")}
        </span>
      </div>
    );
  };

  const renderMessageField = ({
    identifier,
    touched,
    errors,
    handleBlur,
    setFieldValue,
    values
  }) => {
    return (
      <>
        <TextField
          id={identifier}
          name={identifier}
          spellCheck={true}
          fullWidth
          rows={5}
          label={i18n.t(`campaigns.dialog.form.${identifier}`)}
          placeholder={i18n.t("campaigns.dialog.form.messagePlaceholder")}
          multiline={true}
          variant="outlined"
          value={values[identifier] || ""}
          onChange={event => setFieldValue(identifier, event.target.value)}
          onBlur={handleBlur}
          error={touched[identifier] && Boolean(errors[identifier])}
          helperText={touched[identifier] && errors[identifier]}
          disabled={!campaignEditable && campaign.status !== "CANCELADA"}
          inputRef={input => {
            messageInputRefs.current[identifier] = input;
          }}
        />
        {renderVariableToolbar(identifier, values, setFieldValue)}
      </>
    );
  };

  const renderConfirmationMessageField = ({
    identifier,
    touched,
    errors,
    handleBlur,
    setFieldValue,
    values
  }) => {
    return (
      <>
        <TextField
          id={identifier}
          name={identifier}
          spellCheck={true}
          fullWidth
          rows={5}
          label={i18n.t(`campaigns.dialog.form.${identifier}`)}
          placeholder={i18n.t("campaigns.dialog.form.messagePlaceholder")}
          multiline={true}
          variant="outlined"
          value={values[identifier] || ""}
          onChange={event => setFieldValue(identifier, event.target.value)}
          onBlur={handleBlur}
          error={touched[identifier] && Boolean(errors[identifier])}
          helperText={touched[identifier] && errors[identifier]}
          disabled={!campaignEditable && campaign.status !== "CANCELADA"}
          inputRef={input => {
            messageInputRefs.current[identifier] = input;
          }}
        />
        {renderVariableToolbar(identifier, values, setFieldValue)}
      </>
    );
  };

  const cancelCampaign = async () => {
    try {
      await api.post(`/campaigns/${campaign.id}/cancel`);
      toast.success(i18n.t("campaigns.toasts.cancel"));
      setCampaign(prev => ({ ...prev, status: "CANCELADA" }));
      resetPagination();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const restartCampaign = async () => {
    try {
      await api.post(`/campaigns/${campaign.id}/restart`);
      toast.success(i18n.t("campaigns.toasts.restart"));
      setCampaign(prev => ({ ...prev, status: "EM_ANDAMENTO" }));
      resetPagination();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className={classes.root}>
      <ConfirmationModal
        title={i18n.t("campaigns.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={deleteMedia}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {campaignEditable ? (
            <>
              {campaignId
                ? `${i18n.t("campaigns.dialog.update")}`
                : `${i18n.t("campaigns.dialog.new")}`}
            </>
          ) : (
            <>{`${i18n.t("campaigns.dialog.readonly")}`}</>
          )}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input
            type="file"
            ref={attachmentFile}
            onChange={e => handleAttachmentFile(e)}
          />
        </div>
        <Formik
          initialValues={campaign}
          enableReinitialize={true}
          validationSchema={CampaignSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveCampaign(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            isSubmitting,
            setFieldValue
          }) => (
            <Form>
              <DialogContent dividers>
                <Grid spacing={2} container>
                  <Grid xs={12} md={9} item>
                    <Field
                      as={TextField}
                      label={i18n.t("campaigns.dialog.form.name")}
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      className={classes.textField}
                      disabled={!campaignEditable}
                    />
                  </Grid>
                  <Grid xs={12} md={3} item>
                    <FormControl
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      className={classes.formControl}
                    >
                      <InputLabel id="confirmation-selection-label">
                        {i18n.t("campaigns.dialog.form.confirmation")}
                      </InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("campaigns.dialog.form.confirmation")}
                        placeholder={i18n.t(
                          "campaigns.dialog.form.confirmation"
                        )}
                        labelId="confirmation-selection-label"
                        id="confirmation"
                        name="confirmation"
                        error={
                          touched.confirmation && Boolean(errors.confirmation)
                        }
                        disabled={!campaignEditable}
                      >
                        <MenuItem value={false}>Desabilitada</MenuItem>
                        <MenuItem value={true}>Habilitada</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={4} item>
                    <FormControl
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      className={classes.formControl}
                    >
                      <InputLabel id="contactList-selection-label">
                        {i18n.t("campaigns.dialog.form.contactList")}
                      </InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("campaigns.dialog.form.contactList")}
                        placeholder={i18n.t(
                          "campaigns.dialog.form.contactList"
                        )}
                        labelId="contactList-selection-label"
                        id="contactListId"
                        name="contactListId"
                        error={
                          touched.contactListId && Boolean(errors.contactListId)
                        }
                        disabled={!campaignEditable}
                      >
                        <MenuItem value="">Nenhuma</MenuItem>
                        {contactLists &&
                          contactLists.map(contactList => (
                            <MenuItem
                              key={contactList.id}
                              value={contactList.id}
                            >
                              {contactList.name}
                            </MenuItem>
                          ))}
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={4} item>
                    <FormControl
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      className={classes.formControl}
                    >
                      <InputLabel id="whatsapp-selection-label">
                        {i18n.t("campaigns.dialog.form.whatsapp")}
                      </InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("campaigns.dialog.form.whatsapp")}
                        placeholder={i18n.t("campaigns.dialog.form.whatsapp")}
                        labelId="whatsapp-selection-label"
                        id="whatsappId"
                        name="whatsappId"
                        error={touched.whatsappId && Boolean(errors.whatsappId)}
                        disabled={!campaignEditable}
                      >
                        <MenuItem value="">Nenhuma</MenuItem>
                        {whatsapps &&
                          whatsapps.map(whatsapp => (
                            <MenuItem key={whatsapp.id} value={whatsapp.id}>
                              {whatsapp.name}
                            </MenuItem>
                          ))}
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={4} item>
                    <Field
                      as={TextField}
                      label={i18n.t("campaigns.dialog.form.scheduledAt")}
                      name="scheduledAt"
                      error={touched.scheduledAt && Boolean(errors.scheduledAt)}
                      helperText={touched.scheduledAt && errors.scheduledAt}
                      variant="outlined"
                      margin="dense"
                      type="datetime-local"
                      InputLabelProps={{
                        shrink: true
                      }}
                      fullWidth
                      className={classes.textField}
                      disabled={!campaignEditable}
                    />
                  </Grid>
                  <Grid xs={12} item>
                    <Tabs
                      value={messageTab}
                      indicatorColor="primary"
                      textColor="primary"
                      onChange={(e, v) => setMessageTab(v)}
                      variant="fullWidth"
                      centered
                    >
                      <Tab label="Msg. 1" index={0} />
                      <Tab label="Msg. 2" index={1} />
                      <Tab label="Msg. 3" index={2} />
                      <Tab label="Msg. 4" index={3} />
                      <Tab label="Msg. 5" index={4} />
                    </Tabs>
                    <Box style={{ paddingTop: 20, border: "none" }}>
                      {messageTab === 0 && (
                        <>
                          {values.confirmation ? (
                            <Grid spacing={2} container>
                              <Grid xs={12} md={8} item>
                                <>
                                  {renderMessageField({
                                    identifier: "message1",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                              <Grid xs={12} md={4} item>
                                <>
                                  {renderConfirmationMessageField({
                                    identifier: "confirmationMessage1",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                            </Grid>
                          ) : (
                            <>
                              {renderMessageField({
                                identifier: "message1",
                                touched,
                                errors,
                                handleBlur,
                                setFieldValue,
                                values
                              })}
                            </>
                          )}
                        </>
                      )}
                      {messageTab === 1 && (
                        <>
                          {values.confirmation ? (
                            <Grid spacing={2} container>
                              <Grid xs={12} md={8} item>
                                <>
                                  {renderMessageField({
                                    identifier: "message2",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                              <Grid xs={12} md={4} item>
                                <>
                                  {renderConfirmationMessageField({
                                    identifier: "confirmationMessage2",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                            </Grid>
                          ) : (
                            <>
                              {renderMessageField({
                                identifier: "message2",
                                touched,
                                errors,
                                handleBlur,
                                setFieldValue,
                                values
                              })}
                            </>
                          )}
                        </>
                      )}
                      {messageTab === 2 && (
                        <>
                          {values.confirmation ? (
                            <Grid spacing={2} container>
                              <Grid xs={12} md={8} item>
                                <>
                                  {renderMessageField({
                                    identifier: "message3",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                              <Grid xs={12} md={4} item>
                                <>
                                  {renderConfirmationMessageField({
                                    identifier: "confirmationMessage3",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                            </Grid>
                          ) : (
                            <>
                              {renderMessageField({
                                identifier: "message3",
                                touched,
                                errors,
                                handleBlur,
                                setFieldValue,
                                values
                              })}
                            </>
                          )}
                        </>
                      )}
                      {messageTab === 3 && (
                        <>
                          {values.confirmation ? (
                            <Grid spacing={2} container>
                              <Grid xs={12} md={8} item>
                                <>
                                  {renderMessageField({
                                    identifier: "message4",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                              <Grid xs={12} md={4} item>
                                <>
                                  {renderConfirmationMessageField({
                                    identifier: "confirmationMessage4",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                            </Grid>
                          ) : (
                            <>
                              {renderMessageField({
                                identifier: "message4",
                                touched,
                                errors,
                                handleBlur,
                                setFieldValue,
                                values
                              })}
                            </>
                          )}
                        </>
                      )}
                      {messageTab === 4 && (
                        <>
                          {values.confirmation ? (
                            <Grid spacing={2} container>
                              <Grid xs={12} md={8} item>
                                <>
                                  {renderMessageField({
                                    identifier: "message5",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                              <Grid xs={12} md={4} item>
                                <>
                                  {renderConfirmationMessageField({
                                    identifier: "confirmationMessage5",
                                    touched,
                                    errors,
                                    handleBlur,
                                    setFieldValue,
                                    values
                                  })}
                                </>
                              </Grid>
                            </Grid>
                          ) : (
                            <>
                              {renderMessageField({
                                identifier: "message5",
                                touched,
                                errors,
                                handleBlur,
                                setFieldValue,
                                values
                              })}
                            </>
                          )}
                        </>
                      )}
                    </Box>
                  </Grid>
                  {(campaign.mediaPath || attachment) && (
                    <Grid xs={12} item>
                      <Button startIcon={<AttachFileIcon />}>
                        {attachment != null
                          ? attachment.name
                          : campaign.mediaName}
                      </Button>
                      {campaignEditable && (
                        <IconButton
                          onClick={() => setConfirmationOpen(true)}
                          color="secondary"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                {campaign.status === "CANCELADA" && (
                  <Button
                    color="primary"
                    onClick={() => restartCampaign()}
                    variant="outlined"
                  >
                    {i18n.t("campaigns.dialog.buttons.restart")}
                  </Button>
                )}
                {campaign.status === "EM_ANDAMENTO" && (
                  <Button
                    color="primary"
                    onClick={() => cancelCampaign()}
                    variant="outlined"
                  >
                    {i18n.t("campaigns.dialog.buttons.cancel")}
                  </Button>
                )}
                {!attachment && !campaign.mediaPath && campaignEditable && (
                  <Button
                    color="primary"
                    onClick={() => attachmentFile.current.click()}
                    disabled={isSubmitting}
                    variant="outlined"
                  >
                    {i18n.t("campaigns.dialog.buttons.attach")}
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("campaigns.dialog.buttons.close")}
                </Button>
                {(campaignEditable || campaign.status === "CANCELADA") && (
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                    variant="contained"
                    className={classes.btnWrapper}
                  >
                    {campaignId
                      ? `${i18n.t("campaigns.dialog.buttons.edit")}`
                      : `${i18n.t("campaigns.dialog.buttons.add")}`}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </Button>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default CampaignModal;
