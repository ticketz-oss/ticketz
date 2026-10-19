import React, { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@material-ui/core";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  metodoLabel,
  METODOS,
  situacaoColor,
  situacaoLabel
} from "./format";

const Linha = ({ rotulo, children }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color="textSecondary" display="block">
      {rotulo}
    </Typography>
    <Typography variant="body2">{children}</Typography>
  </Grid>
);

const ModalCobranca = ({
  invoiceId,
  aberto,
  aoFechar,
  gatewayPronto,
  aoAtualizar,
  aoExcluir
}) => {
  const [fatura, setFatura] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [method, setMethod] = useState("pix");
  const [taxId, setTaxId] = useState("");
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [numero, setNumero] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [confirmacao, setConfirmacao] = useState(null);

  const carregar = useCallback(async () => {
    if (!invoiceId) return;
    setCarregando(true);
    try {
      const { data } = await api.get(`/billing-admin/invoices/${invoiceId}`);
      setFatura(data);
      setNumero(data.company?.phone || "");
      setMensagem(data.defaultMessage || "");
      if (data.forma) setMethod(data.forma);
    } catch (err) {
      toastError(err);
    }
    setCarregando(false);
  }, [invoiceId]);

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto, carregar]);

  const propagar = atualizada => {
    setFatura(anterior => ({ ...anterior, ...atualizada }));
    if (atualizada.defaultMessage) setMensagem(atualizada.defaultMessage);
    aoAtualizar(atualizada);
  };

  const handleGerar = async () => {
    if (method === "boleto" && !taxId.trim()) {
      toast.error("Boleto exige o CPF/CNPJ do cliente.");
      return;
    }
    setGerando(true);
    try {
      const { data } = await api.post(
        `/billing-admin/invoices/${invoiceId}/charge`,
        { method, taxId: taxId.replace(/\D/g, "") || undefined }
      );
      toast.success("Cobrança gerada.");
      aoAtualizar(data.invoice);
      await carregar();
    } catch (err) {
      toastError(err);
    }
    setGerando(false);
  };

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      const { data } = await api.post(
        `/billing-admin/invoices/${invoiceId}/send`,
        { number: numero, message: mensagem }
      );
      toast.success(`Cobrança enviada para ${data.sentTo}.`);
    } catch (err) {
      toastError(err);
    }
    setEnviando(false);
  };

  const handleAtualizarStatus = async () => {
    setCarregando(true);
    try {
      const { data } = await api.post(
        `/billing-admin/invoices/${invoiceId}/refresh`
      );
      propagar(data);
      toast.success(
        data.situacao === "paid"
          ? "Pagamento confirmado."
          : "Sem confirmação de pagamento ainda."
      );
    } catch (err) {
      toastError(err);
    }
    setCarregando(false);
  };

  const handleTransicao = async status => {
    setCarregando(true);
    try {
      const { data } = await api.put(`/billing-admin/invoices/${invoiceId}`, {
        status
      });
      propagar(data);
      toast.success(
        status === "paid" ? "Marcada como paga." : "Cobrança cancelada."
      );
    } catch (err) {
      toastError(err);
    }
    setCarregando(false);
    setConfirmacao(null);
  };

  const handleExcluir = async () => {
    setCarregando(true);
    try {
      await api.delete(`/billing-admin/invoices/${invoiceId}`);
      toast.success("Cobrança excluída.");
      aoExcluir(invoiceId);
      setConfirmacao(null);
      aoFechar();
    } catch (err) {
      toastError(err);
    }
    setCarregando(false);
  };

  const copiar = texto => {
    navigator.clipboard?.writeText(texto);
    toast.success("Copiado.");
  };

  const aberta = fatura?.status === "open";
  const pix = fatura?.forma === "pix" && fatura?.paymentLink;

  return (
    <>
      <ConfirmationModal
        title={
          confirmacao === "delete"
            ? "Excluir esta cobrança?"
            : confirmacao === "paid"
              ? "Marcar como paga?"
              : "Cancelar esta cobrança?"
        }
        open={!!confirmacao}
        onClose={() => setConfirmacao(null)}
        onConfirm={() =>
          confirmacao === "delete"
            ? handleExcluir()
            : handleTransicao(confirmacao)
        }
      >
        {confirmacao === "delete"
          ? "A cobrança sairá das telas e não será recriada automaticamente. Cobranças pagas não podem ser excluídas."
          : confirmacao === "paid"
            ? "A baixa manual confirma o recebimento e avança o vencimento do cliente para o próximo ciclo."
            : "A cobrança deixa de valer e sai dos totais em aberto."}
      </ConfirmationModal>

      <Dialog
        PaperProps={{ className: "sd-billing-dialog" }}
        open={aberto}
        onClose={aoFechar}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Cobrança #{invoiceId}
          {fatura ? (
            <Chip
              size="small"
              label={situacaoLabel(fatura.situacao)}
              style={{
                marginLeft: 8,
                backgroundColor: situacaoColor(fatura.situacao),
                color: "#fff"
              }}
            />
          ) : null}
        </DialogTitle>
        <DialogContent dividers>
          {carregando && !fatura ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : null}

          {fatura ? (
            <Grid container spacing={2}>
              <Linha rotulo="Cliente">{fatura.company?.name || "-"}</Linha>
              <Linha rotulo="Plano">{fatura.company?.planName || "-"}</Linha>
              <Linha rotulo="Descrição">{fatura.detail || "-"}</Linha>
              <Linha rotulo="Valor">
                {formatCurrency(fatura.value, fatura.currency)}
              </Linha>
              <Linha rotulo="Vencimento">{formatDate(fatura.dueDate)}</Linha>
              <Linha rotulo="Lançada em">
                {formatDateTime(fatura.createdAt)}
              </Linha>
              <Linha rotulo="Forma">{metodoLabel(fatura.forma)}</Linha>
              <Linha rotulo="Pagamento">
                {fatura.paidAt ? formatDateTime(fatura.paidAt) : "-"}
              </Linha>
              <Linha rotulo="Origem">
                {fatura.origem === "manual"
                  ? "Lançamento manual"
                  : "Automática"}
              </Linha>
              <Linha rotulo="Id no gateway">{fatura.txId || "-"}</Linha>

              {fatura.receiptUrl ? (
                <Grid item xs={12}>
                  <Link
                    href={fatura.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir recibo no AbacatePay
                  </Link>
                </Grid>
              ) : null}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {aberta ? (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">
                      Gerar cobrança no gateway
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel id="modal-metodo">Forma</InputLabel>
                      <Select
                        labelId="modal-metodo"
                        label="Forma"
                        value={method}
                        onChange={e => setMethod(e.target.value)}
                      >
                        {METODOS.map(item => (
                          <MenuItem key={item.value} value={item.value}>
                            {item.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      label="CPF/CNPJ"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      fullWidth
                      color="primary"
                      variant="contained"
                      disabled={gerando || !gatewayPronto}
                      onClick={handleGerar}
                    >
                      {gerando ? <CircularProgress size={18} /> : "Gerar"}
                    </Button>
                  </Grid>
                </>
              ) : null}

              {fatura.paymentLink ? (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    {pix ? "PIX copia e cola" : "Link de pagamento"}
                  </Typography>
                  <Box display="flex" gridGap={8} alignItems="flex-start">
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      multiline
                      rowsMax={3}
                      value={fatura.paymentLink}
                      InputProps={{ readOnly: true }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => copiar(fatura.paymentLink)}
                    >
                      Copiar
                    </Button>
                    {!pix ? (
                      <Button
                        variant="outlined"
                        href={fatura.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir
                      </Button>
                    ) : null}
                  </Box>
                  {pix ? (
                    <Box mt={1} p={1} bgcolor="#fff" display="inline-block">
                      <QRCode value={fatura.paymentLink} size={148} />
                    </Box>
                  ) : null}
                </Grid>
              ) : null}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  Enviar para o cliente no WhatsApp
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label="Número"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  helperText="Sem o 55 completamos automaticamente."
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label="Mensagem"
                  multiline
                  rows={5}
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                />
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          {fatura && fatura.status !== "paid" ? (
            <Button
              color="secondary"
              onClick={() => setConfirmacao("delete")}
              disabled={carregando}
            >
              Excluir cobrança
            </Button>
          ) : null}
          {aberta ? (
            <>
              <Button
                onClick={() => setConfirmacao("cancelled")}
                disabled={carregando}
              >
                Cancelar cobrança
              </Button>
              <Button
                onClick={() => setConfirmacao("paid")}
                disabled={carregando}
              >
                Marcar como paga
              </Button>
              {fatura?.txId ? (
                <Button onClick={handleAtualizarStatus} disabled={carregando}>
                  Conferir pagamento
                </Button>
              ) : null}
              <Button
                color="primary"
                variant="contained"
                onClick={handleEnviar}
                disabled={enviando}
              >
                {enviando ? <CircularProgress size={18} /> : "Enviar cobrança"}
              </Button>
            </>
          ) : null}
          <Button onClick={aoFechar}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ModalCobranca;
