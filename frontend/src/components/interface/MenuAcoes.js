import React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { Botao, BotaoIcone, useIdentidade } from ".";
import { i18n } from "../../translate/i18n";

export default function MenuAcoes({
  itens,
  rotulo,
  icone: Icone,
  compacto = true
}) {
  const identidade = useIdentidade();
  const titulo = rotulo || i18n.t("visual.acoes");
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        {compacto ? (
          <BotaoIcone titulo={titulo} variante="ghost">
            {Icone ? <Icone size={17} /> : <MoreHorizontal size={18} />}
          </BotaoIcone>
        ) : (
          <Botao>
            {Icone && <Icone size={16} />}
            {titulo}
            <ChevronDown size={14} />
          </Botao>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className="ew-ui ew-menu"
          style={identidade}
          align="end"
          sideOffset={6}
        >
          {itens.filter(Boolean).map((item, indice) => (
            <Menu.Item
              key={item.id || indice}
              className={`ew-menu-item ${item.perigo ? "ew-menu-item--perigo" : ""}`}
              disabled={item.desabilitado}
              onSelect={item.aoSelecionar}
            >
              {item.icone && <item.icone size={16} />}
              {item.rotulo}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
