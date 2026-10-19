import React from "react";
import { i18n } from "../../translate/i18n";
import "../../components/TabelaDados/tabela.css";

export default function FilasAoVivo({ abertas, pendentes }) {
  const filas = [...new Set([...abertas, ...pendentes].map(fila => fila.name))];
  return (
    <section className="painel-card painel-tabela">
      <h2>{i18n.t("visual.filasAgora")}</h2>
      <div className="tabela-dados">
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>{i18n.t("visual.fila")}</th>
                <th>{i18n.t("dashboard.ticketsOpen")}</th>
                <th>{i18n.t("dashboard.ticketsWaiting")}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(nome => (
                <tr key={nome}>
                  <td>{nome}</td>
                  <td>
                    {abertas.find(fila => fila.name === nome)?.value || 0}
                  </td>
                  <td>
                    {pendentes.find(fila => fila.name === nome)?.value || 0}
                  </td>
                </tr>
              ))}
              {!filas.length && (
                <tr>
                  <td colSpan={3}>{i18n.t("visual.semResultados")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
