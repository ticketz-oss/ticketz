import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box
} from "@material-ui/core";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginBottom: theme.spacing(2)
  },
  textRight: {
    textAlign: "right"
  },
  variablesSection: {
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`
  }
}));

const initialSettings = {
  messageInterval: 20,
  longerIntervalAfter: 20,
  greaterInterval: 60,
  variables: []
};

const CampaignConfigModal = ({ open, onClose }) => {
  const classes = useStyles();
  const [settings, setSettings] = useState(initialSettings);
  const [showVariablesForm, setShowVariablesForm] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [variable, setVariable] = useState({ key: "", value: "" });

  useEffect(() => {
    if (open) {
      api.get("/campaign-settings").then(({ data }) => {
        const settingsList = [];
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(item => {
            settingsList.push([item.key, JSON.parse(item.value)]);
          });
          setSettings(Object.fromEntries(settingsList));
        }
      });
    }
  }, [open]);

  const handleOnChangeVariable = e => {
    if (e.target.value !== null) {
      const changedProp = {};
      changedProp[e.target.name] = e.target.value;
      setVariable(prev => ({ ...prev, ...changedProp }));
    }
  };

  const handleOnChangeSettings = e => {
    const changedProp = {};
    changedProp[e.target.name] = e.target.value;
    setSettings(prev => ({ ...prev, ...changedProp }));
  };

  const addVariable = () => {
    setSettings(prev => {
      const variablesExists = settings.variables.filter(
        v => v.key === variable.key
      );
      const variables = prev.variables;
      if (variablesExists.length === 0) {
        variables.push(Object.assign({}, variable));
        setVariable({ key: "", value: "" });
      }
      return { ...prev, variables };
    });
  };

  const removeVariable = () => {
    const newList = settings.variables.filter(v => v.key !== selectedKey);
    setSettings(prev => ({ ...prev, variables: newList }));
    setSelectedKey(null);
  };

  const saveSettings = async () => {
    try {
      await api.post("/campaign-settings", { settings });
      toast.success(i18n.t("common.success"));
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <ConfirmationModal
        title={i18n.t("campaigns.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={removeVariable}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>{i18n.t("campaignsConfig.title")}</DialogTitle>
        <DialogContent dividers>
          <Grid spacing={2} container>
            <Grid xs={12} item>
              <Typography variant="h6">
                {i18n.t("campaignsConfig.intervals")}
              </Typography>
            </Grid>
            <Grid xs={12} md={4} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <TextField
                  label={i18n.t("campaignsConfig.messageInterval")}
                  name="messageInterval"
                  type="number"
                  variant="outlined"
                  value={settings.messageInterval}
                  onChange={handleOnChangeSettings}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </FormControl>
            </Grid>
            <Grid xs={12} md={4} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <InputLabel id="longerIntervalAfter-label">
                  {i18n.t("campaignsConfig.longerIntervalAfter")}
                </InputLabel>
                <Select
                  name="longerIntervalAfter"
                  labelId="longerIntervalAfter-label"
                  label={i18n.t("campaignsConfig.longerIntervalAfter")}
                  value={settings.longerIntervalAfter}
                  onChange={e => handleOnChangeSettings(e)}
                >
                  <MenuItem value={0}>{i18n.t("common.undefined")}</MenuItem>
                  <MenuItem value={5}>5 {i18n.t("common.messages")}</MenuItem>
                  <MenuItem value={10}>10 {i18n.t("common.messages")}</MenuItem>
                  <MenuItem value={15}>15 {i18n.t("common.messages")}</MenuItem>
                  <MenuItem value={20}>20 {i18n.t("common.messages")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} md={4} item>
              <TextField
                label={i18n.t("campaignsConfig.longerInterval")}
                name="greaterInterval"
                type="number"
                variant="outlined"
                value={settings.greaterInterval}
                onChange={handleOnChangeSettings}
                InputLabelProps={{ shrink: true }}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid xs={12} className={classes.variablesSection} item>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Variáveis Personalizadas</Typography>
                <Button
                  onClick={() => setShowVariablesForm(!showVariablesForm)}
                  color="primary"
                >
                  {showVariablesForm ? "Cancelar" : "Adicionar Variável"}
                </Button>
              </Box>

              {showVariablesForm && (
                <Grid container spacing={2}>
                  <Grid xs={12} md={5} item>
                    <TextField
                      label={i18n.t("common.key")}
                      variant="outlined"
                      value={variable.key}
                      name="key"
                      onChange={handleOnChangeVariable}
                      fullWidth
                      placeholder="nome_variavel"
                    />
                  </Grid>
                  <Grid xs={12} md={5} item>
                    <TextField
                      label={i18n.t("common.value")}
                      variant="outlined"
                      value={variable.value}
                      name="value"
                      onChange={handleOnChangeVariable}
                      fullWidth
                      placeholder="valor"
                    />
                  </Grid>
                  <Grid xs={12} md={2} item>
                    <Button
                      onClick={addVariable}
                      color="primary"
                      variant="contained"
                      fullWidth
                    >
                      {i18n.t("common.add")}
                    </Button>
                  </Grid>
                </Grid>
              )}

              {settings.variables.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: "10%" }}></TableCell>
                      <TableCell>{i18n.t("common.key")}</TableCell>
                      <TableCell>{i18n.t("common.value")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(settings.variables) &&
                      settings.variables.map((v, k) => (
                        <TableRow key={k}>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedKey(v.key);
                                setConfirmationOpen(true);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell>{"{" + v.key + "}"}</TableCell>
                          <TableCell>{v.value}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            {i18n.t("common.cancel")}
          </Button>
          <Button onClick={saveSettings} color="primary" variant="contained">
            {i18n.t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CampaignConfigModal;
