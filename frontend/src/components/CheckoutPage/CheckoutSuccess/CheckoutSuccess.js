import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import QRCode from "react-qr-code";
import { SuccessContent, Total } from "./style";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaCheckCircle, FaBarcode, FaExternalLinkAlt } from "react-icons/fa";
import { SocketContext } from "../../../context/Socket/SocketContext";
import { useDate } from "../../../hooks/useDate";
import { toast } from "react-toastify";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

function CheckoutSuccess(props) {
  const { pix } = props; // prop name mantida para compatibilidade, contém dados de qualquer método
  const paymentMethod = pix?.paymentMethod || "pix";
  const [copied, setCopied] = useState(false);
  const history = useHistory();
  const onClose = props.onClose;

  const { dateToClient } = useDate();
  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyPayment = data => {
      if (data.action === "CONCLUIDA") {
        toast.success(
          `Sua licença foi renovada até ${dateToClient(data.company.dueDate)}!`
        );
        setTimeout(() => {
          history.push("/");
        }, 4000);
      }

      if (data.action === "EXPIRADA") {
        toast.error("Transação de cobrança expirou");
        onClose();
      }
    };

    socket.on(`company-${companyId}-payment`, onCompanyPayment);

    return () => {
      socket.disconnect();
    };
  }, [history, dateToClient, socketManager]);

  const handleCopy = () => {
    setTimeout(() => setCopied(false), 1500);
    setCopied(true);
  };

  const valor = pix?.valor?.original;
  const valorFormatado =
    typeof valor === "number"
      ? valor.toLocaleString("pt-br", { minimumFractionDigits: 2 })
      : String(valor || "");

  if (paymentMethod === "boleto") {
    const barcode = pix?.boletoBarcode || "";
    const boletoUrl = pix?.boletoUrl || "";
    const expireAt = pix?.expireAt || "";

    return (
      <React.Fragment>
        <Total>
          <span>TOTAL</span>
          <strong>R${valorFormatado}</strong>
        </Total>
        <SuccessContent>
          <FaBarcode size={64} style={{ color: "#333", marginBottom: 16 }} />
          <Typography variant="body1" align="center">
            Seu boleto foi gerado!{" "}
            {expireAt && `Vencimento: ${expireAt}.`}
          </Typography>

          {barcode && (
            <>
              <Typography
                variant="caption"
                style={{
                  wordBreak: "break-all",
                  background: "#f5f5f5",
                  padding: "8px 12px",
                  borderRadius: 4,
                  marginTop: 12,
                  display: "block",
                  maxWidth: 480
                }}
              >
                {barcode}
              </Typography>
              <CopyToClipboard text={barcode} onCopy={handleCopy}>
                <button className="copy-button" type="button">
                  {copied ? (
                    <>
                      <span>Copiado</span>
                      <FaCheckCircle size={18} />
                    </>
                  ) : (
                    <>
                      <span>Copiar linha digitável</span>
                      <FaCopy size={18} />
                    </>
                  )}
                </button>
              </CopyToClipboard>
            </>
          )}

          {boletoUrl && (
            <Button
              variant="contained"
              color="primary"
              style={{ marginTop: 16 }}
              startIcon={<FaExternalLinkAlt />}
              href={boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir PDF do Boleto
            </Button>
          )}

          <Typography
            variant="caption"
            color="textSecondary"
            style={{ marginTop: 16 }}
          >
            Após o pagamento, a confirmação pode levar até 1 dia útil.
          </Typography>
        </SuccessContent>
      </React.Fragment>
    );
  }

  // PIX (padrão)
  const pixString = pix?.qrcode?.qrcode || "";

  return (
    <React.Fragment>
      <Total>
        <span>TOTAL</span>
        <strong>R${valorFormatado}</strong>
      </Total>
      <SuccessContent>
        <QRCode
          value={pixString}
          style={{
            borderStyle: "solid",
            borderWidth: "1px",
            padding: "5px",
            borderColor: "black",
            backgroundColor: "white",
            height: "auto",
            maxWidth: "100%"
          }}
        />
        <CopyToClipboard text={pixString} onCopy={handleCopy}>
          <button className="copy-button" type="button">
            {copied ? (
              <>
                <span>Copiado</span>
                <FaCheckCircle size={18} />
              </>
            ) : (
              <>
                <span>Copiar código QR</span>
                <FaCopy size={18} />
              </>
            )}
          </button>
        </CopyToClipboard>
        <span>
          Para finalizar, basta realizar o pagamento escaneando ou colando o
          código Pix acima :)
        </span>
      </SuccessContent>
    </React.Fragment>
  );
}

export default CheckoutSuccess;
