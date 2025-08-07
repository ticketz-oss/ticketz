import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  FormGroup,
  Typography,
  Tooltip,
  Paper,
  Grid,
  Checkbox,
  Tabs,
  Tab,
  IconButton,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";

import { SelectLanguage } from "../SelectLanguage";

import { DynamicForm } from "../DynamicForm";
import proxyConfigSchema from "./proxyConfigSchema";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faGears } from '@fortawesome/free-solid-svg-icons';
import { Delete } from "@material-ui/icons";
import { generateSecureToken } from "../../helpers/generateSecureToken";
import { copyToClipboard } from "../../helpers/copyToClipboard";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },

  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const SessionSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  const initialState = {
    name: "",
    greetingMessage: "",
    complationMessage: "",
    outOfHoursMessage: "",
    ratingMessage: "",
    transferMessage: "",
    isDefault: false,
    token: "",
    provider: "beta",
    language: localStorage.getItem("language") || "",
    restrictToQueues: false,
    transferToNewTicket: false,
    extraParameters: {
      hubToken: "",
      hubChannel: "",
      hubWhatsappTemplate: "",
    }
  };
  const [whatsApp, setWhatsApp] = useState(initialState);
  const [settings, setSettings] = useState({});
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [proxyConfigData, setProxyConfigData] = useState({});

  useEffect(() => {
    setTabIndex(0);
  }, [open]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`whatsapp/${whatsAppId}?session=0`);
        
        if (data.proxyConfig) {
          setProxyConfigData(data.proxyConfig);
        } else {
          setProxyConfigData({});
        }
        setWhatsApp(data);

        const whatsQueueIds = data.queues?.map((queue) => queue.id);
        setSelectedQueueIds(whatsQueueIds);
      } catch (err) {
        toastError(err);
      }
      
      try {
        const { data } = await api.get("/settings");
        const settingsObject = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings(settingsObject);
      } catch (err) {
        toastError(err);
      }
      
    };
    fetchSession();
  }, [whatsAppId]);

  const handleSaveWhatsApp = async (values) => {
    const whatsappData = { ...values, queueIds: selectedQueueIds };
    delete whatsappData["queues"];
    delete whatsappData["proxyConfig"];
    
    if (
      whatsappData.extraParameters?.hubToken ||
      whatsappData.extraParameters?.hubChannel
    ) {
      whatsappData.channel = "notificamehub";
    }
    
    whatsappData.proxyConfig = proxyConfigData;
      
    try {
      if (whatsAppId) {
        await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
      } else {
        await api.post("/whatsapp", whatsappData);
      }
      toast.success(i18n.t("whatsappModal.success"));
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
  };

  async function handleCopy(value) {
    copyToClipboard(value);
    toast.success("Value copied to clipboard");
  }

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {whatsAppId
            ? i18n.t("whatsappModal.title.edit")
            : i18n.t("whatsappModal.title.add")}
        </DialogTitle>
        <Formik
          initialValues={whatsApp}
          enableReinitialize={true}
          validationSchema={SessionSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveWhatsApp(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ values, setFieldValue, touched, errors, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
              <div className={classes.multFieldLine}>
                <Grid spacing={2} container>
                  <Grid item>
                    <Field
                      as={TextField}
                      label={i18n.t("whatsappModal.form.name")}
                      autoFocus
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      className={classes.textField}
                    />
                  </Grid>
                  <Grid style={{ paddingTop: 15 }} item>
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          color="primary"
                          name="isDefault"
                          checked={values.isDefault}
                        />
                      }
                      label={i18n.t("whatsappModal.form.default")}
                    />
                  </Grid>
                </Grid>
              </div>
              <Tabs value={tabIndex} onChange={(e, tab) => {setTabIndex(tab);}}>
                <Tab label={i18n.t("whatsappModal.tab.general")} />
                <Tab label={i18n.t("whatsappModal.tab.messages")} />
                <Tab label={i18n.t("whatsappModal.tab.advanced")} />
              </Tabs>
              {tabIndex === 0 && (
              <>
              <QueueSelect
                selectedQueueIds={selectedQueueIds}
                onChange={(selectedIds) => setSelectedQueueIds(selectedIds)}
              />
              {(settings.restrictTransferConnection || "connection") === "connection" &&
                <div>
                  <FormControlLabel
                    control={
                      <Field
                        as={Switch}
                        color="primary"
                        name="restrictToQueues"
                        checked={values.restrictToQueues}
                      />
                    }
                    label={i18n.t("whatsappModal.form.restrictToQueues")}
                  />
                </div>
              }
              {(settings.transferToNewTicket || "connection") === "connection" &&
                <div>
                  <FormControlLabel
                    control={
                      <Field
                        as={Switch}
                        color="primary"
                        name="transferToNewTicket"
                        checked={values.transferToNewTicket}
                      />
                    }
                    label={i18n.t("whatsappModal.form.transferToNewTicket")}
                  />
                </div>
              }
              </>)}
              {tabIndex === 1 && (
              <>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.greetingMessage")}
                    type="greetingMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="greetingMessage"
                    spellCheck={true}
                    error={
                      touched.greetingMessage && Boolean(errors.greetingMessage)
                    }
                    helperText={
                      touched.greetingMessage && errors.greetingMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                 <Typography style={{fontSize: "11px"}}>
                  {`Variaveis: ( {{ms}}=> Turno, 
                  {{name}}=> Nome do contato, 
                  {{protocol}}=> protocolo, {{hora}}=> hora )`}
                 </Typography>
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.complationMessage")}
                    type="complationMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="complationMessage"
                    spellCheck={true}
                    error={
                      touched.complationMessage &&
                      Boolean(errors.complationMessage)
                    }
                    helperText={
                      touched.complationMessage && errors.complationMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.transferMessage")}
                    type="transferMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="transferMessage"
                    spellCheck={true}
                    error={
                      touched.transferMessage &&
                      Boolean(errors.transferMessage)
                    }
                    helperText={
                      touched.transferMessage && errors.transferMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.outOfHoursMessage")}
                    type="outOfHoursMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="outOfHoursMessage"
                    spellCheck={true}
                    error={
                      touched.outOfHoursMessage &&
                      Boolean(errors.outOfHoursMessage)
                    }
                    helperText={
                      touched.outOfHoursMessage && errors.outOfHoursMessage
                    }
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.ratingMessage")}
                    type="ratingMessage"
                    multiline
                    rows={4}
                    fullWidth
                    name="ratingMessage"
                    spellCheck={true}
                    error={
                      touched.ratingMessage && Boolean(errors.ratingMessage)
                    }
                    helperText={touched.ratingMessage && errors.ratingMessage}
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                </>)}
                {tabIndex === 2 && (
                <>
                <div>
                  <Field
                    as={SelectLanguage}
                    name="language"
                    fullWidth
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.token")}
                    type="token"
                    fullWidth
                    name="token"
                    variant="outlined"
                    margin="dense"
                    InputProps={{
                      endAdornment: (
                        <>
                          {values.token &&
                            <>
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  handleCopy(values.token);
                                }
                                }
                              >
                                <FontAwesomeIcon icon={faCopy} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  setFieldValue("token", "");
                                }
                                }
                              >
                                <Delete />
                              </IconButton>
                            </>
                          }
                          {
                            !values.token &&
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                setFieldValue("token", generateSecureToken(33));
                              }
                              }
                            >
                              <FontAwesomeIcon icon={faGears} />
                            </IconButton>
                          }
                        </>
                      ),
                    }}
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("whatsappModal.form.hubToken")}
                    type="text"
                    fullWidth
                    name="extraParameters.hubToken"
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("whatsappModal.form.hubChannel")}
                    type="text"
                    fullWidth
                    name="extraParameters.hubChannel"
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("whatsappModal.form.hubWhatsappTemplate")}
                    type="text"
                    fullWidth
                    name="extraParameters.hubWhatsappTemplate"
                    variant="outlined"
                    margin="dense"
                  />
                </div>
                <DynamicForm
                  title="Proxy Configuration"
                  schema={proxyConfigSchema}
                  data={proxyConfigData}
                  setData={setProxyConfigData}
                />
              </>
              )}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("whatsappModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {whatsAppId
                    ? i18n.t("whatsappModal.buttons.okEdit")
                    : i18n.t("whatsappModal.buttons.okAdd")}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default React.memo(WhatsAppModal);
