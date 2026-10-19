import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@material-ui/core";
import { Workflow } from "lucide-react";
import { i18n } from "../../translate/i18n";

export default function ChatbotFlow({ queueId, onOpen }) {
  return (
    <div className="fluxo-convite" style={{ padding: 40, textAlign: "center" }}>
      <Workflow size={40} />
      <h2>{i18n.t("fluxos.editor")}</h2>
      <p>{i18n.t("fluxos.descricaoEditor")}</p>
      <Button
        component={Link}
        to={`/fluxos/${queueId}`}
        onClick={onOpen}
        variant="contained"
        color="primary"
      >
        {i18n.t("fluxos.abrirEditor")}
      </Button>
    </div>
  );
}
