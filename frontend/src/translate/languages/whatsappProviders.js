const pt = {
  connections: {
    toasts: {
      metaConnected: "Conectado à API Oficial da Meta com sucesso!"
    },
    buttons: {
      connectMeta: "Conectar via Meta"
    },
    toolTips: {
      notAvailableOfficial:
        "Ainda não disponível para conexões via API Oficial da Meta."
    },
    meta: {
      signupTitle: "Conectar sua conta do WhatsApp",
      ownAccount:
        "Entre na Meta com seu próprio usuário administrador. Escolha ou crie a conta empresarial da sua empresa e selecione seu número de WhatsApp.",
      billingSeparate:
        "A mensalidade do EspaçoWhats é separada das tarifas de uso do WhatsApp cobradas diretamente pela Meta à sua empresa.",
      cardOnlyMeta:
        "Configure a forma de pagamento na própria Meta. O EspaçoWhats não recebe os dados do seu cartão.",
      billingUnverified:
        "Pagamento na Meta: ainda não verificado pelo EspaçoWhats. Uma conexão ativa não confirma que a forma de pagamento está configurada.",
      billingChooseAccount:
        "Na Meta, escolha a conta WhatsApp com o ID acima para conferir sua forma de pagamento e cobranças.",
      openBilling: "Abrir cobrança na Meta",
      wabaLabel: "ID da sua conta WhatsApp: {{id}}",
      accountConnected: "Conta conectada à API oficial.",
      loadingStatus: "Consultando conexão…",
      statusFailed: "Não foi possível consultar a conexão. Tente atualizar.",
      refreshStatus: "Atualizar conexão",
      signupCancelled:
        "Conexão cancelada. Você pode iniciar novamente quando quiser.",
      signupFailed:
        "A Meta não concluiu a conexão. Confira sua conta e tente novamente.",
      signupAlreadyOpen:
        "Conclua ou cancele a conexão Meta já aberta antes de iniciar outra.",
      signupTimedOut:
        "O tempo para concluir a conexão terminou. Feche a janela da Meta e tente novamente.",

      missingConfig: "Conexão com a Meta temporariamente indisponível.",
      missingNumber:
        "Não foi possível identificar a conta e o número escolhidos na Meta.",
      loginFailed: "Não foi possível carregar o login da Meta.",
      pinTitle: "PIN de verificação em duas etapas",
      pinLabel: "PIN de 6 dígitos",
      pinHelp:
        "Escolha e guarde um PIN de 6 dígitos para este número. Se ele já possui verificação em duas etapas, use o PIN existente. Não é o código recebido por SMS. O sistema não guarda este PIN.",
      continueSignup: "Continuar com a Meta"
    }
  },
  messagesInput: {
    serviceWindowClosed:
      "Faz mais de 24 horas desde a última mensagem do cliente. Para falar com ele de novo, envie um template aprovado.",
    sendTemplate: "Enviar template"
  },
  templateMessageModal: {
    title: "Enviar template aprovado",
    help: "O primeiro contato e as conversas fora da janela de 24 horas só chegam ao cliente por um template aprovado pela Meta.",
    fieldLabel: "Template",
    variableLabel: "Variável {{index}}",
    noTemplates:
      "Nenhum template aprovado nesta conexão. Crie e aprove um template no Gerenciador de Negócios da Meta.",
    buttons: {
      ok: "Enviar",
      cancel: "Cancelar"
    }
  },
  backendErrors: {
    ERR_META_ASSETS_NOT_AUTHORIZED:
      "A conta ou o número não pertencem à autorização concluída. Conecte novamente usando a conta da sua empresa.",
    ERR_META_ASSET_VERIFICATION_FAILED:
      "Não foi possível confirmar a autorização na Meta. Tente novamente.",
    ERR_META_CODE_EXCHANGE_FAILED:
      "A autorização da Meta não pôde ser concluída. Inicie a conexão novamente.",
    ERR_META_CONNECT_MISSING_FIELDS:
      "A conexão está incompleta. Inicie a autorização na Meta novamente.",
    ERR_META_INVALID_REGISTRATION_PIN:
      "Informe um PIN de verificação em duas etapas com 6 dígitos.",
    ERR_META_PHONE_ALREADY_CONNECTED:
      "Este número oficial já está vinculado a outra conexão.",
    ERR_META_PHONE_REGISTER_FAILED:
      "A Meta não confirmou o registro do número. Verifique a configuração e tente novamente.",
    ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED:
      "Ainda não disponível para conexões via API Oficial da Meta.",
    ERR_WAPP_OFFICIAL_MODE_USE_META_CONNECT:
      "Esta conexão usa a API Oficial da Meta: não há QR Code. Use o botão de conectar pela Meta.",
    ERR_WAPP_NOT_OFFICIAL_MODE:
      "Esta conexão não está em modo API Oficial da Meta.",
    ERR_META_CONNECTION_NOT_CONFIGURED:
      "A conexão da API Oficial está incompleta. Reconecte o número em Conexões.",
    ERR_META_APP_NOT_CONFIGURED:
      "Conexão com a Meta temporariamente indisponível.",
    ERR_META_MEDIA_TOO_LARGE:
      "Arquivo grande demais para a API Oficial da Meta. O limite é 5 MB para imagem, 16 MB para áudio e vídeo e 100 MB para documento.",
    ERR_META_MEDIA_UPLOAD:
      "Não foi possível enviar o arquivo para a Meta. Tente novamente.",
    ERR_META_MEDIA_NOT_FOUND:
      "A Meta não encontrou este arquivo. Peça para o contato enviar novamente.",
    ERR_META_TEMPLATE_BODY_TOO_LONG:
      "O texto passa de 1024 caracteres, limite da Meta para template. Encurte a mensagem desta etapa.",
    ERR_META_TEMPLATE_SAMPLE:
      "Não foi possível enviar o boleto de exemplo que a Meta exige para aprovar um template com anexo.",
    ERR_WAPP_OFFICIAL_MODE_ONLY:
      "Esta ação só existe em conexões da API Oficial da Meta.",
    ERR_META_TEMPLATE_ON_GROUP: "Template não pode ser enviado para um grupo.",
    ERR_META_WINDOW_CLOSED:
      "A janela de 24 horas com este contato está fechada. Use um template aprovado para reabrir a conversa.",
    ERR_META_TEMPLATE_INVALID:
      "A Meta recusou este template. Confira o nome, o idioma e as variáveis.",
    ERR_META_TEMPLATE_NOT_APPROVED: "Este template não está aprovado na Meta.",
    ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE:
      "Escolha definitiva na criação da empresa. Não será possível trocar depois.",
    ERR_COMPANY_INVALID_WHATSAPP_MODE: "Selecione API oficial ou não oficial."
  },
  companyWhatsAppMode: {
    label: "Método de conexão WhatsApp",
    normal: "API não oficial (QR Code)",
    meta: "API oficial (Meta)",
    immutable:
      "Escolha definitiva na criação da empresa. Não será possível trocar depois."
  }
};
const en = {
  connections: {
    toasts: {
      metaConnected: "Successfully connected to the Meta Official API!"
    },
    buttons: {
      connectMeta: "Connect via Meta"
    },
    toolTips: {
      notAvailableOfficial:
        "Not available yet for Meta Official API connections."
    },
    meta: {
      signupTitle: "Connect your WhatsApp account",
      ownAccount:
        "Sign in to Meta with your own administrator account. Choose or create your company's business account and select your WhatsApp number.",
      billingSeparate:
        "Your EspaçoWhats subscription is separate from WhatsApp usage fees billed directly to your company by Meta.",
      cardOnlyMeta:
        "Set up your payment method on Meta. EspaçoWhats does not receive your card details.",
      billingUnverified:
        "Meta payment setup has not been verified by EspaçoWhats. An active connection does not confirm a payment method is configured.",
      billingChooseAccount:
        "On Meta, select the WhatsApp account with the ID above to review your payment method and charges.",
      openBilling: "Open Meta billing",
      wabaLabel: "Your WhatsApp account ID: {{id}}",
      accountConnected: "Account connected to the official API.",
      loadingStatus: "Checking connection…",
      statusFailed: "Could not check the connection. Try refreshing.",
      refreshStatus: "Refresh connection",
      signupCancelled: "Connection cancelled. You can start again when ready.",
      signupFailed:
        "Meta could not complete the connection. Check your account and try again.",
      signupAlreadyOpen:
        "Complete or cancel the current Meta signup before starting another.",
      signupTimedOut:
        "The connection session expired. Close the Meta window and try again.",

      missingConfig: "Meta connection is temporarily unavailable.",
      missingNumber:
        "Could not identify the account and phone number selected on Meta.",
      loginFailed: "Could not load Meta login.",
      pinTitle: "Two-step verification PIN",
      pinLabel: "6-digit PIN",
      pinHelp:
        "Choose and keep a 6-digit PIN for this number. If two-step verification is already enabled, use its existing PIN. This is not the SMS verification code. This system does not store the PIN.",
      continueSignup: "Continue with Meta"
    }
  },
  messagesInput: {
    serviceWindowClosed:
      "More than 24 hours have passed since the last customer message. Send an approved template to reach them again.",
    sendTemplate: "Send template"
  },
  templateMessageModal: {
    title: "Send approved template",
    help: "The first contact and any conversation outside the 24 hour window only reach the customer through a template approved by Meta.",
    fieldLabel: "Template",
    variableLabel: "Variable {{index}}",
    noTemplates:
      "No approved template on this connection. Create and approve one in the Meta Business Manager.",
    buttons: {
      ok: "Send",
      cancel: "Cancel"
    }
  },
  backendErrors: {
    ERR_META_APP_NOT_CONFIGURED: "Meta connection is temporarily unavailable.",
    ERR_META_ASSETS_NOT_AUTHORIZED:
      "The account or number does not belong to the completed authorization. Connect again using your company's account.",
    ERR_META_ASSET_VERIFICATION_FAILED:
      "Could not confirm authorization with Meta. Try again.",
    ERR_META_CODE_EXCHANGE_FAILED:
      "Meta authorization could not be completed. Start the connection again.",
    ERR_META_CONNECT_MISSING_FIELDS:
      "The connection is incomplete. Start Meta authorization again.",
    ERR_META_INVALID_REGISTRATION_PIN:
      "Enter a 6-digit two-step verification PIN.",
    ERR_META_PHONE_ALREADY_CONNECTED:
      "This official phone number is already linked to another connection.",
    ERR_META_PHONE_REGISTER_FAILED:
      "Meta did not confirm phone registration. Check the configuration and try again.",
    ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED:
      "Not available yet for Meta Official API connections.",
    ERR_WAPP_OFFICIAL_MODE_ONLY:
      "This action only exists on Meta Official API connections.",
    ERR_META_TEMPLATE_ON_GROUP: "A template cannot be sent to a group.",
    ERR_META_CONNECTION_NOT_CONFIGURED:
      "The official API connection is incomplete. Reconnect the number under Connections.",
    ERR_META_WINDOW_CLOSED:
      "The 24 hour window with this contact is closed. Use an approved template to reopen the conversation.",
    ERR_META_TEMPLATE_INVALID:
      "Meta rejected this template. Check its name, language and variables.",
    ERR_META_TEMPLATE_NOT_APPROVED: "This template is not approved on Meta.",
    ERR_COMPANY_WHATSAPP_MODE_IMMUTABLE:
      "This choice is permanent when the company is created and cannot be changed later.",
    ERR_COMPANY_INVALID_WHATSAPP_MODE: "Select official or unofficial API."
  },
  companyWhatsAppMode: {
    label: "WhatsApp connection method",
    normal: "Unofficial API (QR code)",
    meta: "Official API (Meta)",
    immutable:
      "This choice is permanent when the company is created and cannot be changed later."
  }
};

export const whatsappProvidersMessages = { pt, pt_PT: pt, en };
