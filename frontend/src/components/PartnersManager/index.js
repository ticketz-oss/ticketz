import React, { useCallback, useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import {
  makeStyles,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  Typography
} from "@material-ui/core";
import { Edit as EditIcon, Link as LinkIcon } from "@material-ui/icons";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";
import PartnerPayoutsPanel from "./PartnerPayoutsPanel";
import { formatCurrency } from "../../pages/Partner/format";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    width: "100%",
    flex: 1,
    padding: theme.spacing(2)
  },
  fullWidth: {
    width: "100%"
  },
  tableContainer: {
    width: "100%",
    overflowX: "scroll",
    ...theme.scrollbarStyles
  },
  inviteBox: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    wordBreak: "break-all"
  },
  inactive: {
    color: theme.isStardew ? "#805335" : "gray"
  }
}));

const emptyRecord = {
  name: "",
  email: "",
  phone: "",
  discountPct: 30,
  status: true
};

export function PartnerForm({
  onSubmit,
  onDelete,
  onCancel,
  onInvite,
  initialValue,
  loading
}) {
  const classes = useStyles();
  const [record, setRecord] = useState(initialValue);

  useEffect(() => {
    setRecord(initialValue);
  }, [initialValue]);

  return (
    <Formik
      enableReinitialize
      initialValues={record}
      onSubmit={(values, { resetForm }) =>
        setTimeout(() => {
          onSubmit(values);
          resetForm();
        }, 500)
      }
    >
      {() => (
        <Form className={classes.fullWidth}>
          <Grid spacing={2} justifyContent="flex-end" container>
            <Grid xs={12} sm={6} md={3} item>
              <Field
                as={TextField}
                label="Nome"
                name="name"
                variant="outlined"
                className={classes.fullWidth}
                margin="dense"
                required
              />
            </Grid>
            <Grid xs={12} sm={6} md={3} item>
              <Field
                as={TextField}
                label="E-mail"
                name="email"
                variant="outlined"
                className={classes.fullWidth}
                margin="dense"
                required
              />
            </Grid>
            <Grid xs={12} sm={6} md={2} item>
              <Field
                as={TextField}
                label="Telefone"
                name="phone"
                variant="outlined"
                className={classes.fullWidth}
                margin="dense"
              />
            </Grid>
            <Grid xs={12} sm={6} md={2} item>
              <Field
                as={TextField}
                label="Desconto de revenda (%)"
                name="discountPct"
                type="number"
                variant="outlined"
                className={classes.fullWidth}
                margin="dense"
                inputProps={{ min: 0, max: 100, step: "0.01" }}
                helperText="O parceiro compra o plano com este desconto e fica com tudo que cobrar acima disso."
              />
            </Grid>
            <Grid xs={12} sm={6} md={2} item>
              <FormControl margin="dense" variant="outlined" fullWidth>
                <InputLabel htmlFor="partner-status">Ativo</InputLabel>
                <Field
                  as={Select}
                  id="partner-status"
                  label="Ativo"
                  name="status"
                  margin="dense"
                >
                  <MenuItem value={true}>Sim</MenuItem>
                  <MenuItem value={false}>Não</MenuItem>
                </Field>
              </FormControl>
            </Grid>
            <Grid xs={12} item>
              <Grid justifyContent="flex-end" spacing={1} container>
                <Grid xs={6} md={1} item>
                  <ButtonWithSpinner
                    className={classes.fullWidth}
                    loading={loading}
                    onClick={() => onCancel()}
                    variant="contained"
                  >
                    Limpar
                  </ButtonWithSpinner>
                </Grid>
                {record.id !== undefined ? (
                  <>
                    <Grid xs={6} md={2} item>
                      <ButtonWithSpinner
                        className={classes.fullWidth}
                        loading={loading}
                        onClick={() => onInvite(record)}
                        variant="outlined"
                        color="primary"
                      >
                        Gerar convite
                      </ButtonWithSpinner>
                    </Grid>
                    <Grid xs={6} md={1} item>
                      <ButtonWithSpinner
                        className={classes.fullWidth}
                        loading={loading}
                        onClick={() => onDelete(record)}
                        variant="contained"
                        color="secondary"
                      >
                        Excluir
                      </ButtonWithSpinner>
                    </Grid>
                  </>
                ) : null}
                <Grid xs={6} md={1} item>
                  <ButtonWithSpinner
                    className={classes.fullWidth}
                    loading={loading}
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    Salvar
                  </ButtonWithSpinner>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );
}

export function PartnersGrid({ records, onSelect, onInvite }) {
  const classes = useStyles();

  return (
    <Paper className={classes.tableContainer}>
      <Table className={classes.fullWidth} size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center" style={{ width: "1%" }}>
              #
            </TableCell>
            <TableCell align="left">Nome</TableCell>
            <TableCell align="left">E-mail</TableCell>
            <TableCell align="left">Telefone</TableCell>
            <TableCell align="center">Desconto</TableCell>
            <TableCell align="center">Clientes</TableCell>
            <TableCell align="right">A repassar</TableCell>
            <TableCell align="center">Recebimento</TableCell>
            <TableCell align="center">Chave Pix</TableCell>
            <TableCell align="center">Ativo</TableCell>
            <TableCell align="center">Convite</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} align="center">
                Nenhum parceiro cadastrado.
              </TableCell>
            </TableRow>
          )}
          {records.map(row => (
            <TableRow
              key={row.id}
              className={row.status ? "" : classes.inactive}
            >
              <TableCell align="center" style={{ width: "1%" }}>
                <IconButton onClick={() => onSelect(row)} aria-label="editar">
                  <EditIcon />
                </IconButton>
              </TableCell>
              <TableCell align="left">{row.name}</TableCell>
              <TableCell align="left">{row.email}</TableCell>
              <TableCell align="left">{row.phone || "-"}</TableCell>
              <TableCell align="center">{row.discountPct}%</TableCell>
              <TableCell align="center">{row.companiesCount}</TableCell>
              <TableCell align="right">
                {formatCurrency(row.pendingAmount)}
              </TableCell>
              <TableCell align="center">
                {row.payoutMode === "scheduled"
                  ? `Dia ${row.payoutDay || "-"}`
                  : "Imediato"}
              </TableCell>
              <TableCell align="center">
                {row.pixKey ? "Cadastrada" : "Pendente"}
              </TableCell>
              <TableCell align="center">{row.status ? "Sim" : "Não"}</TableCell>
              <TableCell align="center">
                <Tooltip title="Gerar link de convite">
                  <IconButton
                    onClick={() => onInvite(row)}
                    aria-label="convite"
                  >
                    <LinkIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function PartnersManager() {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState(emptyRecord);
  const [inviteUrl, setInviteUrl] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/partners", {
        params: { pageNumber: 1 }
      });
      setRecords(data.partners || []);
    } catch (e) {
      toast.error("Não foi possível carregar a lista de parceiros");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const handleCancel = () => {
    setRecord(emptyRecord);
    setInviteUrl("");
  };

  const handleSelect = data => {
    setRecord({
      id: data.id,
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      discountPct: data.discountPct ?? 30,
      status: data.status !== false
    });
    setInviteUrl("");
  };

  const handleSubmit = async data => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        discountPct: Number(data.discountPct) || 30,
        status: data.status
      };
      if (data.id !== undefined) {
        await api.put(`/partners/${data.id}`, payload);
      } else {
        await api.post("/partners", payload);
      }
      await loadPartners();
      handleCancel();
      toast.success("Operação realizada com sucesso!");
    } catch (e) {
      toast.error(
        e?.response?.data?.error ||
          "Não foi possível salvar. Verifique se já existe um parceiro com esse e-mail."
      );
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/partners/${record.id}`);
      await loadPartners();
      handleCancel();
      toast.success("Parceiro excluído.");
    } catch (e) {
      toast.error(
        e?.response?.data?.error ||
          "Não foi possível excluir. Parceiros com repasses em aberto não podem ser removidos."
      );
    }
    setLoading(false);
  };

  const handleInvite = async partner => {
    setLoading(true);
    try {
      const { data } = await api.post(`/partners/${partner.id}/invite-link`);
      setInviteUrl(data.url);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copiado! Válido por 7 dias.");
      } else {
        toast.success("Link gerado! Válido por 7 dias.");
      }
    } catch (e) {
      toast.error("Não foi possível gerar o convite");
    }
    setLoading(false);
  };

  return (
    <Paper className={`${classes.mainPaper} sd-partner-register`} elevation={0}>
      <Grid spacing={2} container>
        <Grid xs={12} item>
          <PartnerForm
            initialValue={record}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onDelete={() => setShowConfirmDelete(true)}
            onInvite={handleInvite}
          />
        </Grid>
        {inviteUrl ? (
          <Grid xs={12} item>
            <Paper
              className={`${classes.inviteBox} sd-invite-letter`}
              variant="outlined"
            >
              <Typography variant="caption" color="textSecondary">
                Envie este link por WhatsApp ou e-mail (expira em 7 dias):
              </Typography>
              <Typography variant="body2">{inviteUrl}</Typography>
            </Paper>
          </Grid>
        ) : null}
        <Grid xs={12} item>
          <PartnersGrid
            records={records}
            onSelect={handleSelect}
            onInvite={handleInvite}
          />
        </Grid>
        <Grid xs={12} item>
          <PartnerPayoutsPanel partners={records} />
        </Grid>
      </Grid>
      <ConfirmationModal
        title="Exclusão de Parceiro"
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => handleDelete()}
      >
        Deseja realmente excluir este parceiro? As empresas dele continuam
        ativas, mas passam a ser venda direta.
      </ConfirmationModal>
    </Paper>
  );
}
