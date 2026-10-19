import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { i18n } from "../translate/i18n";

const titulos = {
  "": "redesign.visaoGeral",
  contacts: "contacts.title",
  tickets: "visual.centralAtendimento",
  settings: "settings.title",
  campaigns: "campaigns.title",
  fluxos: "fluxos.titulo",
  queues: "queues.title",
  schedules: "schedules.title",
  chats: "mainDrawer.listItems.chats"
};

export default function CaminhoPagina({ organizacao }) {
  const { pathname } = useLocation();
  const chave = titulos[pathname.split("/")[1]];
  return (
    <nav className="caminho-pagina" aria-label={i18n.t("visual.trilha")}>
      <Link to="/">{organizacao}</Link>
      {chave && (
        <>
          <ChevronRight size={14} />
          <strong aria-current="page">{i18n.t(chave)}</strong>
        </>
      )}
    </nav>
  );
}
