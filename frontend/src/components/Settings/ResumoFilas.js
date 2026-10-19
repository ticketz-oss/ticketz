import React, { useEffect, useState } from "react";
import { Pencil, Plus, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { Botao, BotaoIcone } from "../interface";
import "../TabelaDados/tabela.css";
import QueueModal from "../QueueModal";

export default function ResumoFilas() {
  const [filas, setFilas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(undefined);
  const carregar = async () => {
    try {
      const { data } = await api.get("/queue");
      setFilas(data);
    } catch (erro) {
      toastError(erro);
    } finally {
      setCarregando(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);
  return (
    <>
      <div className="tabela-dados">
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>{i18n.t("visual.fila")}</th>
                <th>{i18n.t("visual.saudacao")}</th>
                <th>{i18n.t("visual.automacao")}</th>
                <th className="celula-acoes">{i18n.t("visual.acoes")}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(fila => (
                <tr key={fila.id}>
                  <td>
                    <span className="fila-nome">
                      <i style={{ background: fila.color }} />
                      <strong>{fila.name}</strong>
                    </span>
                  </td>
                  <td>{fila.greetingMessage || "—"}</td>
                  <td>
                    <Link
                      className="ew-button ew-button--ghost"
                      to={`/fluxos/${fila.id}`}
                    >
                      <Workflow size={14} />
                      {i18n.t("visual.editor")}
                    </Link>
                  </td>
                  <td className="celula-acoes">
                    <BotaoIcone
                      titulo={i18n.t("visual.editarFila", { nome: fila.name })}
                      variante="ghost"
                      onClick={() => setEditando(fila.id)}
                    >
                      <Pencil size={16} />
                    </BotaoIcone>
                  </td>
                </tr>
              ))}
              {!filas.length && (
                <tr>
                  <td colSpan={4}>
                    {i18n.t(
                      carregando ? "visual.carregando" : "visual.semResultados"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Botao style={{ marginTop: 16 }} onClick={() => setEditando(null)}>
        <Plus size={15} />
        {i18n.t("visual.novaFila")}
      </Botao>
      <QueueModal
        open={editando !== undefined}
        queueId={editando}
        onClose={() => {
          setEditando(undefined);
          carregar();
        }}
      />
    </>
  );
}
