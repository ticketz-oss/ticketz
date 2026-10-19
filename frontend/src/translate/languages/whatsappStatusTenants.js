// Overlay merged by ./index.js; languages without keys fall back to en.
const pt = {
  centralConfig: {
    itens: {
      statusWhatsapp: {
        titulo: "Status do WhatsApp",
        descricao: "Libere a publicação de stories para cada empresa."
      }
    }
  },
  whatsappStatusTenants: {
    title: "Stories do WhatsApp por empresa",
    description:
      "A função vem desligada para todas as empresas. Ao desligar, os stories agendados que ainda não saíram são cancelados.",
    companies: "Empresas",
    search: "Pesquisar empresas",
    companyId: "Empresa #{{id}}",
    enabled: "Ativado",
    disabled: "Desativado",
    metaNote: "Conexões Cloud API só terão rascunho e download.",
    loading: "Carregando…",
    noCompanies: "Nenhuma empresa encontrada.",
    more: "Carregar mais",
    retry: "Tentar novamente",
    loadError: "Não foi possível carregar as empresas.",
    saveError: "Não foi possível salvar. A alteração foi desfeita.",
    forbidden: "Você não tem permissão para alterar esta configuração.",
    savedEnabled: "Status do WhatsApp ativado para {{name}}.",
    savedDisabled: "Status do WhatsApp desativado para {{name}}."
  }
};

const en = {
  centralConfig: {
    itens: {
      statusWhatsapp: {
        titulo: "WhatsApp Status",
        descricao: "Allow each company to publish stories."
      }
    }
  },
  whatsappStatusTenants: {
    title: "WhatsApp stories per company",
    description:
      "The feature starts switched off for every company. Switching it off cancels scheduled stories that have not gone out yet.",
    companies: "Companies",
    search: "Search companies",
    companyId: "Company #{{id}}",
    enabled: "Enabled",
    disabled: "Disabled",
    metaNote: "Cloud API connections only get drafts and downloads.",
    loading: "Loading…",
    noCompanies: "No companies found.",
    more: "Load more",
    retry: "Try again",
    loadError: "Could not load companies.",
    saveError: "Could not save. The change was undone.",
    forbidden: "You do not have permission to change this setting.",
    savedEnabled: "WhatsApp Status enabled for {{name}}.",
    savedDisabled: "WhatsApp Status disabled for {{name}}."
  }
};

export const whatsappStatusTenantsMessages = { pt, pt_PT: pt, en };
