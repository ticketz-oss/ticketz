const announcementsEnglish = {
  backendErrors: {
    ERR_ANNOUNCEMENT_REQUIRED: "Fill in the title and the text.",
    ERR_ANNOUNCEMENT_NO_AUDIENCE:
      "Select at least one user, queue, connection or profile.",
    ERR_ANNOUNCEMENT_INVALID_WINDOW:
      "The end date must be later than the start date.",
    ERR_ANNOUNCEMENT_INVALID_USER: "One of the selected users is invalid.",
    ERR_ANNOUNCEMENT_INVALID_QUEUE: "One of the selected queues is invalid.",
    ERR_ANNOUNCEMENT_INVALID_WHATSAPP:
      "One of the selected connections is invalid.",
    ERR_NO_ANNOUNCEMENT_FOUND: "Announcement not found.",
    ERR_NO_PERMISSION: "You cannot manage this announcement."
  },
  announcements: {
    title: "Announcements",
    searchPlaceholder: "Search by title or text",
    empty: "No announcement matches these filters.",
    buttons: { add: "New announcement" },
    filters: {
      status: "Status",
      priority: "Priority",
      from: "From",
      to: "To"
    },
    table: {
      title: "Title",
      text: "Text",
      priority: "Priority",
      window: "Display window",
      audience: "Audience",
      status: "Situation",
      actions: "Actions",
      globalHint: "Visible to every company"
    },
    priorities: { high: "High", medium: "Medium", low: "Low" },
    profiles: { admin: "Administrators", user: "Agents" },
    situations: {
      live: "Showing",
      scheduled: "Scheduled",
      expired: "Expired",
      inactive: "Inactive",
      active: "Active"
    },
    audience: {
      all: "Everyone",
      none: "No audience",
      users: "{{count}} user(s)"
    },
    sections: {
      content: "Content",
      publication: "Publication",
      publicationHint:
        "Leave the dates empty to show it right away and until it is deactivated.",
      audience: "Audience",
      audienceHint:
        "The announcement is shown to anyone matching at least one of the criteria below.",
      media: "Attachment"
    },
    validation: {
      titleRequired: "Enter a title.",
      textRequired: "Enter the announcement text.",
      audienceRequired:
        "Select at least one user, queue, connection or profile.",
      invalidWindow: "The end date must be later than the start date."
    },
    dialog: {
      add: "New announcement",
      edit: "Edit announcement",
      subtitle: "Define the content, when it is shown and who sees it.",
      form: {
        title: "Title",
        text: "Text",
        priority: "Priority",
        startsAt: "Show from",
        endsAt: "Show until",
        active: "Active",
        global: "Visible to every company",
        allUsers: "Show to every user",
        users: "Specific users",
        queues: "Queues",
        connections: "Connections",
        profiles: "Profiles",
        audienceSummary: "{{count}} targeting criteria selected",
        noMedia: "No attachment"
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        attach: "Attach file",
        removeMedia: "Remove"
      }
    },
    confirmationModal: {
      deleteTitle: "Delete announcement",
      deleteMessage: "This action cannot be undone."
    },
    toasts: {
      success: "Announcement saved successfully.",
      deleted: "Announcement deleted successfully."
    }
  }
};

const announcementsPortuguese = {
  backendErrors: {
    ERR_ANNOUNCEMENT_REQUIRED: "Preencha o título e o texto.",
    ERR_ANNOUNCEMENT_NO_AUDIENCE:
      "Selecione ao menos um usuário, fila, conexão ou perfil.",
    ERR_ANNOUNCEMENT_INVALID_WINDOW:
      "A data de término deve ser posterior à de início.",
    ERR_ANNOUNCEMENT_INVALID_USER: "Um dos usuários selecionados é inválido.",
    ERR_ANNOUNCEMENT_INVALID_QUEUE: "Uma das filas selecionadas é inválida.",
    ERR_ANNOUNCEMENT_INVALID_WHATSAPP:
      "Uma das conexões selecionadas é inválida.",
    ERR_NO_ANNOUNCEMENT_FOUND: "Informativo não encontrado.",
    ERR_NO_PERMISSION: "Você não pode gerenciar este informativo."
  },
  announcements: {
    title: "Informativos",
    searchPlaceholder: "Buscar por título ou texto",
    empty: "Nenhum informativo encontrado com esses filtros.",
    buttons: { add: "Novo informativo" },
    filters: {
      status: "Status",
      priority: "Prioridade",
      from: "De",
      to: "Até"
    },
    table: {
      title: "Título",
      text: "Texto",
      priority: "Prioridade",
      window: "Período de exibição",
      audience: "Público",
      status: "Situação",
      actions: "Ações",
      globalHint: "Visível para todas as empresas"
    },
    priorities: { high: "Alta", medium: "Média", low: "Baixa" },
    profiles: { admin: "Administradores", user: "Atendentes" },
    situations: {
      live: "Em exibição",
      scheduled: "Programado",
      expired: "Expirado",
      inactive: "Inativo",
      active: "Ativo"
    },
    audience: {
      all: "Todos",
      none: "Sem público",
      users: "{{count}} usuário(s)"
    },
    sections: {
      content: "Conteúdo",
      publication: "Publicação",
      publicationHint:
        "Deixe as datas em branco para exibir imediatamente e até ser desativado.",
      audience: "Público",
      audienceHint:
        "O informativo aparece para quem atender a pelo menos um dos critérios abaixo.",
      media: "Anexo"
    },
    validation: {
      titleRequired: "Informe um título.",
      textRequired: "Informe o texto do informativo.",
      audienceRequired:
        "Selecione ao menos um usuário, fila, conexão ou perfil.",
      invalidWindow: "A data de término deve ser posterior à de início."
    },
    dialog: {
      add: "Novo informativo",
      edit: "Editar informativo",
      subtitle: "Defina o conteúdo, quando aparece e quem deve ver.",
      form: {
        title: "Título",
        text: "Texto",
        priority: "Prioridade",
        startsAt: "Exibir a partir de",
        endsAt: "Exibir até",
        active: "Ativo",
        global: "Visível para todas as empresas",
        allUsers: "Exibir para todos os usuários",
        users: "Usuários específicos",
        queues: "Filas",
        connections: "Conexões",
        profiles: "Perfis",
        audienceSummary: "{{count}} critério(s) de segmentação selecionado(s)",
        noMedia: "Nenhum anexo"
      },
      buttons: {
        save: "Salvar",
        cancel: "Cancelar",
        attach: "Anexar arquivo",
        removeMedia: "Remover"
      }
    },
    confirmationModal: {
      deleteTitle: "Excluir informativo",
      deleteMessage: "Esta ação não pode ser desfeita."
    },
    toasts: {
      success: "Informativo salvo com sucesso.",
      deleted: "Informativo excluído com sucesso."
    }
  }
};

export const announcementsMessages = {
  pt: announcementsPortuguese,
  pt_PT: announcementsPortuguese,
  en: announcementsEnglish,
  es: announcementsEnglish,
  fr: announcementsEnglish,
  de: announcementsEnglish,
  it: announcementsEnglish,
  id: announcementsEnglish
};
