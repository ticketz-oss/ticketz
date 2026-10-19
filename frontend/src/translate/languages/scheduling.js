const schedulingEnglish = {
  common: { all: "All" },
  backendErrors: {
    ERR_INVALID_BIRTHDAY: "Enter a valid birthday.",
    ERR_COMMEMORATIVE_DATE_DUPLICATED:
      "This commemorative date already exists.",
    ERR_COMMEMORATIVE_DATE_INVALID: "Enter a valid commemorative date.",
    ERR_COMMEMORATIVE_DATE_INVALID_DAY: "Enter a valid day.",
    ERR_COMMEMORATIVE_DATE_INVALID_MONTH: "Enter a valid month.",
    ERR_COMMEMORATIVE_DATE_INVALID_RULE: "Enter a valid annual pattern.",
    ERR_COMMEMORATIVE_DATE_NOT_FOUND:
      "Commemorative date not found or inactive.",
    ERR_SCHEDULE_ALREADY_STARTED: "This one-time schedule has already started.",
    ERR_SCHEDULE_DATE_REQUIRED: "Choose a schedule date.",
    ERR_SCHEDULE_INVALID_AUDIENCE: "The selected audience is invalid.",
    ERR_SCHEDULE_INVALID_DATE: "The selected date is invalid.",
    ERR_SCHEDULE_INVALID_KIND: "The schedule type is invalid.",
    ERR_SCHEDULE_INVALID_MEDIA: "Select an image, GIF, or video.",
    ERR_SCHEDULE_INVALID_MESSAGE:
      "Enter a message with at least five characters.",
    ERR_SCHEDULE_INVALID_PAYLOAD: "The schedule data could not be read.",
    ERR_SCHEDULE_INVALID_RECIPIENT: "One or more recipients are not eligible.",
    ERR_SCHEDULE_INVALID_TIME: "Enter a valid time.",
    ERR_SCHEDULE_INVALID_TIMEZONE: "Enter a valid IANA time zone.",
    ERR_SCHEDULE_MEDIA_CONVERSION: "The media could not be converted.",
    ERR_SCHEDULE_NO_ELIGIBLE_RECIPIENTS:
      "No eligible WhatsApp contacts were found.",
    ERR_SCHEDULE_SEND_NOW_UNAVAILABLE:
      "This schedule can no longer be sent immediately.",
    ERR_SCHEDULE_RECIPIENT_REQUIRED: "Select at least one contact.",
    ERR_SCHEDULE_TIME_REQUIRED: "Choose an annual delivery time.",
    ERR_SCHEDULE_UNKNOWN_VARIABLE: "The message contains an unknown variable."
  },
  contactModal: {
    validation: { invalidBirthday: "Invalid birthday" },
    form: { nickname: "Nickname", birthdayDay: "Day", birthdayMonth: "Month" }
  },
  contacts: { table: { nickname: "Nickname", birthday: "Birthday" } },
  scheduleModal: {
    subtitle:
      "Define the audience and occasion, then personalize every delivery.",
    sections: {
      audience: "Audience",
      when: "When",
      message: "Message and variables",
      media: "Media",
      review: "Review"
    },
    validation: {
      shortMessage: "The message is too short",
      selectContact: "Select at least one contact",
      dateRequired: "Choose a date",
      timeRequired: "Choose a time",
      selectDate: "Select a commemorative date"
    },
    form: {
      contacts: "Contacts",
      allContacts: "All eligible contacts",
      kind: "Schedule type",
      sendDate: "Date",
      sendTime24h: "Time (24h)",
      sendTime: "Annual time",
      timezone: "Time zone",
      commemorativeDate: "Commemorative date",
      mediaMode: "Media delivery",
      noMedia: "No media selected"
    },
    kinds: {
      once: "One-time date",
      birthday: "Birthday",
      commemorative: "Commemorative date"
    },
    mediaModes: {
      caption: "Message as caption",
      separate: "Separate message and media"
    },
    review: {
      recipients: "recipients",
      excluded: "excluded",
      missingData: "Some data is missing",
      hint: "Preview the message with a real contact before saving."
    },
    buttons: {
      save: "Save schedule",
      preview: "Generate preview",
      attach: "Add media",
      removeMedia: "Remove"
    }
  },
  schedules: {
    tabs: { schedules: "Schedules", dates: "Commemorative dates" },
    filters: { kind: "Type", status: "Status", from: "From", to: "To" },
    table: {
      occasion: "Occasion",
      nextRun: "Next occurrence",
      audience: "Audience",
      progress: "Deliveries"
    },
    empty: "No schedules found.",
    emptyDeliveries: "Deliveries will appear here after the occurrence.",
    actions: { sendNow: "Send now" },
    confirmationModal: {
      sendNowTitle: "Send this schedule now?",
      sendNowMessage:
        "The scheduled time will be replaced and delivery will start immediately."
    },
    toasts: { sentNow: "Schedule queued for immediate delivery." }
  },
  commemorativeDates: {
    add: "New commemorative date",
    edit: "Edit commemorative date",
    success: "Commemorative date saved successfully.",
    empty: "No commemorative dates have been added.",
    last: "Last",
    form: {
      name: "Name",
      ruleType: "Annual pattern",
      month: "Month",
      day: "Day",
      weekday: "Weekday",
      ordinal: "Occurrence",
      active: "Active"
    },
    rules: { fixed: "Fixed day and month", nthWeekday: "Weekday in month" },
    weekdays: {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday"
    }
  }
};

const schedulingPortuguese = {
  common: { all: "Todos" },
  backendErrors: {
    ERR_INVALID_BIRTHDAY: "Informe um aniversário válido.",
    ERR_COMMEMORATIVE_DATE_DUPLICATED: "Esta data comemorativa já existe.",
    ERR_COMMEMORATIVE_DATE_INVALID: "Informe uma data comemorativa válida.",
    ERR_COMMEMORATIVE_DATE_INVALID_DAY: "Informe um dia válido.",
    ERR_COMMEMORATIVE_DATE_INVALID_MONTH: "Informe um mês válido.",
    ERR_COMMEMORATIVE_DATE_INVALID_RULE: "Informe um padrão anual válido.",
    ERR_COMMEMORATIVE_DATE_NOT_FOUND:
      "Data comemorativa não encontrada ou inativa.",
    ERR_SCHEDULE_ALREADY_STARTED: "Este agendamento único já foi iniciado.",
    ERR_SCHEDULE_DATE_REQUIRED: "Informe a data do agendamento.",
    ERR_SCHEDULE_INVALID_AUDIENCE: "O público selecionado é inválido.",
    ERR_SCHEDULE_INVALID_DATE: "A data selecionada é inválida.",
    ERR_SCHEDULE_INVALID_KIND: "O tipo de agendamento é inválido.",
    ERR_SCHEDULE_INVALID_MEDIA: "Selecione uma imagem, GIF ou vídeo.",
    ERR_SCHEDULE_INVALID_MESSAGE:
      "Digite uma mensagem com pelo menos cinco caracteres.",
    ERR_SCHEDULE_INVALID_PAYLOAD:
      "Não foi possível ler os dados do agendamento.",
    ERR_SCHEDULE_INVALID_RECIPIENT:
      "Um ou mais destinatários não são elegíveis.",
    ERR_SCHEDULE_INVALID_TIME: "Informe um horário válido.",
    ERR_SCHEDULE_INVALID_TIMEZONE: "Informe um fuso horário IANA válido.",
    ERR_SCHEDULE_MEDIA_CONVERSION: "Não foi possível converter a mídia.",
    ERR_SCHEDULE_NO_ELIGIBLE_RECIPIENTS:
      "Nenhum contato de WhatsApp elegível foi encontrado.",
    ERR_SCHEDULE_SEND_NOW_UNAVAILABLE:
      "Este agendamento não pode mais ser enviado imediatamente.",
    ERR_SCHEDULE_RECIPIENT_REQUIRED: "Selecione ao menos um contato.",
    ERR_SCHEDULE_TIME_REQUIRED: "Informe o horário do envio anual.",
    ERR_SCHEDULE_UNKNOWN_VARIABLE:
      "A mensagem contém uma variável desconhecida."
  },
  contactModal: {
    validation: { invalidBirthday: "Data de aniversário inválida" },
    form: { nickname: "Apelido", birthdayDay: "Dia", birthdayMonth: "Mês" }
  },
  contacts: { table: { nickname: "Apelido", birthday: "Aniversário" } },
  scheduleModal: {
    subtitle: "Defina o público, a ocasião e personalize cada entrega.",
    sections: {
      audience: "Público",
      when: "Quando",
      message: "Mensagem e variáveis",
      media: "Mídia",
      review: "Conferência"
    },
    validation: {
      shortMessage: "A mensagem está muito curta",
      selectContact: "Selecione ao menos um contato",
      dateRequired: "Informe a data",
      timeRequired: "Informe o horário",
      selectDate: "Selecione uma data comemorativa"
    },
    form: {
      contacts: "Contatos",
      allContacts: "Todos os contatos elegíveis",
      kind: "Tipo de agendamento",
      sendDate: "Data",
      sendTime24h: "Horário (24h)",
      sendTime: "Horário anual",
      timezone: "Fuso horário",
      commemorativeDate: "Data comemorativa",
      mediaMode: "Forma de envio da mídia",
      noMedia: "Nenhuma mídia selecionada"
    },
    kinds: {
      once: "Data única",
      birthday: "Aniversário",
      commemorative: "Data comemorativa"
    },
    mediaModes: {
      caption: "Mensagem como legenda",
      separate: "Mensagem e mídia separadas"
    },
    review: {
      recipients: "destinatários",
      excluded: "excluídos",
      missingData: "Há dados ausentes",
      hint: "Confira a mensagem com um contato real antes de salvar."
    },
    buttons: {
      save: "Salvar agendamento",
      preview: "Gerar prévia",
      attach: "Adicionar mídia",
      removeMedia: "Remover"
    }
  },
  schedules: {
    tabs: { schedules: "Agendamentos", dates: "Datas comemorativas" },
    filters: { kind: "Tipo", status: "Status", from: "De", to: "Até" },
    table: {
      occasion: "Ocasião",
      nextRun: "Próxima ocorrência",
      audience: "Público",
      progress: "Entregas"
    },
    empty: "Nenhum agendamento encontrado.",
    emptyDeliveries: "As entregas aparecerão aqui após a ocorrência.",
    actions: { sendNow: "Enviar agora" },
    confirmationModal: {
      sendNowTitle: "Enviar este agendamento agora?",
      sendNowMessage:
        "O horário agendado será substituído e o envio começará imediatamente."
    },
    toasts: { sentNow: "Agendamento colocado na fila para envio imediato." }
  },
  commemorativeDates: {
    add: "Nova data comemorativa",
    edit: "Editar data comemorativa",
    success: "Data comemorativa salva com sucesso.",
    empty: "Nenhuma data comemorativa cadastrada.",
    last: "Último",
    form: {
      name: "Nome",
      ruleType: "Padrão anual",
      month: "Mês",
      day: "Dia",
      weekday: "Dia da semana",
      ordinal: "Ocorrência",
      active: "Ativa"
    },
    rules: { fixed: "Dia e mês fixos", nthWeekday: "Dia da semana no mês" },
    weekdays: {
      0: "Domingo",
      1: "Segunda-feira",
      2: "Terça-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "Sábado"
    }
  }
};

export const schedulingMessages = {
  pt: schedulingPortuguese,
  pt_PT: schedulingPortuguese,
  en: schedulingEnglish,
  es: schedulingEnglish,
  fr: schedulingEnglish,
  de: schedulingEnglish,
  it: schedulingEnglish,
  id: schedulingEnglish
};
