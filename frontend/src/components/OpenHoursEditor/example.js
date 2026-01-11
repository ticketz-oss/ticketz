import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Container,
  Typography,
  Box,
  Paper,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import OpenHoursEditor from "../OpenHoursEditor";

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  jsonDisplay: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    overflowX: "auto",
  },
}));

const OpenHoursEditorExample = () => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [openHours, setOpenHours] = useState({
    weeklyRules: [
      {
        days: ["mon", "tue", "wed", "thu"],
        hours: [
          { from: "09:00", to: "12:00" },
          { from: "13:30", to: "18:00" },
        ],
      },
      {
        days: ["fri"],
        hours: [{ from: "09:00", to: "16:00" }],
      },
      {
        days: ["sat", "sun"],
        hours: [],
      },
    ],
    overrides: [
      {
        date: "2025-12-25",
        repeat: "yearly",
        closed: true,
        label: "Natal",
      },
      {
        date: "2026-01-01",
        hours: [{ from: "10:00", to: "14:00" }],
        label: "Ano Novo (horário especial)",
      },
      {
        date: "2026-02-16",
        closed: true,
        label: "Segunda-feira de Carnaval",
      },
      {
        date: "2026-02-17",
        closed: true,
        label: "Terça-feira de Carnaval",
      },
    ],
    // timezone será detectado automaticamente do navegador
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    console.log("Horários salvos:", openHours);
    setOpen(false);
    // Aqui você pode fazer a requisição para a API
    // api.post("/business-hours", openHours).then(...)
  };

  return (
    <Container className={classes.container}>
      <Typography variant="h4" gutterBottom>
        Exemplo de Uso - Editor de Horários de Funcionamento
      </Typography>
      
      <Box mt={3}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Editar Horários de Funcionamento
        </Button>
      </Box>

      <Paper className={classes.jsonDisplay}>
        <Typography variant="h6" gutterBottom>
          Dados Atuais (JSON):
        </Typography>
        <pre style={{ margin: 0, fontSize: "0.875rem" }}>
          {JSON.stringify(openHours, null, 2)}
        </pre>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Editar Horários de Funcionamento</DialogTitle>
        <DialogContent>
          <OpenHoursEditor value={openHours} onChange={setOpenHours} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="default">
            Cancelar
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OpenHoursEditorExample;
