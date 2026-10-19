import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Menu from "@radix-ui/react-dropdown-menu";
import {
  Check,
  Minus,
  Columns3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Botao, BotaoIcone, useIdentidade } from "../interface";
import { i18n } from "../../translate/i18n";
import "./tabela.css";

function Selecao({ checked, aoMudar, rotulo }) {
  return (
    <Checkbox.Root
      className="ew-checkbox"
      checked={checked}
      onCheckedChange={aoMudar}
      aria-label={rotulo}
    >
      <Checkbox.Indicator>
        {checked === "indeterminate" ? (
          <Minus size={12} />
        ) : (
          <Check size={12} />
        )}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

export default function TabelaDados({
  dados,
  colunas,
  carregando,
  ferramentas,
  selecao,
  aoSelecionar,
  acoesSelecao,
  ocultas = {},
  pagina = 1,
  total,
  proxima,
  aoPaginar,
  rotulo
}) {
  const identidade = useIdentidade();
  const [visibilidade, setVisibilidade] = useState(ocultas);
  const definicoes = useMemo(
    () =>
      aoSelecionar
        ? [
            {
              id: "selecao",
              enableHiding: false,
              header: ({ table }) => (
                <Selecao
                  checked={
                    table.getIsAllRowsSelected() ||
                    (table.getIsSomeRowsSelected() && "indeterminate")
                  }
                  aoMudar={valor => table.toggleAllRowsSelected(!!valor)}
                  rotulo={i18n.t("visual.selecionarPagina")}
                />
              ),
              cell: ({ row }) => (
                <Selecao
                  checked={row.getIsSelected()}
                  aoMudar={valor => row.toggleSelected(!!valor)}
                  rotulo={i18n.t("visual.selecionar", {
                    nome: row.original.name
                  })}
                />
              )
            },
            ...colunas
          ]
        : colunas,
    [colunas, aoSelecionar]
  );
  const tabela = useReactTable({
    data: dados,
    columns: definicoes,
    getRowId: item => String(item.id),
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection: selecao || {}, columnVisibility: visibilidade },
    onRowSelectionChange: aoSelecionar,
    onColumnVisibilityChange: setVisibilidade
  });
  const selecionados = tabela
    .getSelectedRowModel()
    .rows.map(linha => linha.original);
  return (
    <section
      className="ew-ui tabela-dados"
      style={identidade}
      aria-label={rotulo}
      aria-busy={carregando}
    >
      <div className="tabela-ferramentas">
        {ferramentas}
        <Menu.Root>
          <Menu.Trigger asChild>
            <BotaoIcone titulo={i18n.t("visual.colunas")}>
              <Columns3 size={16} />
            </BotaoIcone>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content
              className="ew-ui ew-menu"
              style={identidade}
              align="end"
              sideOffset={6}
            >
              {tabela
                .getAllLeafColumns()
                .filter(coluna => coluna.getCanHide())
                .map(coluna => (
                  <Menu.CheckboxItem
                    className="ew-menu-item"
                    key={coluna.id}
                    checked={coluna.getIsVisible()}
                    onCheckedChange={valor => coluna.toggleVisibility(!!valor)}
                  >
                    <span className="ew-menu-check">
                      <Menu.ItemIndicator>
                        <Check size={14} />
                      </Menu.ItemIndicator>
                    </span>
                    {coluna.columnDef.meta?.rotulo || coluna.columnDef.header}
                  </Menu.CheckboxItem>
                ))}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
      {!!selecionados.length && (
        <div className="tabela-selecao">
          <strong>
            {i18n.t("visual.selecionados", { count: selecionados.length })}
          </strong>
          <div>
            {acoesSelecao?.(selecionados)}
            <Botao variante="ghost" onClick={() => tabela.resetRowSelection()}>
              {i18n.t("visual.limpar")}
            </Botao>
          </div>
        </div>
      )}
      <div className="tabela-rolagem">
        <table>
          <thead>
            {tabela.getHeaderGroups().map(grupo => (
              <tr key={grupo.id}>
                {grupo.headers.map(cabecalho => (
                  <th
                    key={cabecalho.id}
                    scope="col"
                    className={cabecalho.column.columnDef.meta?.classe}
                  >
                    {flexRender(
                      cabecalho.column.columnDef.header,
                      cabecalho.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tabela.getRowModel().rows.map(linha => (
              <tr key={linha.id} aria-selected={linha.getIsSelected()}>
                {linha.getVisibleCells().map(celula => (
                  <td
                    key={celula.id}
                    className={celula.column.columnDef.meta?.classe}
                  >
                    {flexRender(
                      celula.column.columnDef.cell,
                      celula.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {!dados.length && (
              <tr>
                <td
                  colSpan={tabela.getVisibleLeafColumns().length}
                  className="tabela-vazia"
                >
                  {i18n.t(
                    carregando ? "visual.carregando" : "visual.semResultados"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="tabela-rodape">
        <span>
          {i18n.t("visual.exibindo", {
            count: dados.length,
            total: total ?? dados.length
          })}
        </span>
        {aoPaginar && (
          <div>
            <BotaoIcone
              titulo={i18n.t("visual.anterior")}
              disabled={pagina === 1 || carregando}
              onClick={() => aoPaginar(pagina - 1)}
            >
              <ChevronLeft size={15} />
            </BotaoIcone>
            <span className="tabela-pagina">{pagina}</span>
            <BotaoIcone
              titulo={i18n.t("visual.proxima")}
              disabled={!proxima || carregando}
              onClick={() => aoPaginar(pagina + 1)}
            >
              <ChevronRight size={15} />
            </BotaoIcone>
          </div>
        )}
      </footer>
    </section>
  );
}
