import React from "react";
import { Link } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import * as Accordion from "@radix-ui/react-accordion";
import ResumoFilas from "./ResumoFilas";
import {
  Workflow,
  Clock,
  MessageSquare,
  Palette,
  Users,
  Plug,
  Building,
  Bot,
  CreditCard,
  Languages,
  Handshake,
  BookOpen,
  SlidersHorizontal,
  Phone,
  ChevronDown,
  ArrowUpRight,
  CircleDot
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import { useIdentidade } from "../interface";
import "./central.css";

export default function CentralConfiguracoes({
  conteudo,
  aoAlternar,
  superusuario,
  administrador,
  horarios,
  voz
}) {
  const identidade = useIdentidade();
  const grupos = [
    {
      id: "atendimento",
      icone: MessageSquare,
      itens: [
        { chave: "filas", icone: Workflow, to: "/queues" },
        { chave: "fluxos", icone: Workflow, to: "/fluxos" },
        ...(horarios
          ? [{ chave: "horarios", icone: Clock, aba: "schedules" }]
          : []),
        { chave: "mensagens", icone: MessageSquare, to: "/quick-messages" },
        { chave: "opcoes", icone: SlidersHorizontal, aba: "options" }
      ]
    },
    ...(administrador ? [{ id: "marca", icone: Palette, itens: [] }] : []),
    {
      id: "equipe",
      icone: Users,
      itens: [
        { chave: "usuarios", icone: Users, to: "/users" },
        ...(administrador
          ? [{ chave: "ajuda", icone: BookOpen, aba: "helps" }]
          : [])
      ]
    },
    {
      id: "canais",
      icone: Plug,
      itens: [
        { chave: "conexoes", icone: Plug, to: "/connections" },
        { chave: "integracoes", icone: Plug, to: "/chatgpt" },
        ...(administrador && voz
          ? [{ chave: "voz", icone: Phone, aba: "voiceCalls" }]
          : [])
      ]
    },
    ...(superusuario
      ? [
          {
            id: "administracao",
            icone: Building,
            itens: [
              { chave: "empresas", icone: Building, aba: "companies" },
              { chave: "luizaAgent", icone: Bot, aba: "agent" },
              {
                chave: "statusWhatsapp",
                icone: CircleDot,
                aba: "whatsappStatus"
              },
              { chave: "planos", icone: CreditCard, aba: "plans" },
              { chave: "parceiros", icone: Handshake, aba: "partners" },
              { chave: "pagamentos", icone: CreditCard, aba: "paymentGateway" },
              { chave: "traducoes", icone: Languages, aba: "i18n" }
            ]
          }
        ]
      : [])
  ];
  return (
    <Tabs.Root
      defaultValue="atendimento"
      className="ew-ui central-configuracoes"
      style={identidade}
    >
      <Tabs.List
        className="ew-tabs"
        aria-label={i18n.t("centralConfig.secoes")}
      >
        {grupos.map(grupo => (
          <Tabs.Trigger key={grupo.id} value={grupo.id} className="ew-tab">
            <grupo.icone size={15} />
            {grupo.id === "marca"
              ? i18n.t("loginExperience.brandTab")
              : i18n.t(`centralConfig.${grupo.id}`)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {grupos.map(grupo => (
        <Tabs.Content key={grupo.id} value={grupo.id}>
          {grupo.id === "marca" ? (
            conteudo("whitelabel")
          ) : (
            <Accordion.Root
              type="multiple"
              onValueChange={aoAlternar}
              defaultValue={grupo.id === "atendimento" ? ["filas"] : []}
              className="central-config-secoes"
            >
              {grupo.itens.map(item => (
                <Accordion.Item
                  key={item.chave}
                  value={item.chave}
                  className="central-config-secao"
                >
                  <Accordion.Header className="central-config-cabecalho">
                    <Accordion.Trigger className="central-config-gatilho">
                      <span className="central-config-icone">
                        <item.icone size={20} />
                      </span>
                      <span className="central-config-texto">
                        <strong>
                          {i18n.t(`centralConfig.itens.${item.chave}.titulo`)}
                        </strong>
                        <span>
                          {i18n.t(
                            `centralConfig.itens.${item.chave}.descricao`
                          )}
                        </span>
                      </span>
                      <ChevronDown size={17} className="central-config-seta" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="central-config-conteudo">
                    <div>
                      {item.chave === "filas" ? (
                        <ResumoFilas />
                      ) : item.to ? (
                        <Link to={item.to} className="ew-button">
                          {i18n.t(`centralConfig.itens.${item.chave}.titulo`)}
                          <ArrowUpRight size={15} />
                        </Link>
                      ) : (
                        conteudo(item.aba)
                      )}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          )}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
