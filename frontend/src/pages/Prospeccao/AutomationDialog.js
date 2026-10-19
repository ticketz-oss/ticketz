import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const emptySchedule = product => ({
  time: "09:00",
  nicho: "",
  countryCode: "BR",
  stateCode: "",
  cityName: "",
  maxResults: 10,
  product: product || "espaco-whats",
  tone: "media",
  onlyWhatsapp: true,
  states: [],
  cities: []
});

const countryLabel = country => {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(
      country.code
    );
  } catch (_) {
    return country.name;
  }
};

const AutomationDialog = ({ open, onClose, products, onSaved }) => {
  const [config, setConfig] = useState(null);
  const [countries, setCountries] = useState([]);
  const [connections, setConnections] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get("/prospeccao/automacao"),
      api.get("/prospeccao/localidades/paises"),
      api.get("/whatsapp"),
      api.get("/users/list")
    ])
      .then(async ([automation, countryList, whatsappList, userList]) => {
        const schedules = automation.data.schedules?.length
          ? automation.data.schedules
          : [emptySchedule(products[0])];
        const hydrated = await Promise.all(
          schedules.map(async item => {
            const countryCode = item.countryCode || "BR";
            const [states, cities] = await Promise.all([
              api.get("/prospeccao/localidades/estados", {
                params: { pais: countryCode }
              }),
              api.get("/prospeccao/localidades/cidades", {
                params: {
                  pais: countryCode,
                  estado: item.stateCode || undefined
                }
              })
            ]);
            return {
              ...item,
              countryCode,
              states: states.data,
              cities: cities.data
            };
          })
        );
        setConfig({ ...automation.data, schedules: hydrated });
        setCountries(countryList.data || []);
        setConnections(whatsappList.data || []);
        setUsers(userList.data || []);
      })
      .catch(toastError);
  }, [open, products]);

  const setField = (field, value) =>
    setConfig(current => ({ ...current, [field]: value }));
  const setSchedule = (index, patch) =>
    setConfig(current => ({
      ...current,
      schedules: current.schedules.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    }));

  const countryChanged = async (index, countryCode) => {
    try {
      const [{ data: states }, { data: cities }] = await Promise.all([
        api.get("/prospeccao/localidades/estados", {
          params: { pais: countryCode }
        }),
        api.get("/prospeccao/localidades/cidades", {
          params: { pais: countryCode }
        })
      ]);
      setSchedule(index, {
        countryCode,
        stateCode: "",
        cityName: "",
        states,
        cities
      });
    } catch (error) {
      toastError(error);
    }
  };

  const stateChanged = async (index, stateCode) => {
    try {
      const { data: cities } = await api.get(
        "/prospeccao/localidades/cidades",
        {
          params: {
            pais: config.schedules[index].countryCode,
            estado: stateCode || undefined
          }
        }
      );
      setSchedule(index, { stateCode, cityName: "", cities });
    } catch (error) {
      toastError(error);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        whatsappId: Number(config.whatsappId),
        userId: Number(config.userId),
        minDelaySeconds: Number(config.minDelaySeconds || 180),
        maxDelaySeconds: Number(config.maxDelaySeconds || 420),
        dailyLimit: Number(config.dailyLimit || 30),
        acknowledgedRisk: !!config.acknowledgedRisk,
        schedules: config.schedules.map(({ states, cities, ...item }) => ({
          ...item,
          maxResults: Number(item.maxResults)
        }))
      };
      const { data } = await api.put("/prospeccao/automacao", payload);
      onSaved(data);
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      PaperProps={{ className: "sd-quest-dialog" }}
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Envio automático</DialogTitle>
      <DialogContent dividers>
        {!config ? (
          <Typography>Carregando configuração...</Typography>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel>Conexão WhatsApp</InputLabel>
                <Select
                  label="Conexão WhatsApp"
                  value={config.whatsappId || ""}
                  onChange={e => setField("whatsappId", e.target.value)}
                >
                  {connections.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} — {item.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel>Responsável</InputLabel>
                <Select
                  label="Responsável"
                  value={config.userId || ""}
                  onChange={e => setField("userId", e.target.value)}
                >
                  {users.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                label="Intervalo mínimo (s)"
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={config.minDelaySeconds}
                onChange={e => setField("minDelaySeconds", e.target.value)}
                inputProps={{ min: 180 }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                label="Intervalo máximo (s)"
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={config.maxDelaySeconds}
                onChange={e => setField("maxDelaySeconds", e.target.value)}
                inputProps={{ min: 180 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Limite diário"
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={config.dailyLimit}
                onChange={e => setField("dailyLimit", e.target.value)}
                inputProps={{ min: 1, max: 30 }}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="body2" color="textSecondary">
                Fuso: {config.timezone}. O espaçamento reduz a concentração de
                envios, mas não garante proteção contra bloqueios.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!config.acknowledgedRisk}
                    onChange={e =>
                      setField("acknowledgedRisk", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Confirmo que só contatarei leads com base legal/autorização adequada e aceito o risco da automação."
              />
            </Grid>
            {config.schedules.map((item, index) => (
              <Grid item xs={12} key={item.id || index}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={6} md={1}>
                    <TextField
                      label="Horário"
                      type="time"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={item.time}
                      onChange={e =>
                        setSchedule(index, { time: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      label="Nicho"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={item.nicho}
                      onChange={e =>
                        setSchedule(index, { nicho: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>País</InputLabel>
                      <Select
                        label="País"
                        value={item.countryCode}
                        onChange={e => countryChanged(index, e.target.value)}
                      >
                        {countries.map(country => (
                          <MenuItem key={country.code} value={country.code}>
                            {countryLabel(country)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>Estado (opcional)</InputLabel>
                      <Select
                        label="Estado (opcional)"
                        value={item.stateCode || ""}
                        onChange={e => stateChanged(index, e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {(item.states || []).map(state => (
                          <MenuItem key={state.code} value={state.code}>
                            {state.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>Cidade (opcional)</InputLabel>
                      <Select
                        label="Cidade (opcional)"
                        value={item.cityName || ""}
                        onChange={e =>
                          setSchedule(index, { cityName: e.target.value })
                        }
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {(item.cities || []).map(city => (
                          <MenuItem key={city} value={city}>
                            {city}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4} md={1}>
                    <TextField
                      label="Leads"
                      type="number"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={item.maxResults}
                      onChange={e =>
                        setSchedule(index, { maxResults: e.target.value })
                      }
                      inputProps={{ min: 1, max: 30 }}
                    />
                  </Grid>
                  <Grid item xs={6} md={1}>
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>Produto</InputLabel>
                      <Select
                        label="Produto"
                        value={item.product}
                        onChange={e =>
                          setSchedule(index, { product: e.target.value })
                        }
                      >
                        {products.map(product => (
                          <MenuItem key={product} value={product}>
                            {product}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} md={1}>
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>Tom</InputLabel>
                      <Select
                        label="Tom"
                        value={item.tone}
                        onChange={e =>
                          setSchedule(index, { tone: e.target.value })
                        }
                      >
                        <MenuItem value="curta">Curta</MenuItem>
                        <MenuItem value="media">Média</MenuItem>
                        <MenuItem value="longa">Longa</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={10} md={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="primary"
                          checked={item.onlyWhatsapp !== false}
                          onChange={e =>
                            setSchedule(index, {
                              onlyWhatsapp: e.target.checked
                            })
                          }
                        />
                      }
                      label="Só WhatsApp"
                    />
                  </Grid>
                  <Grid item xs={2} md={1}>
                    <IconButton
                      disabled={config.schedules.length === 1}
                      onClick={() =>
                        setField(
                          "schedules",
                          config.schedules.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  setField("schedules", [
                    ...config.schedules,
                    emptySchedule(products[0])
                  ])
                }
              >
                Adicionar horário
              </Button>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={save}
          disabled={!config || saving}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutomationDialog;
