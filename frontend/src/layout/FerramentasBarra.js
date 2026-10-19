import React, { useState } from "react";
import Popover from "@material-ui/core/Popover";
import { MoreHorizontal } from "lucide-react";
import { BotaoIcone, useIdentidade } from "../components/interface";
import { i18n } from "../translate/i18n";

export default function FerramentasBarra({ children }) {
  const identidade = useIdentidade();
  const [anchorEl, setAnchorEl] = useState(null);
  const aberta = Boolean(anchorEl);
  return (
    <>
      <BotaoIcone
        titulo={i18n.t("visual.ferramentas")}
        variante="ghost"
        aria-haspopup="dialog"
        aria-expanded={aberta}
        onClick={evento => setAnchorEl(aberta ? null : evento.currentTarget)}
      >
        <MoreHorizontal size={19} />
      </BotaoIcone>
      <Popover
        open={aberta}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        // Chat/announcement children keep their live notification subscriptions.
        // A closed MUI modal leaves Escape available to the conversation.
        keepMounted
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          className: "ew-ui barra-ferramentas",
          style: { ...identidade, marginTop: 12 },
          role: "dialog",
          "aria-label": i18n.t("visual.ferramentas")
        }}
      >
        <strong>{i18n.t("visual.ferramentas")}</strong>
        <div>{children}</div>
      </Popover>
    </>
  );
}
