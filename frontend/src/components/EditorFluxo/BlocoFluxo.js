import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { i18n } from "../../translate/i18n";
import { catalogo } from "./catalogo";
import { terminais } from "./modeloFluxo";

export default memo(function BlocoFluxo({ data, selected }) {
  const { no, filhos, fila } = data;
  const Icone =
    catalogo.find(item => item.kind === no.kind)?.icone || catalogo[1].icone;
  return (
    <article
      className={`fluxo-bloco ${selected ? "selecionado" : ""} ${!no.isActive ? "pausado" : ""}`}
    >
      {no.kind !== "inicio" && (
        <Handle
          type="target"
          position={Position.Left}
          aria-label={i18n.t("fluxos.entrada")}
        />
      )}
      <header>
        <span className={`fluxo-bloco-icone tipo-${no.kind}`}>
          <Icone size={15} />
        </span>
        <span>{i18n.t(`fluxos.tipos.${no.kind}`)}</span>
        {!no.isActive && (
          <span className="ew-badge">{i18n.t("fluxos.pausado")}</span>
        )}
      </header>
      <div className="fluxo-bloco-corpo">
        <strong>{no.title}</strong>
        <p>{no.message || i18n.t("fluxos.semMensagem")}</p>
        {no.mediaName && <span className="ew-badge">{no.mediaName}</span>}
        {fila && <span className="ew-badge ew-badge--brand">{fila}</span>}
        {filhos.length > 0 && (
          <div className="fluxo-opcoes">
            {filhos.slice(0, 4).map((filho, indice) => (
              <div key={filho.id}>
                <b>{indice + 1}</b>
                <span>{filho.title}</span>
              </div>
            ))}
            {filhos.length > 4 && <small>+{filhos.length - 4}</small>}
          </div>
        )}
      </div>
      {!terminais.includes(no.kind) && (
        <Handle
          type="source"
          position={Position.Right}
          aria-label={i18n.t("fluxos.saida")}
        />
      )}
    </article>
  );
});
