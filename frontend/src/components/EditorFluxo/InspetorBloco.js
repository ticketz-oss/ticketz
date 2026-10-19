import React from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Unplug,
  X,
  Plus,
  Paperclip
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import { Alternador, Botao, BotaoIcone } from "../interface";
import { catalogo } from "./catalogo";
import { filhosDe, podeConectar, terminais } from "./modeloFluxo";

export default function InspetorBloco({
  no,
  fluxo,
  filas,
  atualizar,
  conectar,
  remover,
  fechar,
  adicionar,
  mover,
  anexar,
  arquivo,
  removerMidia
}) {
  const filhos = filhosDe(fluxo, no.id);
  const nomeMidia = arquivo === null ? "" : arquivo?.name || no.mediaName;
  const pai = fluxo.edges.find(aresta => aresta.target === no.id)?.source || "";
  return (
    <aside className="fluxo-painel fluxo-inspetor">
      <header className="ew-panel-head">
        <h3>{i18n.t(`fluxos.tipos.${no.kind}`)}</h3>
        <BotaoIcone titulo={i18n.t("fluxos.fechar")} onClick={fechar}>
          <X size={16} />
        </BotaoIcone>
      </header>
      <div className="fluxo-painel-corpo">
        <label className="ew-field">
          {i18n.t("fluxos.nomeBloco")}
          <input
            className="ew-input"
            readOnly={no.kind === "inicio"}
            value={no.title}
            maxLength={200}
            onChange={event => atualizar({ title: event.target.value })}
          />
        </label>
        {no.kind !== "inicio" && (
          <label className="ew-field">
            {i18n.t("fluxos.tipoBloco")}
            <select
              className="ew-select"
              value={no.kind}
              onChange={event =>
                atualizar({ kind: event.target.value, forwardQueueId: null })
              }
            >
              {catalogo
                .filter(
                  item =>
                    item.kind !== "inicio" &&
                    (!filhos.length || !terminais.includes(item.kind))
                )
                .map(item => (
                  <option key={item.kind} value={item.kind}>
                    {i18n.t(`fluxos.tipos.${item.kind}`)}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="ew-field">
          {i18n.t("fluxos.mensagem")}
          <textarea
            className="ew-textarea"
            value={no.message}
            maxLength={20000}
            onChange={event => atualizar({ message: event.target.value })}
          />
        </label>
        <p className="ew-muted">
          {i18n.t("fluxos.variaveis", {
            name: "{{name}}",
            firstname: "{{firstname}}",
            queue: "{{queue}}"
          })}
        </p>
        {no.kind === "transferir" && (
          <label className="ew-field">
            {i18n.t("fluxos.filaDestino")}
            <select
              className="ew-select"
              value={no.forwardQueueId || ""}
              onChange={event =>
                atualizar({
                  forwardQueueId: Number(event.target.value) || null
                })
              }
            >
              <option value="">{i18n.t("fluxos.selecionarFila")}</option>
              {filas.map(fila => (
                <option key={fila.id} value={fila.id}>
                  {fila.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {no.kind === "humano" && (
          <p className="ew-muted">{i18n.t("fluxos.descricaoHumano")}</p>
        )}
        {no.kind !== "inicio" && (
          <section className="fluxo-grupo">
            <h4>{i18n.t("fluxos.midia")}</h4>
            <label className="ew-button fluxo-anexar">
              <Paperclip size={15} />
              {nomeMidia || i18n.t("fluxos.anexar")}
              <input
                type="file"
                aria-label={i18n.t("fluxos.anexar")}
                onChange={event => anexar(event.target.files[0])}
              />
            </label>
            {nomeMidia && (
              <Botao variante="ghost" onClick={removerMidia}>
                {i18n.t("fluxos.removerMidia")}
              </Botao>
            )}
          </section>
        )}
        {!terminais.includes(no.kind) && (
          <section className="fluxo-grupo">
            <h4>{i18n.t("fluxos.opcoes")}</h4>
            {filhos.map((filho, indice) => (
              <div className="fluxo-editor-opcao" key={filho.id}>
                <b>
                  {filho.isActive
                    ? filhos.slice(0, indice + 1).filter(item => item.isActive)
                        .length
                    : "—"}
                </b>
                <span>{filho.title}</span>
                <BotaoIcone
                  titulo={i18n.t("fluxos.subir")}
                  disabled={!indice}
                  onClick={() => mover(filho.id, -1)}
                >
                  <ArrowUp size={13} />
                </BotaoIcone>
                <BotaoIcone
                  titulo={i18n.t("fluxos.descer")}
                  disabled={indice === filhos.length - 1}
                  onClick={() => mover(filho.id, 1)}
                >
                  <ArrowDown size={13} />
                </BotaoIcone>
              </div>
            ))}
            <Botao variante="ghost" onClick={() => adicionar("mensagem")}>
              <Plus size={15} />
              {i18n.t("fluxos.adicionarOpcao")}
            </Botao>
          </section>
        )}
        {no.kind !== "inicio" && (
          <section className="fluxo-grupo">
            <label className="ew-field">
              {i18n.t("fluxos.conectadoA")}
              <select
                className="ew-select"
                value={pai}
                onChange={event => conectar(event.target.value, no.id)}
              >
                <option value="">{i18n.t("fluxos.semConexao")}</option>
                {fluxo.nodes
                  .filter(item => podeConectar(fluxo, item.id, no.id))
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </label>
            <Alternador
              rotulo={i18n.t("fluxos.blocoAtivo")}
              checked={no.isActive}
              onCheckedChange={isActive => atualizar({ isActive })}
            />
            <div className="fluxo-inspetor-acoes">
              <Botao disabled={!pai} onClick={() => conectar("", no.id)}>
                <Unplug size={15} />
                {i18n.t("fluxos.desconectar")}
              </Botao>
              <Botao variante="danger" onClick={remover}>
                <Trash2 size={15} />
                {i18n.t("fluxos.excluir")}
              </Botao>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
