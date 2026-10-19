const pt = {
  centralConfig: {
    itens: {
      luizaAgent: {
        titulo: "Luiza’s Agent",
        descricao: "Controle os dados e o contexto do negócio de cada empresa."
      }
    }
  },
  agentManagement: {
    title: "Conhece o negócio. Respeita seus limites.",
    description:
      "Escolha uma empresa e defina o que o Luiza’s pode consultar. O acesso é somente de leitura e respeita também as permissões de cada usuário.",
    companies: "Empresas",
    search: "Pesquisar empresas",
    companyId: "Empresa #{{id}}",
    enabled: "Ativado",
    disabled: "Desativado",
    noCompanies: "Nenhuma empresa encontrada.",
    selectCompany: "Selecione uma empresa para configurar o agente.",
    loading: "Carregando…",
    agentEnabled: "Agente disponível nesta empresa",
    immediate:
      "Ao salvar, os controles passam a valer imediatamente e o contexto das conversas anteriores é invalidado.",
    modules: "Dados disponíveis para a IA",
    modulesDescription:
      "Libere as funcionalidades que o agente pode consultar. As permissões do usuário continuam valendo dentro de cada módulo.",
    moduleCount: "{{allowed}} de {{total}} módulos liberados",
    business: "Contexto do negócio",
    businessDescription:
      "Conte como a empresa funciona: serviços, produtos, público, horários, tom de voz e regras de atendimento. Os dados atuais continuam sendo consultados no sistema.",
    editor: "Editar Markdown",
    preview: "Prévia",
    businessPlaceholder:
      "# Sobre a empresa\n\nDescreva o negócio, os serviços e as orientações para o agente.",
    previewEmpty: "A prévia do contexto aparecerá aqui.",
    characterCount: "{{count}} / 50.000 caracteres",
    privacy: "Não inclua senhas, tokens, chaves ou credenciais neste contexto.",
    documents: "Documentos do tenant",
    documentsDescription:
      "Retratos privados dos dados autorizados. O banco confirma as informações atuais em cada consulta.",
    lastUpdate: "Última atualização: {{date}}",
    neverUpdated: "Aguardando a primeira atualização.",
    rebuild: "Regenerar documentos",
    rebuilding: "Gerando documentos…",
    records: "{{count}} registros",
    failures: "Fontes indisponíveis: {{sources}}",
    documentStates: {
      pending: "Na fila",
      ready: "Atualizado",
      partial: "Cobertura parcial",
      error: "Falha na geração",
      blocked: "Bloqueado",
      disabled: "Agente desativado",
      unknown: "Ainda não gerado"
    },
    save: "Salvar controles e contexto",
    saving: "Salvando…",
    saved: "Controles e contexto salvos.",
    rebuildRequested: "A regeneração foi solicitada.",
    loadError: "Não foi possível carregar as configurações do agente.",
    saveError: "Não foi possível salvar. Suas alterações foram mantidas.",
    rebuildError: "Não foi possível solicitar a regeneração.",
    conflict:
      "Outra alteração foi salva para esta empresa. Recarregue a configuração antes de salvar novamente.",
    forbidden: "Apenas o super admin pode administrar o Luiza’s Agent.",
    retry: "Tentar novamente",
    reload: "Recarregar configuração",
    discardTitle: "Descartar alterações?",
    discardDescription:
      "Há alterações não salvas nesta empresa. Ao continuar, elas serão descartadas.",
    cancel: "Continuar editando",
    discard: "Descartar alterações",
    unsaved: "Alterações não salvas",
    more: "Carregar mais empresas"
  }
};
const en = {
  centralConfig: {
    itens: {
      luizaAgent: {
        titulo: "Luiza’s Agent",
        descricao: "Manage each company’s data access and business context."
      }
    }
  },
  agentManagement: {
    title: "Knows the business. Respects your boundaries.",
    description:
      "Choose a company and decide what Luiza’s can read. Access is read only and also respects each user’s permissions.",
    companies: "Companies",
    search: "Search companies",
    companyId: "Company #{{id}}",
    enabled: "Enabled",
    disabled: "Disabled",
    noCompanies: "No companies found.",
    selectCompany: "Select a company to configure its agent.",
    loading: "Loading…",
    agentEnabled: "Agent available to this company",
    immediate:
      "When saved, these controls apply immediately and invalidate the context of previous conversations.",
    modules: "Data available to the AI",
    modulesDescription:
      "Enable the features the agent can read. User permissions still apply within each module.",
    moduleCount: "{{allowed}} of {{total}} modules enabled",
    business: "Business context",
    businessDescription:
      "Describe the company: services, products, audience, opening hours, tone and support rules. Current records are still retrieved from the system.",
    editor: "Edit Markdown",
    preview: "Preview",
    businessPlaceholder:
      "# About the company\n\nDescribe the business, services and guidance for the agent.",
    previewEmpty: "Your context preview will appear here.",
    characterCount: "{{count}} / 50,000 characters",
    privacy:
      "Do not include passwords, tokens, keys or credentials in this context.",
    documents: "Tenant documents",
    documentsDescription:
      "Private snapshots of authorized data. Queries use the database to confirm current information.",
    lastUpdate: "Last updated: {{date}}",
    neverUpdated: "Waiting for the first update.",
    rebuild: "Rebuild documents",
    rebuilding: "Building documents…",
    records: "{{count}} records",
    failures: "Unavailable sources: {{sources}}",
    documentStates: {
      pending: "Queued",
      ready: "Up to date",
      partial: "Partial coverage",
      error: "Build failed",
      blocked: "Blocked",
      disabled: "Agent disabled",
      unknown: "Not yet generated"
    },
    save: "Save controls and context",
    saving: "Saving…",
    saved: "Controls and context saved.",
    rebuildRequested: "Document rebuild requested.",
    loadError: "Could not load the agent settings.",
    saveError: "Could not save. Your changes have been kept.",
    rebuildError: "Could not request a rebuild.",
    conflict:
      "Another change was saved for this company. Reload its settings before saving again.",
    forbidden: "Only a super admin can manage Luiza’s Agent.",
    retry: "Try again",
    reload: "Reload settings",
    discardTitle: "Discard changes?",
    discardDescription:
      "This company has unsaved changes. Continuing will discard them.",
    cancel: "Keep editing",
    discard: "Discard changes",
    unsaved: "Unsaved changes",
    more: "Load more companies"
  }
};
export const agentContextManagementMessages = { pt, pt_PT: pt, en };
