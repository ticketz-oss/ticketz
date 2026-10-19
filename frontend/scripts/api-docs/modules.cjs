const entries = {
  message: [
    "Mensagens",
    "Envio de texto e mídia, respostas, templates, reações, edição, encaminhamento e histórico. O envio acontece dentro de um atendimento e exige JWT de usuário, conexão disponível e assinatura em conformidade."
  ],
  contact: [
    "Contatos",
    "Cadastro, pesquisa, campos adicionais, etiquetas, fotos e importação/exportação. As operações com token de contatos estão identificadas individualmente; importação e exportação exigem sessão de administrador."
  ],
  ticket: [
    "Atendimentos",
    "Abertura, consulta, atualização, transferência, templates e encerramento de atendimentos. O acesso respeita empresa, filas e permissões do usuário."
  ],
  auth: [
    "Autenticação",
    "Login por senha, identificação da empresa, ativação, renovação e encerramento de sessão, acesso social e impersonação administrativa. Cookies e tokens de cada fluxo não são intercambiáveis."
  ],
  mobileAuth: [
    "Autenticação móvel",
    "Configuração, autorização e troca de credenciais do login móvel. Disponibilidade condicionada à configuração do ambiente."
  ],
  whatsapp: [
    "Conexões WhatsApp",
    "Cadastro, consulta, configuração e privacidade das conexões. As operações administrativas exigem o perfil indicado na rota."
  ],
  whatsappSession: [
    "Sessões WhatsApp",
    "Início, atualização e encerramento da sessão de uma conexão WhatsApp."
  ],
  whatsappGroup: [
    "Grupos",
    "Listagem, participantes, permissões, leitura, modo de operação e administração de grupos. Disponibilidade e acesso dependem da empresa, conexão e participação do usuário."
  ],
  metaWhatsapp: [
    "WhatsApp oficial",
    "Configuração e onboarding da integração Meta, templates, conta de negócios e recursos de cobrança associados. Requer configuração e habilitação da integração oficial."
  ],
  whatsappStatus: [
    "Status do WhatsApp",
    "Rascunhos, agendamento, publicação e mídia dos Status (stories) da própria conta conectada. Disponível só para empresas habilitadas pelo superadministrador; conexões da API oficial da Meta ficam em rascunho, prévia e download."
  ],
  whatsappStatusAdmin: [
    "Status do WhatsApp: disponibilidade",
    "Consulta se a empresa pode usar Status do WhatsApp e, para o superadministrador, liga ou desliga a função por empresa."
  ],
  metaWhatsappWebhook: [
    "Webhooks Meta",
    "Verificação e recebimento de eventos enviados pela Meta. Fluxo do provedor com validação própria; não é um webhook genérico para integrações de clientes."
  ],
  queue: [
    "Filas",
    "Filas de atendimento, usuários e configurações de distribuição."
  ],
  queueOption: [
    "Opções de filas",
    "Opções e etapas do atendimento automatizado configuradas nas filas."
  ],
  user: [
    "Usuários",
    "Usuários, perfis, disponibilidade e configurações de acesso dentro das regras administrativas da empresa."
  ],
  tag: [
    "Etiquetas",
    "Organização de contatos e atendimentos por etiquetas e configurações relacionadas."
  ],
  ticketTag: [
    "Etiquetas de atendimentos",
    "Vinculação e remoção de etiquetas dos atendimentos."
  ],
  ticketNote: [
    "Notas de atendimentos",
    "Registro, consulta e manutenção de anotações ligadas aos atendimentos."
  ],
  quickMessage: [
    "Respostas rápidas",
    "Textos e arquivos reutilizáveis durante o atendimento."
  ],
  schedule: [
    "Agendamentos",
    "Mensagens programadas, prévia, variáveis, entregas, recorrência e envio imediato. Mídia usa multipart/form-data; o campo payload pode conter o JSON do agendamento."
  ],
  commemorativeDate: [
    "Datas comemorativas",
    "Datas utilizadas pelos fluxos de relacionamento e agendamento."
  ],
  campaign: [
    "Campanhas",
    "Cadastro, listas, mídia, execução, interrupção e retomada de campanhas de mensagens."
  ],
  campaignSetting: [
    "Configurações de campanhas",
    "Parâmetros de operação das campanhas da empresa."
  ],
  contactList: [
    "Listas de contatos",
    "Listas utilizadas nas campanhas, importação e organização de destinatários."
  ],
  contactListItem: [
    "Itens das listas",
    "Destinatários e dados individuais das listas de contatos."
  ],
  taskBoard: [
    "Quadro de tarefas",
    "Tarefas, colunas, ordenação e movimentação no quadro. Gerenciamento de estrutura e tarefas exige as permissões indicadas."
  ],
  prospeccao: [
    "Prospecção",
    "Produtos, localidades, buscas, leads, abertura de conversa e automações. Módulo com autorização específica."
  ],
  chat: [
    "Chat interno",
    "Conversas e mensagens internas entre usuários; não corresponde ao envio para WhatsApp."
  ],
  announcement: [
    "Avisos",
    "Feed, cadastro e mídia de comunicados para usuários."
  ],
  dashboard: [
    "Indicadores",
    "Consultas de métricas e informações do painel, conforme a empresa e o perfil autenticado."
  ],
  voice: [
    "Chamadas de voz",
    "Conexões de voz, pareamento, aceite, rejeição, encerramento, WebRTC, gravações e artefatos. Requer serviço de voz habilitado."
  ],
  wavoip: [
    "WaVoIP",
    "Recursos da integração de telefonia WaVoIP, sujeitos à configuração do provedor."
  ],
  push: [
    "Notificações push",
    "Registro e remoção de inscrições, preferências e recursos de notificações do navegador."
  ],
  setting: [
    "Configurações",
    "Preferências da empresa e ajustes públicos de apresentação. As rotas administrativas e públicas são distintas."
  ],
  company: [
    "Empresas",
    "Administração de empresas e seus recursos. A existência da rota não concede acesso a outras empresas."
  ],
  plan: [
    "Planos",
    "Consulta e administração de planos, limites e recursos disponíveis."
  ],
  invoices: [
    "Faturas",
    "Consulta e gerenciamento de faturas conforme as permissões e o fluxo financeiro."
  ],
  subScription: [
    "Assinaturas",
    "Assinaturas, pagamento, contratação e callbacks associados aos provedores. Algumas rotas são fluxos próprios, não endpoints para uso com JWT."
  ],
  billingAdmin: [
    "Administração financeira",
    "Gestão financeira central, planos, cobranças e operações administrativas. Acesso restrito ao administrador financeiro autorizado."
  ],
  platform: [
    "API da plataforma",
    "Gestão administrativa de tenants, planos, uso, acesso e financeiro em /api/platform/v1. Chave X-Platform-Key própria e Idempotency-Key UUID v4 obrigatório nas mutações protegidas. Não é a credencial de integração de uma empresa."
  ],
  partner: [
    "Portal de parceiros",
    "Autenticação, convites, empresas, planos, repasses e preferências de parceiros. JWT e renovação próprios do portal."
  ],
  partnerAdmin: [
    "Administração de parceiros",
    "Gestão interna de parceiros e operações do programa, sujeita a permissões administrativas."
  ],
  agent: [
    "Agente",
    "Disponibilidade, conversas, sessões temporárias, ferramentas e contexto do agente. Recursos dependem de habilitação por empresa; administração do contexto é restrita."
  ],
  mcp: [
    "MCP existente",
    "Transporte HTTP do MCP já presente no código, protegido por OAuth e escopos. Depende de configuração e habilitação; esta documentação não ativa, expande ou oferece um novo MCP."
  ],
  oauth: [
    "OAuth e descoberta",
    "Metadados, chaves públicas, registro de cliente, autorização, consentimento, emissão e revogação de tokens da integração existente. Use o fluxo completo, sem substituir JWT de usuário por token OAuth."
  ],
  chatGpt: [
    "Integração ChatGPT",
    "Consulta e revogação de autorizações e controle administrativo de habilitação da integração existente."
  ],
  help: [
    "Ajuda",
    "Conteúdos de ajuda e seus arquivos, conforme o acesso disponível."
  ],
  helpGroup: [
    "Grupos de ajuda",
    "Organização e gerenciamento dos conteúdos da central de ajuda."
  ],
  i18n: ["Traduções", "Idiomas e dicionários utilizados pela aplicação."],
  pwa: [
    "Aplicativo web",
    "Manifesto e recursos de apresentação do aplicativo instalável."
  ],
  version: ["Versão", "Informações sobre a versão instalada da aplicação."],
  ticketzOSS: [
    "Projeto e licença",
    "Informações do projeto e recursos relacionados à distribuição do software."
  ],
  og: [
    "Compartilhamento e páginas públicas",
    "Metadados de compartilhamento, páginas legais e apresentação pública."
  ],
  buildCaptureExtension: [
    "Extensão de captura",
    "Geração da extensão de captura integrada ao sistema."
  ],
  files: [
    "Arquivos públicos",
    "Download dos arquivos publicados em /public. O parâmetro inline=1 solicita exibição no navegador. O caminho é relativo ao diretório público de uploads."
  ]
};
module.exports = Object.fromEntries(
  Object.entries(entries).map(([key, [name, description]]) => [
    key,
    { name, description }
  ])
);
