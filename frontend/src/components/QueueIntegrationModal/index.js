import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  makeStyles,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import QueueIntegrationService from "../../services/QueueIntegrationService";
import toastError from "../../errors/toastError";
import JSONInput from "react-json-editor-ajrm";
import locale from "react-json-editor-ajrm/locale/en";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  formControl: {
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  marginTop: {
    marginTop: theme.spacing(2),
  },
  jsonEditor: {
    marginTop: theme.spacing(2),
    width: "100%",
  },
  btnWrapper: {
    position: "relative",
  },
  buttonProgress: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const QueueIntegrationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  provider: Yup.string().required("Required"),
  active: Yup.boolean().required("Required"),
  webhookUrl: Yup.string().url("Must be a valid URL"),
  flowId: Yup.string(),
});

const QueueIntegrationModal = ({
  open,
  onClose,
  queueId,
  integrationId,
  reload,
}) => {
  const classes = useStyles();
  const [integration, setIntegration] = useState({
    name: "",
    provider: "n8n",
    active: true,
    webhookUrl: "",
    flowId: "",
    settings: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIntegration = async () => {
      if (!integrationId) return;

      setLoading(true);
      try {
        const data = await QueueIntegrationService.findById(integrationId);
        setIntegration((prev) => ({
          ...prev,
          ...data,
        }));
        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    };

    fetchIntegration();
  }, [integrationId]);

  const handleClose = () => {
    onClose();
    setIntegration({
      name: "",
      provider: "n8n",
      active: true,
      webhookUrl: "",
      flowId: "",
      settings: {},
    });
  };
  const handleSaveIntegration = async (values) => {
    try {
      if (integrationId) {
        await QueueIntegrationService.update(integrationId, {
          ...values,
          queueId,
        });
        toast.success(i18n.t("queueIntegration.toasts.updated"));
      } else {
        await QueueIntegrationService.create({
          ...values,
          queueId,
        });
        toast.success(i18n.t("queueIntegration.toasts.created"));
      }
      if (typeof reload === "function") {
        reload();
      }
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };
  
  const handleTestConnection = async (webhookUrl) => {
    if (!webhookUrl) {
      toast.error("URL do webhook é necessária para testar a conexão");
      return;
    }
    
    try {
      setLoading(true);
      const response = await QueueIntegrationService.testConnection(webhookUrl);
      if (response.success) {
        toast.success(`Teste de conexão bem-sucedido: ${response.message}`);
      } else {
        toast.error(`Falha no teste de conexão: ${response.message}`);
      }
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        {integrationId
          ? i18n.t("queueIntegration.modal.edit")
          : i18n.t("queueIntegration.modal.add")}
      </DialogTitle>
      <Formik
        initialValues={integration}
        enableReinitialize={true}
        validationSchema={QueueIntegrationSchema}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            handleSaveIntegration(values);
            actions.setSubmitting(false);
          }, 400);
        }}
      >
        {({ touched, errors, isSubmitting, values, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    label={i18n.t("queueIntegration.form.name")}
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
                    margin="dense"
                    className={classes.fullWidth}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl
                    variant="outlined"
                    margin="dense"
                    className={classes.fullWidth}
                  >
                    <InputLabel id="provider-label">
                      {i18n.t("queueIntegration.form.provider")}
                    </InputLabel>
                    <Field
                      as={Select}
                      label={i18n.t("queueIntegration.form.provider")}
                      labelId="provider-label"
                      name="provider"
                      error={touched.provider && Boolean(errors.provider)}
                    >
                      <MenuItem value="n8n">n8n</MenuItem>
                      <MenuItem value="zapier">Zapier</MenuItem>
                      <MenuItem value="integromat">Integromat</MenuItem>
                      <MenuItem value="custom">
                        {i18n.t("queueIntegration.form.custom")}
                      </MenuItem>
                    </Field>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field
                    as={TextField}
                    label={i18n.t("queueIntegration.form.flowId")}
                    name="flowId"
                    error={touched.flowId && Boolean(errors.flowId)}
                    helperText={touched.flowId && errors.flowId}
                    variant="outlined"
                    margin="dense"
                    className={classes.fullWidth}
                  />
                </Grid>                <Grid item xs={12} md={6}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Field
                      as={TextField}
                      label={i18n.t("queueIntegration.form.webhookUrl")}
                      name="webhookUrl"
                      error={touched.webhookUrl && Boolean(errors.webhookUrl)}
                      helperText={touched.webhookUrl && errors.webhookUrl}
                      variant="outlined"
                      margin="dense"
                      className={classes.fullWidth}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ marginLeft: 8, marginTop: 8, height: 40 }}
                      onClick={() => handleTestConnection(values.webhookUrl)}
                      disabled={!values.webhookUrl || isSubmitting}
                    >
                      Testar
                    </Button>
                  </div>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Field
                        as={Switch}
                        color="primary"
                        name="active"
                        checked={values.active}
                      />
                    }
                    label={i18n.t("queueIntegration.form.active")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    {i18n.t("queueIntegration.form.settings")}
                  </Typography>
                  <div className={classes.jsonEditor}>
                    <JSONInput
                      placeholder={values.settings || {}}
                      locale={locale}
                      height="220px"
                      width="100%"
                      onChange={(data) => {
                        if (data.jsObject) {
                          setFieldValue("settings", data.jsObject);
                        }
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                color="secondary"
                disabled={isSubmitting}
                variant="outlined"
              >
                {i18n.t("queueIntegration.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={isSubmitting}
                variant="contained"
                className={classes.btnWrapper}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} className={classes.buttonProgress} />
                ) : (
                  i18n.t("queueIntegration.buttons.save")
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

QueueIntegrationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  queueId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  integrationId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  reload: PropTypes.func,
};

export default QueueIntegrationModal;
