import React from "react";
import StardewBusinessGlyph from "../../components/StardewBusinessGlyph";
import { i18n } from "../../translate/i18n";
import "./campanhas.css";
const indicadores = [
  ["EM_ANDAMENTO", "emAndamento"],
  ["PROGRAMADA", "agendadas"],
  ["FINALIZADA", "concluidas"],
  ["INATIVA", "inativas"]
];
export default function IndicadoresCampanhas({ campanhas }) {
  return (
    <div className="campanhas-indicadores">
      {indicadores.map(([status, chave]) => (
        <div
          className={`campanha-indicador sd-campaign-${status}`}
          key={status}
        >
          <p>{i18n.t(`visual.${chave}`)}</p>
          <strong>
            <StardewBusinessGlyph variant="seed" />
            {campanhas.filter(campanha => campanha.status === status).length}
          </strong>
          <small>{i18n.t("visual.campanhasPagina")}</small>
        </div>
      ))}
    </div>
  );
}
