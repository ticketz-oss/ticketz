import {
  Zap,
  MessageSquare,
  ListChecks,
  Image,
  Workflow,
  Headset
} from "lucide-react";
export const catalogo = [
  { kind: "inicio", icone: Zap, grupo: "conversa" },
  { kind: "mensagem", icone: MessageSquare, grupo: "conversa" },
  { kind: "menu", icone: ListChecks, grupo: "conversa" },
  { kind: "midia", icone: Image, grupo: "conversa" },
  { kind: "transferir", icone: Workflow, grupo: "atendimento" },
  { kind: "humano", icone: Headset, grupo: "atendimento" }
];
