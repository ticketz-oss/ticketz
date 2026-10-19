import React, { useMemo } from "react";
import AvatarContato from "../../components/AvatarContato";
import {
  Search,
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  MessageCircle,
  Users
} from "lucide-react";
import Papa from "papaparse";
import { corAvatar } from "../../helpers/coresAvatar";
import { i18n } from "../../translate/i18n";
import { getInitials } from "../../helpers/getInitials";
import TabelaDados from "../../components/TabelaDados";
import MenuAcoes from "../../components/interface/MenuAcoes";
import { Botao, BotaoIcone } from "../../components/interface";

function exportar(contatos) {
  const csv = Papa.unparse(
    contatos.map(contato => ({
      nome: contato.name,
      telefone: contato.number,
      email: contato.email || "",
      apelido: contato.nickname || ""
    })),
    { escapeFormulae: true }
  );
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "contatos-selecionados.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function TabelaContatos({
  contatos,
  carregando,
  total,
  pagina,
  proxima,
  aoPaginar,
  busca,
  aoBuscar,
  aoAtualizar,
  selecao,
  aoSelecionar,
  editar,
  excluir,
  administrador
}) {
  const colunas = useMemo(
    () => [
      {
        accessorKey: "name",
        header: i18n.t("visual.nomeTelefone"),
        enableHiding: false,
        cell: ({ row: { original: contato } }) => (
          <div className="tabela-pessoa">
            <AvatarContato
              contact={contato}
              preview
              style={{ background: corAvatar(contato.number) }}
            >
              {getInitials(contato.name)}
            </AvatarContato>
            <span>
              <strong>{contato.name}</strong>
              <small>{contato.number}</small>
            </span>
          </div>
        )
      },
      {
        accessorKey: "email",
        header: i18n.t("contacts.table.email"),
        cell: ({ getValue }) => getValue() || "—"
      },
      {
        id: "canal",
        header: i18n.t("visual.tipo"),
        cell: ({ row: { original: contato } }) => (
          <span className="ew-badge">
            {contato.isGroup ? (
              <Users size={13} />
            ) : (
              <MessageCircle size={13} />
            )}
            {i18n.t(contato.isGroup ? "contexto.grupos" : "contacts.title")}
          </span>
        )
      },
      {
        id: "etiquetas",
        header: i18n.t("visual.etiquetas"),
        cell: ({ row }) => (
          <div className="tabela-etiquetas">
            {row.original.tags?.length
              ? row.original.tags.map(tag => (
                  <span
                    className="ew-badge"
                    key={tag.id}
                    style={{
                      color: tag.color,
                      background: `color-mix(in srgb, ${tag.color} 9%, var(--ew-surface))`
                    }}
                  >
                    {tag.name}
                  </span>
                ))
              : "—"}
          </div>
        )
      },
      {
        accessorKey: "nickname",
        header: i18n.t("contacts.table.nickname"),
        cell: ({ getValue }) => getValue() || "—"
      },
      {
        id: "aniversario",
        header: i18n.t("contacts.table.birthday"),
        cell: ({ row: { original: contato } }) =>
          contato.birthdayDay && contato.birthdayMonth
            ? `${String(contato.birthdayDay).padStart(2, "0")}/${String(contato.birthdayMonth).padStart(2, "0")}`
            : "—"
      },
      {
        id: "acoes",
        header: i18n.t("contacts.table.actions"),
        enableHiding: false,
        meta: { classe: "celula-acoes" },
        cell: ({ row: { original: contato } }) => (
          <MenuAcoes
            rotulo={i18n.t("visual.acoesContato", { nome: contato.name })}
            itens={[
              !contato.isGroup && {
                rotulo: i18n.t("redesign.abrirAtendimento"),
                icone: MessageCircle,
                aoSelecionar: () =>
                  window.mentionClick({
                    contactId: contato.id,
                    name: contato.name,
                    number: contato.number
                  })
              },
              {
                rotulo: i18n.t("visual.editar"),
                icone: Pencil,
                aoSelecionar: () => editar(contato.id)
              },
              administrador && {
                rotulo: i18n.t("visual.excluir"),
                icone: Trash2,
                perigo: true,
                aoSelecionar: () => excluir(contato)
              }
            ]}
          />
        )
      }
    ],
    [editar, excluir, administrador]
  );
  return (
    <TabelaDados
      dados={contatos}
      colunas={colunas}
      carregando={carregando}
      total={total}
      pagina={pagina}
      proxima={proxima}
      aoPaginar={aoPaginar}
      selecao={selecao}
      aoSelecionar={administrador ? aoSelecionar : undefined}
      ocultas={{ nickname: false, aniversario: false }}
      rotulo={i18n.t("contacts.title")}
      ferramentas={
        <>
          <label className="tabela-busca">
            <Search size={16} />
            <input
              type="search"
              aria-label={i18n.t("visual.buscarContatos")}
              placeholder={i18n.t("visual.buscarContatos")}
              value={busca}
              onChange={aoBuscar}
            />
          </label>
          <BotaoIcone
            titulo={i18n.t("visual.atualizar")}
            onClick={aoAtualizar}
            disabled={carregando}
          >
            <RefreshCw size={16} />
          </BotaoIcone>
        </>
      }
      acoesSelecao={selecionados => (
        <Botao onClick={() => exportar(selecionados)}>
          <Download size={15} />
          {i18n.t("visual.exportar")}
        </Botao>
      )}
    />
  );
}
