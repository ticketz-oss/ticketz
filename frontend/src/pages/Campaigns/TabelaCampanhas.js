import React, { useMemo } from "react";
import {
  Pencil,
  Pause,
  Play,
  Trash2,
  ChartNoAxesCombined,
  Eye,
  MessageCircle
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import { useDate } from "../../hooks/useDate";
import TabelaDados from "../../components/TabelaDados";
import MenuAcoes from "../../components/interface/MenuAcoes";

const estados = {
  INATIVA: "inativas",
  PROGRAMADA: "agendadas",
  EM_ANDAMENTO: "emAndamento",
  CANCELADA: "canceladas",
  FINALIZADA: "concluidas"
};

export default function TabelaCampanhas({
  campanhas,
  editar,
  excluir,
  pausar,
  retomar,
  relatorio,
  ...props
}) {
  const { datetimeToClient } = useDate();
  const colunas = useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("visual.campanha"),
        enableHiding: false,
        cell: ({ row: { original: campanha } }) => (
          <div className="campanha-nome">
            <strong>{campanha.name}</strong>
            <small>
              {campanha.scheduledAt
                ? datetimeToClient(campanha.scheduledAt)
                : i18n.t("visual.semAgendamento")}
            </small>
          </div>
        )
      },
      {
        id: "publico",
        header: i18n.t("visual.publico"),
        cell: ({ row }) => row.original.contactList?.name || "—"
      },
      {
        id: "conexao",
        header: i18n.t("visual.conexao"),
        cell: ({ row }) => (
          <span className="ew-badge">
            <MessageCircle size={13} />
            {row.original.whatsapp?.name || "—"}
          </span>
        )
      },
      {
        accessorKey: "completedAt",
        header: i18n.t("campaigns.table.completedAt"),
        cell: ({ getValue }) =>
          getValue()
            ? datetimeToClient(getValue())
            : i18n.t("visual.naoConcluida")
      },
      {
        accessorKey: "confirmation",
        header: i18n.t("visual.confirmacao"),
        cell: ({ getValue }) =>
          i18n.t(getValue() ? "visual.habilitada" : "visual.desabilitada")
      },
      {
        accessorKey: "status",
        header: i18n.t("campaigns.table.status"),
        cell: ({ getValue }) => (
          <span className={`ew-badge campanha-status estado-${getValue()}`}>
            <i />
            {i18n.t(`visual.${estados[getValue()] || "inativas"}`)}
          </span>
        )
      },
      {
        id: "acoes",
        header: i18n.t("visual.acoes"),
        enableHiding: false,
        meta: { classe: "celula-acoes" },
        cell: ({ row: { original: campanha } }) => {
          const editavel =
            campanha.status === "INATIVA" ||
            (campanha.status === "PROGRAMADA" &&
              new Date(campanha.scheduledAt) > new Date(Date.now() + 3600000));
          return (
            <MenuAcoes
              rotulo={i18n.t("visual.acoesContato", { nome: campanha.name })}
              itens={[
                campanha.status === "EM_ANDAMENTO" && {
                  rotulo: i18n.t("visual.pausar"),
                  icone: Pause,
                  aoSelecionar: () => pausar(campanha)
                },
                campanha.status === "CANCELADA" && {
                  rotulo: i18n.t("visual.retomar"),
                  icone: Play,
                  aoSelecionar: () => retomar(campanha)
                },
                {
                  rotulo: i18n.t("visual.relatorio"),
                  icone: ChartNoAxesCombined,
                  aoSelecionar: () => relatorio(campanha)
                },
                {
                  rotulo: i18n.t(
                    editavel ? "visual.editar" : "visual.visualizar"
                  ),
                  icone: editavel ? Pencil : Eye,
                  aoSelecionar: () => editar(campanha)
                },
                {
                  rotulo: i18n.t("visual.excluir"),
                  icone: Trash2,
                  perigo: true,
                  aoSelecionar: () => excluir(campanha)
                }
              ]}
            />
          );
        }
      }
    ],
    [editar, excluir, pausar, retomar, relatorio, datetimeToClient]
  );
  return (
    <TabelaDados
      {...props}
      dados={campanhas}
      colunas={colunas}
      ocultas={{ confirmation: false }}
      rotulo={i18n.t("visual.campanhas")}
    />
  );
}
