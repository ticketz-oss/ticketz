// Overlay merged by ./index.js; languages without keys fall back to en.

const ptErrors = {
  ERR_STATUS_AUDIENCE_EMPTY:
    "Nenhum contato pode ver este story. Escolha outra audiência.",
  ERR_STATUS_AUDIENCE_TOO_LARGE:
    "A audiência passa do limite permitido para um story.",
  ERR_STATUS_BODY_REQUIRED: "Escreva o texto do story.",
  ERR_STATUS_BODY_TOO_LONG: "O texto passa de 700 caracteres.",
  ERR_STATUS_CONNECTION_MISMATCH: "A conexão não pertence mais a esta empresa.",
  ERR_STATUS_CONNECTION_UNAVAILABLE:
    "A conexão estava indisponível no momento da publicação.",
  ERR_STATUS_DISCONNECTED: "Conexão desconectada.",
  ERR_STATUS_FEATURE_DISABLED: "Stories estão desativados para esta empresa.",
  ERR_STATUS_IDEMPOTENCY_REQUIRED:
    "Não foi possível identificar este envio. Feche e abra o formulário de novo.",
  ERR_STATUS_INVALID_INPUT: "Confira os campos do story e tente novamente.",
  ERR_STATUS_INVALID_STATE: "Este story não pode mais ser alterado.",
  ERR_STATUS_LIB_NOT_VERIFIED:
    "Publicação de Status ainda não liberada para esta conexão.",
  ERR_STATUS_MEDIA_INVALID:
    "Arquivo inválido. Use JPG, PNG ou WEBP para imagens e MP4 para vídeos.",
  ERR_STATUS_MEDIA_REQUIRED: "Selecione uma imagem ou um vídeo.",
  ERR_STATUS_MEDIA_TOO_LARGE: "O arquivo passa do tamanho máximo permitido.",
  ERR_STATUS_NOT_FOUND: "Story não encontrado.",
  ERR_STATUS_NO_CONFIRMATION:
    "A sessão do WhatsApp não confirmou o envio deste story.",
  ERR_STATUS_SERVER_REJECTED:
    "O WhatsApp rejeitou este story. Ele não foi publicado.",
  ERR_STATUS_EXPIRED_DRAFT:
    "Rascunho descartado depois de 7 dias sem alterações.",
  ERR_STATUS_OFFICIAL_API:
    "Esta conexão usa a API oficial da Meta, que não publica Status.",
  ERR_STATUS_OUTCOME_UNKNOWN:
    "Não foi possível saber se o story saiu. Ele não foi reenviado para evitar duplicidade.",
  ERR_STATUS_PUBLISH_FAILED: "Não foi possível publicar o story nesta conexão.",
  ERR_STATUS_SCHEDULE_INVALID:
    "Escolha uma data futura, em até 30 dias, para o agendamento.",
  ERR_STATUS_UNSUPPORTED: "Esta conexão ainda não publica este tipo de story."
};

const enErrors = {
  ERR_STATUS_AUDIENCE_EMPTY:
    "No contact can see this story. Choose another audience.",
  ERR_STATUS_AUDIENCE_TOO_LARGE:
    "The audience is above the limit allowed for a story.",
  ERR_STATUS_BODY_REQUIRED: "Write the story text.",
  ERR_STATUS_BODY_TOO_LONG: "The text is longer than 700 characters.",
  ERR_STATUS_CONNECTION_MISMATCH:
    "The connection no longer belongs to this company.",
  ERR_STATUS_CONNECTION_UNAVAILABLE:
    "The connection was unavailable when publishing.",
  ERR_STATUS_DISCONNECTED: "Connection disconnected.",
  ERR_STATUS_FEATURE_DISABLED: "Stories are turned off for this company.",
  ERR_STATUS_IDEMPOTENCY_REQUIRED:
    "This submission could not be identified. Close and reopen the form.",
  ERR_STATUS_INVALID_INPUT: "Check the story fields and try again.",
  ERR_STATUS_INVALID_STATE: "This story can no longer be changed.",
  ERR_STATUS_LIB_NOT_VERIFIED:
    "Status publishing is not enabled for this connection yet.",
  ERR_STATUS_MEDIA_INVALID:
    "Invalid file. Use JPG, PNG or WEBP for images and MP4 for videos.",
  ERR_STATUS_MEDIA_REQUIRED: "Select an image or a video.",
  ERR_STATUS_MEDIA_TOO_LARGE: "The file is above the maximum allowed size.",
  ERR_STATUS_NOT_FOUND: "Story not found.",
  ERR_STATUS_NO_CONFIRMATION:
    "The WhatsApp session did not confirm this story was sent.",
  ERR_STATUS_SERVER_REJECTED:
    "WhatsApp rejected this story. It was not published.",
  ERR_STATUS_EXPIRED_DRAFT: "Draft discarded after 7 days without changes.",
  ERR_STATUS_OFFICIAL_API:
    "This connection uses Meta's official API, which does not publish Status.",
  ERR_STATUS_OUTCOME_UNKNOWN:
    "It is unknown whether the story went out. It was not resent to avoid a duplicate.",
  ERR_STATUS_PUBLISH_FAILED:
    "The story could not be published on this connection.",
  ERR_STATUS_SCHEDULE_INVALID:
    "Pick a future date, within 30 days, for scheduling.",
  ERR_STATUS_UNSUPPORTED:
    "This connection does not publish this kind of story yet."
};

const pt = {
  whatsappStatus: {
    strip: {
      title: "Meus stories",
      ttl: "Ficam 24 h no ar",
      newStory: "Novo story",
      ringAria: "Ver stories de {{name}} ({{total}})"
    },
    toast: {
      submitted: "Story enviado para publicação na conexão {{name}}",
      published: "Story publicado no WhatsApp da conexão {{name}}",
      failed: "Story não publicado na conexão {{name}}: {{reason}}",
      scheduled: "Story agendado na conexão {{name}}",
      draftSaved: "Rascunho salvo na conexão {{name}}"
    },
    state: {
      scheduled: "Agendado",
      sending: "Enviando à sessão",
      sent: "Enviado à sessão",
      failed: "Falhou",
      unsupported: "Indisponível nesta conexão",
      draft: "Rascunho",
      cancelled: "Cancelado"
    },
    time: {
      now: "agora",
      minutesAgo: "há {{n}} min",
      hoursAgo: "há {{n}} h",
      daysAgo: "há {{n}} d",
      today: "Hoje, {{time}}",
      yesterday: "Ontem, {{time}}",
      hours: "{{n}} h",
      minutes: "{{n}} min",
      none: "—"
    },
    modal: {
      title: "Novo story",
      editTitle: "Editar rascunho",
      mediaAttached: "Arquivo já anexado",
      subtitle:
        "Publicado no status do WhatsApp da conexão escolhida. Fica visível para seus contatos por 24 horas.",
      close: "Fechar",
      connection: "Conexão",
      noConnections: "Nenhuma conexão WhatsApp disponível.",
      type: "Tipo",
      typeAria: "Tipo de story",
      kinds: { text: "Texto", image: "Imagem", video: "Vídeo" },
      text: "Texto",
      textCount: "{{n}} / 700 caracteres",
      background: "Cor de fundo",
      colors: {
        blue: "Azul",
        green: "Verde",
        purple: "Roxo",
        orange: "Laranja",
        pink: "Rosa",
        graphite: "Grafite"
      },
      dropImage: "Arraste uma imagem aqui",
      dropVideo: "Arraste um vídeo aqui",
      hintImage: "Formatos JPG ou PNG, na vertical de preferência.",
      hintVideo: "Formato MP4. Vídeos curtos funcionam melhor.",
      selectFile: "Selecionar arquivo",
      caption: "Legenda",
      optional: "(opcional)",
      captionPlaceholder: "Escreva uma legenda",
      audience: "Quem pode ver",
      audienceAll: "Todos os contatos da conexão",
      audienceList: "Uma lista de contatos",
      contactList: "Lista de contatos",
      contactListPlaceholder: "Selecione uma lista",
      manageContactList: "Adicionar contatos a esta lista",
      audienceLoading: "Calculando quem vai ver…",
      audienceCount: "Será visto por {{n}} contatos",
      audienceCountOne: "Será visto por 1 contato",
      when: "Quando",
      whenAria: "Quando publicar",
      now: "Agora",
      schedule: "Agendar",
      scheduleAt: "Data e hora do agendamento",
      preview: "Pré-visualização",
      previewNow: "agora",
      previewImage: "Sua imagem aparece aqui",
      previewVideo: "Seu vídeo aparece aqui",
      privacy:
        "O WhatsApp não informa quem visualizou stories publicados pela plataforma.",
      cancel: "Cancelar",
      publish: "Publicar story",
      scheduleSubmit: "Agendar story",
      saveDraft: "Salvar rascunho",
      download: "Baixar arquivo",
      reasons: {
        OFFICIAL_API:
          "Esta conexão usa a API oficial da Meta, que não publica Status. Salve o rascunho e baixe o arquivo para publicar pelo aplicativo.",
        LIB_NOT_VERIFIED:
          "A publicação automática nesta conexão está em teste. Salve o rascunho e baixe a mídia para publicar pelo WhatsApp.",
        DISCONNECTED: "Conexão desconectada."
      },
      genericError: "Não foi possível salvar o story. Tente novamente."
    },
    viewer: {
      aria: "Meu story",
      close: "Fechar",
      prev: "Story anterior",
      next: "Próximo story",
      details: "Detalhes do story",
      connection: "Conexão",
      publishedAt: "Publicado",
      expiresIn: "Expira em",
      publishedBy: "Publicado por",
      audience: "Quem pode ver",
      audienceAll: "Todos os contatos",
      audienceList: "Lista de contatos",
      state: "Estado",
      noViewers:
        "A lista de quem visualizou não está disponível para stories publicados pela plataforma.",
      publishNew: "Publicar novo story",
      delete: "Excluir este story",
      editDraft: "Editar rascunho",
      download: "Baixar arquivo",
      imageAlt: "Imagem do story",
      mediaUnavailable: "Mídia indisponível"
    },
    errors: ptErrors
  },
  backendErrors: ptErrors
};

const en = {
  whatsappStatus: {
    strip: {
      title: "My stories",
      ttl: "Live for 24 h",
      newStory: "New story",
      ringAria: "View stories of {{name}} ({{total}})"
    },
    toast: {
      submitted: "Story sent for publishing on connection {{name}}",
      published: "Story published on the WhatsApp of connection {{name}}",
      failed: "Story not published on connection {{name}}: {{reason}}",
      scheduled: "Story scheduled on connection {{name}}",
      draftSaved: "Draft saved on connection {{name}}"
    },
    state: {
      scheduled: "Scheduled",
      sending: "Sending to session",
      sent: "Sent to session",
      failed: "Failed",
      unsupported: "Unavailable on this connection",
      draft: "Draft",
      cancelled: "Cancelled"
    },
    time: {
      now: "now",
      minutesAgo: "{{n}} min ago",
      hoursAgo: "{{n}} h ago",
      daysAgo: "{{n}} d ago",
      today: "Today, {{time}}",
      yesterday: "Yesterday, {{time}}",
      hours: "{{n}} h",
      minutes: "{{n}} min",
      none: "—"
    },
    modal: {
      title: "New story",
      editTitle: "Edit draft",
      mediaAttached: "File already attached",
      subtitle:
        "Published on the WhatsApp status of the chosen connection. Visible to your contacts for 24 hours.",
      close: "Close",
      connection: "Connection",
      noConnections: "No WhatsApp connection available.",
      type: "Type",
      typeAria: "Story type",
      kinds: { text: "Text", image: "Image", video: "Video" },
      text: "Text",
      textCount: "{{n}} / 700 characters",
      background: "Background color",
      colors: {
        blue: "Blue",
        green: "Green",
        purple: "Purple",
        orange: "Orange",
        pink: "Pink",
        graphite: "Graphite"
      },
      dropImage: "Drag an image here",
      dropVideo: "Drag a video here",
      hintImage: "JPG or PNG, preferably vertical.",
      hintVideo: "MP4 format. Short videos work best.",
      selectFile: "Select file",
      caption: "Caption",
      optional: "(optional)",
      captionPlaceholder: "Write a caption",
      audience: "Who can see",
      audienceAll: "All contacts of the connection",
      audienceList: "A contact list",
      contactList: "Contact list",
      contactListPlaceholder: "Select a list",
      manageContactList: "Add contacts to this list",
      audienceLoading: "Working out who will see it…",
      audienceCount: "Will be seen by {{n}} contacts",
      audienceCountOne: "Will be seen by 1 contact",
      when: "When",
      whenAria: "When to publish",
      now: "Now",
      schedule: "Schedule",
      scheduleAt: "Schedule date and time",
      preview: "Preview",
      previewNow: "now",
      previewImage: "Your image appears here",
      previewVideo: "Your video appears here",
      privacy:
        "WhatsApp does not report who viewed stories published by the platform.",
      cancel: "Cancel",
      publish: "Publish story",
      scheduleSubmit: "Schedule story",
      saveDraft: "Save draft",
      download: "Download file",
      reasons: {
        OFFICIAL_API:
          "This connection uses Meta's official API, which does not publish Status. Save the draft and download the file to publish from the app.",
        LIB_NOT_VERIFIED:
          "Automatic publishing on this connection is under test. Save the draft and download the media to post from WhatsApp.",
        DISCONNECTED: "Connection disconnected."
      },
      genericError: "The story could not be saved. Try again."
    },
    viewer: {
      aria: "My story",
      close: "Close",
      prev: "Previous story",
      next: "Next story",
      details: "Story details",
      connection: "Connection",
      publishedAt: "Published",
      expiresIn: "Expires in",
      publishedBy: "Published by",
      audience: "Who can see",
      audienceAll: "All contacts",
      audienceList: "Contact list",
      state: "State",
      noViewers:
        "The list of who viewed is not available for stories published by the platform.",
      publishNew: "Publish new story",
      delete: "Delete this story",
      editDraft: "Edit draft",
      download: "Download file",
      imageAlt: "Story image",
      mediaUnavailable: "Media unavailable"
    },
    errors: enErrors
  },
  backendErrors: enErrors
};

export const whatsappStatusMessages = { pt, pt_PT: pt, en };
