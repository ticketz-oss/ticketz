import React, { useState } from "react";
import { RotateCcw, Paperclip } from "lucide-react";
import { i18n } from "../../translate/i18n";
import { Botao } from "../interface";
import { filhosDe, terminais } from "./modeloFluxo";

export default function SimuladorFluxo({ fluxo, filas }) {
  const inicio = fluxo.nodes.find(no => no.kind === "inicio");
  const [caminho, setCaminho] = useState([inicio]);
  const atual = caminho[caminho.length - 1];
  const opcoes = filhosDe(fluxo, atual.id).filter(no => no.isActive);
  return (
    <div className="ew-dialog-body">
      <div className="fluxo-simulacao" aria-live="polite">
        {caminho.map((no, indice) => (
          <React.Fragment key={`${no.id}-${indice}`}>
            {indice > 0 && <div className="fluxo-resposta">{no.title}</div>}
            {no.message && <div className="fluxo-mensagem">{no.message}</div>}
            {no.mediaName && (
              <div className="fluxo-mensagem">
                <Paperclip size={14} /> {no.mediaName}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {terminais.includes(atual.kind) ? (
        <p className="ew-muted">
          {atual.kind === "humano"
            ? i18n.t("fluxos.simulacaoHumano")
            : i18n.t("fluxos.simulacaoTransferencia", {
                fila: filas.find(fila => fila.id === atual.forwardQueueId)?.name
              })}
        </p>
      ) : (
        <div className="fluxo-simulacao-opcoes">
          {opcoes.map((no, indice) => (
            <Botao key={no.id} onClick={() => setCaminho([...caminho, no])}>
              {indice + 1}. {no.title}
            </Botao>
          ))}
          {!opcoes.length && (
            <p className="ew-muted">{i18n.t("fluxos.simulacaoFim")}</p>
          )}
        </div>
      )}
      <Botao onClick={() => setCaminho([inicio])}>
        <RotateCcw size={15} />
        {i18n.t("fluxos.reiniciar")}
      </Botao>
    </div>
  );
}
