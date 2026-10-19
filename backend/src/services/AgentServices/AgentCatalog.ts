// Owned schemas only. No user/model input can select arbitrary tables or fields.
export type AgentResource = {
  key: string;
  table: string;
  fields: string[];
  scope?: string;
  search?: string[];
};
export type AgentModule = {
  key: string;
  title: string;
  description: string;
  usage: string;
  admin?: boolean;
  resources: AgentResource[];
};
const resource = (
  key: string,
  table: string,
  fields: string,
  scope = "tenant",
  search = ""
): AgentResource => ({
  key,
  table,
  fields: fields.split(" "),
  scope,
  search: search ? search.split(" ") : []
});
export const AGENT_MODULES: AgentModule[] = [
  {
    key: "atendimentos",
    title: "Atendimentos",
    description:
      "Conversas, mensagens, notas, acompanhamento e avaliações autorizados.",
    usage:
      "Consulte status, responsáveis, fila e histórico. Mensagens excluídas não são disponibilizadas. Use métricas para totais, e mensagens para análises qualitativas.",
    resources: [
      resource(
        "tickets",
        "Tickets",
        "id status channel lastMessage isGroup userId contactId queueId whatsappId createdAt updatedAt",
        "tickets",
        "lastMessage"
      ),
      resource(
        "messages",
        "Messages",
        "id ticketId contactId fromMe body mediaType isEdited createdAt updatedAt",
        "messages",
        "body"
      ),
      resource(
        "notes",
        "TicketNotes",
        "id ticketId userId note createdAt updatedAt",
        "ticketChild",
        "note"
      ),
      resource(
        "tracking",
        "TicketTraking",
        "id ticketId userId whatsappId rated expired chatbotendAt queuedAt startedAt finishedAt ratingAt waitTime serviceTime createdAt updatedAt",
        "ticketChild"
      ),
      resource(
        "ratings",
        "UserRatings",
        "id ticketId userId rate createdAt updatedAt",
        "ticketChild"
      )
    ]
  },
  {
    key: "chat-interno",
    title: "Chat interno",
    description:
      "Somente chats dos quais o usuário participa e respectivas mensagens.",
    usage:
      "O chat interno permite comunicação entre colaboradores. Participação é obrigatória, inclusive para administradores.",
    resources: [
      resource(
        "chats",
        "Chats",
        "id title ownerId lastMessage createdAt updatedAt",
        "chats",
        "title lastMessage"
      ),
      resource(
        "chat-messages",
        "ChatMessages",
        "id chatId senderId message mediaType mediaName createdAt updatedAt",
        "chatChild",
        "message"
      )
    ]
  },
  {
    key: "tarefas",
    title: "Tarefas",
    description:
      "Quadro, tarefas pessoais, da empresa e de filas conforme a visibilidade.",
    usage:
      "Colunas organizam o andamento. targetType GLOBAL é da empresa, USER é pessoal e QUEUE depende da fila. completedAt indica conclusão.",
    resources: [
      resource(
        "tasks",
        "TaskBoardTasks",
        "id title description targetType assignedUserId assignedQueueId dueAt completedAt columnId createdById completedById version createdAt updatedAt",
        "tasks",
        "title description"
      ),
      resource(
        "task-columns",
        "TaskBoardColumns",
        "id title position isDone color createdAt updatedAt"
      ),
      resource(
        "task-events",
        "TaskBoardEvents",
        "id taskId userId eventType fromColumnId toColumnId createdAt",
        "taskChild"
      )
    ]
  },
  {
    key: "contatos",
    title: "Contatos",
    description: "Cadastro, dados adicionais e identificação de anexos.",
    usage:
      "Contatos representam clientes ou grupos. Aniversário contém dia e mês, não idade. Campos adicionais complementam o cadastro.",
    resources: [
      resource(
        "contacts",
        "Contacts",
        "id name nickname number email birthdayDay birthdayMonth channel isGroup language disableBot createdAt updatedAt",
        "tenant",
        "name nickname number email"
      ),
      resource(
        "contact-fields",
        "ContactCustomFields",
        "id contactId name value createdAt updatedAt",
        "contactChild",
        "name value"
      )
    ]
  },
  {
    key: "tags",
    title: "Tags",
    description:
      "Etiquetas e vínculos com contatos e atendimentos autorizados.",
    usage:
      "Tags classificam registros. Vínculos só são retornados se o módulo e o registro associado também estiverem liberados.",
    resources: [
      resource(
        "tags",
        "Tags",
        "id name color createdAt updatedAt",
        "tenant",
        "name"
      ),
      resource(
        "contact-tags",
        "ContactTags",
        "id contactId tagId",
        "contactTag"
      ),
      resource("ticket-tags", "TicketTags", "id ticketId tagId", "ticketTag")
    ]
  },
  {
    key: "agendamentos",
    title: "Agendamentos",
    description:
      "Mensagens programadas, públicos, entregas e datas comemorativas.",
    usage:
      "ONCE é envio único; BIRTHDAY e COMMEMORATIVE são recorrentes. active, nextRunAt, sentCount e errorCount descrevem o estado. Consultar não envia mensagens.",
    resources: [
      resource(
        "schedules",
        "Schedules",
        "id body kind audienceMode sendAt sendTime timezone nextRunAt sentAt contactId userId active status totalRecipients sentCount errorCount mediaName mediaType createdAt updatedAt",
        "tenant",
        "body"
      ),
      resource(
        "schedule-deliveries",
        "ScheduleDeliveries",
        "id scheduleId contactId status sentAt createdAt updatedAt",
        "scheduleChild"
      ),
      resource(
        "schedule-audience",
        "ScheduleAudienceContacts",
        "id scheduleId contactId",
        "scheduleChild"
      ),
      resource(
        "commemorative-dates",
        "CommemorativeDates",
        "id name ruleType month day weekday createdAt updatedAt",
        "tenant",
        "name"
      )
    ]
  },
  {
    key: "fluxos-e-automacoes",
    title: "Fluxos e automações",
    description:
      "Estrutura dos fluxos e configuração das automações da empresa.",
    usage:
      "As opções encadeadas da fila compõem o fluxo. Os descendentes herdam a empresa da fila raiz. Ler uma automação não a executa.",
    admin: true,
    resources: [
      resource(
        "flow-options",
        "QueueOptions",
        "id title message option order isActive queueId parentId forwardQueueId exitChatbot mediaName createdAt updatedAt",
        "queueOptions",
        "title message"
      ),
      resource(
        "automations",
        "ProspeccaoAutomacoes",
        "id enabled userId whatsappId minDelaySeconds maxDelaySeconds dailyLimit createdAt updatedAt"
      )
    ]
  },
  {
    key: "filas-e-chatbot",
    title: "Filas e chatbot",
    description: "Filas, horários e mensagens configuradas.",
    usage:
      "Filas distribuem atendimentos. Horários e mensagens definem a recepção e o atendimento fora do expediente.",
    resources: [
      resource(
        "queues",
        "Queues",
        "id name color greetingMessage outOfHoursMessage schedules order createdAt updatedAt",
        "queues",
        "name"
      )
    ]
  },
  {
    key: "respostas-rapidas",
    title: "Respostas rápidas",
    description:
      "Modelos de mensagens visíveis segundo a configuração individual ou da empresa.",
    usage:
      "Respostas rápidas são modelos para uso posterior. Não são mensagens já enviadas.",
    resources: [
      resource(
        "quick-messages",
        "QuickMessages",
        "id shortcode message userId createdAt updatedAt",
        "quickMessages",
        "shortcode message"
      )
    ]
  },
  {
    key: "informativos",
    title: "Informativos",
    description:
      "Comunicados ativos destinados ao usuário, suas filas ou perfil.",
    usage:
      "Um comunicado pode ser global ou da empresa, e ter prazo e público segmentado.",
    resources: [
      resource(
        "announcements",
        "Announcements",
        "id title text priority startsAt endsAt mediaName createdAt updatedAt",
        "announcements",
        "title text"
      )
    ]
  },
  {
    key: "usuarios",
    title: "Usuários",
    description: "Equipe, nomes, perfis e vínculos de filas; sem credenciais.",
    usage:
      "Usuários são colaboradores. profile controla acesso e UserQueues relaciona colaboradores às filas.",
    resources: [
      resource(
        "users",
        "Users",
        "id name email profile createdAt updatedAt",
        "tenant",
        "name email"
      ),
      resource("user-queues", "UserQueues", "id userId queueId", "userQueue")
    ]
  },
  {
    key: "campanhas",
    title: "Campanhas",
    description: "Campanhas, mensagens e entregas da empresa.",
    usage:
      "Campanhas têm estados e públicos próprios. Mensagens configuradas não comprovam que foram entregues.",
    admin: true,
    resources: [
      resource(
        "campaigns",
        "Campaigns",
        "id name status message1 message2 message3 message4 message5 confirmation scheduledAt completedAt contactListId whatsappId mediaName createdAt updatedAt",
        "tenant",
        "name message1"
      ),
      resource(
        "campaign-shipping",
        "CampaignShipping",
        "id campaignId contactId number message confirmationMessage confirmation deliveredAt confirmationRequestedAt confirmedAt createdAt updatedAt",
        "campaignChild",
        "number message"
      )
    ]
  },
  {
    key: "listas-de-contatos",
    title: "Listas de contatos",
    description: "Listas e seus integrantes.",
    usage: "Listas definem públicos usados em campanhas.",
    admin: true,
    resources: [
      resource(
        "contact-lists",
        "ContactLists",
        "id name createdAt updatedAt",
        "tenant",
        "name"
      ),
      resource(
        "contact-list-items",
        "ContactListItems",
        "id name number email contactListId createdAt updatedAt",
        "listChild",
        "name number email"
      )
    ]
  },
  {
    key: "prospeccao",
    title: "Prospecção",
    description: "Leads registrados, execuções e agendamento da prospecção.",
    usage:
      "Use somente leads já registrados. Esta integração não pesquisa pessoas fora do sistema nem dispara prospecção.",
    admin: true,
    resources: [
      resource(
        "leads",
        "ProspeccaoLeads",
        "id nome telefone categoria endereco instagramHandle instagramBio instagramSeguidores idiomaSugerido status rascunho contactId ticketId origin deliveryStatus scheduledSendAt autoSentAt repliedAt closeDueAt createdAt updatedAt",
        "tenant",
        "nome categoria"
      ),
      resource(
        "prospecting-runs",
        "ProspeccaoExecucoes",
        "id scheduleId localDate status totalLeads newLeads startedAt finishedAt createdAt updatedAt"
      ),
      resource(
        "prospecting-schedules",
        "ProspeccaoAgendas",
        "id automationId time nicho countryCode countryName stateCode stateName cityName maxResults product tone onlyWhatsapp createdAt updatedAt",
        "prospectingChild"
      )
    ]
  },
  {
    key: "conexoes",
    title: "Conexões",
    description:
      "Canais conectados e estado operacional; sem sessões ou chaves.",
    usage:
      "Conexões representam canais da empresa. Nunca expor QR codes, sessões, tokens ou configuração de provedores.",
    admin: true,
    resources: [
      resource(
        "connections",
        "Whatsapps",
        "id name status channel provider isDefault language greetingMessage farewellMessage outOfHoursMessage createdAt updatedAt",
        "tenant",
        "name"
      )
    ]
  },
  {
    key: "chamadas",
    title: "Chamadas",
    description:
      "Histórico de chamadas autorizado e transcrições já existentes.",
    usage:
      "Transcrições só aparecem quando já processadas. Não interpretar áudios ou gravações sem transcrição.",
    resources: [
      resource(
        "calls",
        "VoiceCalls",
        "id direction state queueId userId contactId ticketId startedAt acceptedAt endedAt durationSeconds artifactStatus transcript createdAt updatedAt",
        "calls",
        "transcript"
      )
    ]
  },
  {
    key: "relatorios",
    title: "Relatórios",
    description:
      "Totais e distribuições calculados sobre registros autorizados.",
    usage:
      "As métricas respeitam também o módulo de origem. Use filtros de datas e informe a cobertura.",
    resources: []
  },
  {
    key: "configuracoes",
    title: "Configurações",
    description:
      "Preferências operacionais selecionadas, sem segredos ou configurações da plataforma.",
    usage:
      "Preferências controlam a operação. O catálogo libera apenas chaves explicitamente selecionadas.",
    admin: true,
    resources: [
      resource(
        "settings",
        "Settings",
        "id key value updatedAt",
        "settings",
        "key"
      )
    ]
  },
  {
    key: "financeiro",
    title: "Financeiro",
    description:
      "Faturas e situação financeira da própria empresa; sem dados de pagamento privados.",
    usage:
      "Faturas representam cobranças da empresa atual. Nunca retornar custos da plataforma, parceiros, chaves ou payloads do gateway.",
    admin: true,
    resources: [
      resource(
        "invoices",
        "Invoices",
        "id detail status value currency dueDate paidAt competencia ciclo billingType periodStart periodEnd createdAt updatedAt",
        "tenant",
        "detail"
      )
    ]
  },
  {
    key: "ajuda-do-tenant",
    title: "Ajuda da empresa",
    description:
      "Artigos e tutoriais da empresa, respeitando público e acesso administrativo.",
    usage:
      "A ajuda global pública é sempre aplicada. Aqui estão conteúdos privados autorizados e suplementos administrativos.",
    resources: [
      resource(
        "help",
        "Helps",
        "id groupId title description type content video duration createdAt updatedAt",
        "help",
        "title description content"
      )
    ]
  }
];
export const moduleFor = (key: string) =>
  AGENT_MODULES.find(item => item.key === key);
export const resourceFor = (key: string) => {
  const module = AGENT_MODULES.find(item =>
    item.resources.some(itemResource => itemResource.key === key)
  );
  const resource = module?.resources.find(item => item.key === key);
  return resource ? { module, resource } : undefined;
};
export const defaultModules = () =>
  Object.fromEntries(AGENT_MODULES.map(item => [item.key, true]));
