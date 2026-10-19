const messages = {
  en: {
    translations: {
      agentPreview: {
        launcher: "Espaço Agent",
        subtitle: "An extra hand in your operation",
        avatarTitle: "Kirby, the Espaço Agent character",
        panel: "Espaço Agent · Luiza's Agent chat",
        greeting: "Hello, {{name}}.",
        chat: {
          sources: "Sources consulted",
          contextChanged:
            "The context has changed. Continuing with current permissions and data.",
          badge: "Luiza's Agent · by your side at work",
          connected: "Reply from Luiza's Agent",
          progress: "Thinking about your request…",
          progressConnecting: "Connecting the dots…",
          progressWorking: "Working on it, be right back…",
          progressPreparing: "Putting care into your answer…",
          progressContinuing: "Just a moment, I'm still with you…",
          error: "Could not receive a reply. Please try again.",
          unavailable:
            "Luiza's Agent is unavailable right now. Please try again.",
          timeout: "Luiza's Agent took too long to reply. Please try again.",
          cancelled: "Reply stopped.",
          invalidRequest:
            "Could not send this message. Review the text and try again.",
          sessionExpired:
            "Your session has expired. Sign in again to continue.",
          permissionDenied: "Your account does not have access to this chat.",
          agentDisabled:
            "Luiza’s is disabled for this company. The super admin can enable it in Settings → Administration → Luiza’s Agent.",
          moduleBlocked:
            "Luiza’s cannot access this feature. Ask the super admin to review the available modules.",
          busy: "The agent is busy. Wait a moment and try again.",
          notConfigured:
            "The connection to Luiza's Agent has not been configured yet.",
          emptyReply: "Luiza's Agent returned no reply. Please try again.",
          retry: "Try again",
          placeholder: "What shall we work on today?"
        }
      },
      visual: {
        visualizar: "View",
        centralAtendimento: "Support center",
        alternarNavegacao: "Toggle navigation",
        trilha: "Breadcrumb",
        ferramentas: "Tools and notices",
        acoes: "Actions",
        colunas: "Visible columns",
        selecionarPagina: "Select all on this page",
        selecionar: "Select {{nome}}",
        selecionados: "{{count}} selected",
        limpar: "Clear selection",
        carregando: "Loading…",
        semResultados: "No results found.",
        exibindo: "Showing {{count}} of {{total}}",
        anterior: "Previous page",
        proxima: "Next page",
        descricaoContatos:
          "Contacts, groups and custom information used in flows and campaigns.",
        importar: "Import",
        novoContato: "New contact",
        nomeTelefone: "Name / phone",
        tipo: "Type",
        etiquetas: "Tags",
        acoesContato: "Actions for {{nome}}",
        editar: "Edit",
        excluir: "Delete",
        atualizar: "Refresh list",
        exportar: "Export",
        buscarContatos: "Search name, phone or email",
        fila: "Queue",
        saudacao: "Greeting message",
        automacao: "Automation",
        editarFila: "Edit queue {{nome}}",
        novaFila: "New queue",
        novoEnvio: "New campaign",
        campanhas: "Campaigns and messages",
        campanha: "Campaign",
        emAndamento: "In progress",
        agendadas: "Scheduled",
        concluidas: "Completed",
        inativas: "Inactive",
        canceladas: "Cancelled",
        campanhasPagina: "Campaigns on this page",
        relatorio: "View report",
        pausar: "Pause campaign",
        retomar: "Resume campaign",
        confirmacao: "Confirmation",
        habilitada: "Enabled",
        desabilitada: "Disabled",
        semAgendamento: "Not scheduled",
        naoConcluida: "Not completed",
        publico: "Audience",
        conexao: "Connection",
        resumo: "Overview",
        aoVivo: "Live",
        desempenho: "Performance",
        filasAgora: "Live queues",
        distribuicaoFilas: "Open conversations by queue.",
        atendentes: "Agents",
        periodo: "Period",
        redimensionar: "Resize panels",
        buscarAtendimentos: "Search name, phone or ticket number",
        contexto: "Context",
        detalhesContato: "Contact details",
        fluxosDescricao:
          "Design conversation paths and configure support using connected blocks.",
        canvas: "Canvas",
        editor: "Flow editor",
        versaoPublicada: "Published",
        campanhasDescricao:
          "Create broadcasts, track campaigns and organize scheduled messages.",
        suporte: "Support",
        blocos: "Blocks",
        filtrar: "Filter"
      },
      envios: {
        titulo: "Campaigns and messages",
        massivo: "Bulk messages",
        agendamentos: "Scheduled messages",
        publicos: "Audiences and lists",
        configuracao: "Delivery settings"
      },
      contexto: {
        segmentos: "Contact types",
        grupos: "Groups",
        titulo: "Context",
        contato: "Contact",
        atendimento: "Ticket",
        historico: "History",
        carregando: "Loading history…",
        erroHistorico: "Could not load the history.",
        semHistorico: "No previous tickets available.",
        semFila: "No queue",
        verConversa: "View conversation",
        protocolo: "Ticket",
        responsavel: "Assigned to",
        fila: "Queue"
      },
      centralConfig: {
        secoes: "Settings sections",
        atendimento: "Support",
        equipe: "Team and resources",
        canais: "Channels and integrations",
        administracao: "Administration",
        voltar: "Back to settings",
        itens: {
          filas: {
            titulo: "Support queues",
            descricao: "Organize teams, channels and opening hours."
          },
          fluxos: {
            titulo: "Conversation flows",
            descricao: "Connect blocks and test each conversation path."
          },
          horarios: {
            titulo: "Opening hours",
            descricao: "Define schedules, exceptions and team availability."
          },
          mensagens: {
            titulo: "Quick replies",
            descricao: "Reusable responses and agent shortcuts."
          },
          aparencia: {
            titulo: "Customize appearance",
            descricao: "Organization colors, logos, banners and login page."
          },
          opcoes: {
            titulo: "Support rules",
            descricao: "Ratings, transfers, timeouts and chatbot policies."
          },
          usuarios: {
            titulo: "Team members",
            descricao: "Manage users, permissions and assigned queues."
          },
          ajuda: {
            titulo: "Help center",
            descricao: "Publish guidance and content for your team."
          },
          conexoes: {
            titulo: "Communication channels",
            descricao: "Connect and manage your support accounts."
          },
          integracoes: {
            titulo: "ChatGPT and integrations",
            descricao: "Connect ChatGPT and manage authorized access."
          },
          voz: {
            titulo: "Voice channel",
            descricao: "Manage voice settings and connections."
          },
          empresas: {
            titulo: "Organizations",
            descricao: "Manage organizations on the platform."
          },
          planos: {
            titulo: "Plans and features",
            descricao: "Set limits and available features for each plan."
          },
          parceiros: {
            titulo: "Partners",
            descricao: "Manage partner operations and access."
          },
          pagamentos: {
            titulo: "Payment providers",
            descricao: "Configure platform billing providers."
          },
          traducoes: {
            titulo: "Languages and translations",
            descricao: "Customize platform text and languages."
          }
        }
      },
      fluxos: {
        titulo: "Flows and automation",
        editor: "Flow editor",
        canvas: "Canvas",
        blocos: "Blocks",
        conversa: "Conversation",
        atendimento: "Support",
        fechar: "Close",
        entrada: "Block input",
        saida: "Block output",
        pausado: "Paused",
        semMensagem: "Configure the message in the inspector",
        nomeBloco: "Option name",
        tipoBloco: "Block type",
        mensagem: "Message",
        variaveis:
          "Variables: {{name}}, {{firstname}}, {{queue}}. Customers select options by number.",
        filaDestino: "Destination queue",
        selecionarFila: "Select a queue",
        descricaoHumano:
          "Stops the chatbot and leaves the ticket available for the support team.",
        midia: "Attachment",
        anexar: "Select file",
        removerMidia: "Remove attachment",
        opcoes: "Next options",
        subir: "Move option up",
        descer: "Move option down",
        adicionarOpcao: "Add option",
        conectadoA: "Previous block",
        semConexao: "Disconnected",
        blocoAtivo: "Active block",
        desconectar: "Disconnect",
        excluir: "Delete",
        carregando: "Loading flow…",
        erroCarregar: "Could not load this flow.",
        tentarNovamente: "Try again",
        rascunhoAntigo:
          "An older draft exists in this browser. The current server version was loaded.",
        erroRascunho: "Could not store this draft. Publish before leaving.",
        publicado: "Flow published.",
        sairRascunho:
          "There are unpublished changes. Leave the editor? Pending attachments will need to be selected again.",
        rascunho: "Draft · unpublished",
        emUso: "Published",
        contagem: "{{count}} block",
        contagem_plural: "{{count}} blocks",
        testar: "Test path",
        publicar: "Publish",
        buscarBloco: "Search blocks",
        dicaPaleta:
          "Drag a block to the canvas or click to add it. Connect the handles to change the conversation path.",
        desfazer: "Undo",
        refazer: "Redo",
        minimapa: "Flow minimap",
        ajudaTeclado:
          "Select a block to edit it. Use Previous block to connect using the keyboard.",
        reduzirZoom: "Zoom out",
        aumentarZoom: "Zoom in",
        enquadrar: "Fit view",
        organizar: "Arrange blocks",
        pendencias:
          "{{count}} block needs a name, connection or destination queue.",
        pendencias_plural:
          "{{count}} blocks need a name, connection or destination queue.",
        pronto: "Connections are valid. Changes go live when you publish.",
        simulacaoDescricao:
          "Walk through the options as a customer. This preview does not send messages or change tickets.",
        simulacaoHumano: "The chatbot stops and the support team continues.",
        simulacaoTransferencia: "The conversation moves to {{fila}}.",
        simulacaoFim:
          "End of flow. The ticket becomes available to the human support team.",
        reiniciar: "Restart test",
        excluirBloco: "Delete block?",
        excluirDescricao:
          "Following blocks will be kept and disconnected. Reconnect them before publishing.",
        selecionarFluxo: "Select flow",
        novoFluxo: "Create flow",
        secoes: "Automation sections",
        filasCanais: "Queues and channels",
        integracoes: "Integrations",
        primeiroFluxo: "Design your first conversation",
        descricaoInicio:
          "Create a queue, add blocks and connect your support steps.",
        descricaoEditor:
          "Create, connect and test blocks with a complete view of the conversation.",
        abrirEditor: "Open canvas",
        tipos: {
          inicio: "Conversation start",
          mensagem: "Send message",
          menu: "Options menu",
          midia: "Send media",
          transferir: "Transfer to queue",
          humano: "Human support"
        }
      },
      redesign: {
        importarCsv: "Import CSV file",
        exportarCsv: "Export contacts to CSV",
        descricaoContatos:
          "Contacts, groups and information for a personal service.",
        descricaoCampanhas:
          "Campaigns and schedules to keep track of every delivery.",
        descricaoConfiguracoes:
          "Service rules, team, channels and your organization’s identity.",

        operacao: "Operations",
        relacionamento: "Relationships",
        automacao: "Automation and AI",
        administracao: "Administration",
        envios: "Campaigns",
        listasContatos: "Contact lists",
        abrirAtendimento: "Open conversation",
        visaoGeral: "Operation overview",
        descricaoPainel: "Metrics, conversations and team in one place.",
        organizacao: "Organization"
      },
      voiceCalls: {
        settingsTab: "Experimental calls",
        companySwitch: "Experimental calls",
        enabled: "Enabled",
        disabled: "Disabled",
        experimentalTitle: "Experimental calling integration",
        warning:
          "Unofficial WhatsApp integration. There is a risk of disconnection, suspension, or account ban. Use it only in the test tenant.",
        serviceUnavailable: "The calling service is currently unavailable.",
        riskConsent:
          "I understand the risk and want to link a second device using a QR code.",
        status: "Status",
        disconnect: "Turn off and unlink",
        pair: "Link with QR code",
        noConnections: "Create a WhatsApp connection before configuring calls.",
        qrInstruction:
          "In WhatsApp, open Linked devices and scan this second QR code.",
        disconnectedSuccess: "Calling integration unlinked.",
        incoming: "Incoming call",
        incomingHint: "The first attendant to accept will take the call.",
        reject: "Reject",
        accept: "Answer",
        active: "Call in progress",
        mute: "Mute microphone",
        transcribe: "Transcribe call",
        record: "Record call",
        end: "End call",
        states: {
          disconnected: "Disconnected",
          pairing: "Waiting for QR code",
          connecting: "Connecting",
          open: "Connected",
          logged_out: "Unlinked"
        },
        errors: {
          load: "Could not load experimental calls.",
          pair: "Could not generate the calling QR code.",
          action: "Could not complete the call action.",
          transcriptionConfig:
            "Set GROQ_API_KEY in the environment to enable transcription.",
          microphone: "Microphone permission was denied. The call was ended."
        }
      },
      date: {
        yesterday: "Yesterday"
      },
      common: {
        search: "Search",
        filter: "Filter",
        edit: "Edit",
        delete: "Delete",
        cancel: "Cancel",
        save: "Save",
        you: "You",
        confirm: "Confirm",
        confirmation: "Confirmation",
        areyousure: "Are you sure?",
        close: "Close",
        closed: "Closed",
        error: "Error",
        success: "Success",
        actions: "Actions",
        add: "Add",
        name: "Name",
        email: "Email",
        phone: "Phone",
        language: "Language",
        company: "Company",
        user: "User",
        users: "Users",
        connection: "Connection",
        connections: "Connections",
        queue: "Queue",
        queues: "Queues",
        contact: "Contact",
        messages: "Messages",
        whatsappNumber: "WhatsApp Number",
        dueDate: "Due Date",
        copy: "Copy",
        paste: "Paste",
        proceed: "Proceed",
        enabled: "Enabled",
        disabled: "Disabled",
        undefined: "Undefined",
        yes: "Yes",
        no: "No",
        noqueue: "No queue",
        rating: "Rating",
        transferTo: "Transfer to",
        key: "Key",
        value: "Value",
        validations: {
          required: "This field is required",
          short: "Value too short",
          long: "Value too long",
          invalid: "Invalid value",
          invalidEmail: "Invalid email",
          invalidPhone: "Invalid phone number"
        },
        serverTime: "Server time:",
        clientTime: "Client time:",
        differenceMinutes: "Difference: {{count}} minute(s)"
      },
      signup: {
        title: "Sign Up",
        toasts: {
          success: "User created successfully! Log in now!!!",
          fail: "Error creating user. Check the provided data."
        },
        form: {
          name: "Name",
          nickname: "Nickname",
          birthdayDay: "Day",
          birthdayMonth: "Month",
          email: "Email",
          password: "Password"
        },
        buttons: {
          submit: "Sign Up",
          login: "Already have an account? Log in!"
        }
      },
      login: {
        title: "Login",
        form: {
          email: "Email",
          password: "Password",
          newPassword: "New password",
          confirmPassword: "Confirm password",
          passwordStrength:
            "Use at least 8 characters with uppercase, lowercase, and a number."
        },
        buttons: {
          submit: "Log In",
          continue: "Continue",
          createPassword: "Create password and log in",
          changeEmail: "Change email",
          backToLogin: "Back to login",
          register: "Don't have an account? Sign up!"
        },
        errors: {
          emailNotFound: "We couldn't find this email.",
          passwordMismatch: "The passwords do not match.",
          passwordStrength:
            "The password must have at least 8 characters, uppercase, lowercase, and a number.",
          activationInvalid: "This activation link is invalid or has expired."
        },
        activation: {
          title: "Create your password",
          account: "Activating the account {{email}}"
        }
      },
      companies: {
        title: "Register Company",
        form: {
          name: "Company Name",
          plan: "Plan",
          token: "Token",
          submit: "Register",
          success: "Company created successfully!"
        }
      },
      auth: {
        toasts: {
          success: "Login successful!"
        },
        token: "Token"
      },
      dashboard: {
        contactReport: {
          button: "Export contacts",
          title: "Export contact flow",
          columns: "Report columns",
          contactedAt: "Contact date",
          name: "Name",
          number: "Number",
          notes: "Internal notes",
          historyNotice:
            "Changes made before this history was enabled cannot be reconstructed."
        },
        usersOnline: "Users online",
        ticketsWaiting: "Tickets waiting",
        ticketsOpen: "Open tickets",
        ticketsDone: "Resolved tickets",
        totalTickets: "Total tickets",
        newContacts: "New contacts",
        avgServiceTime: "Average service time",
        avgWaitTime: "Average wait time",
        ticketsOnPeriod: "Tickets in the period",
        userCurrentStatus: "Current status",
        filter: {
          period: "Period",
          custom: "Custom",
          last3days: "Last 3 days",
          last7days: "Last 7 days",
          last14days: "Last 14 days",
          last30days: "Last 30 days",
          last90days: "Last 90 days"
        },
        date: {
          start: "Start date",
          end: "End date"
        },
        ticketCountersLabels: {
          created: "Created",
          closed: "Closed"
        },
        blog: {
          title: "Espaço Whats Blog",
          loading: "Loading posts...",
          error: "Could not load blog posts right now.",
          empty: "No blog posts found.",
          showAll: "Show all posts",
          showLess: "Show less",
          openPost: "Read post",
          previous: "Previous post",
          next: "Next post"
        }
      },
      connections: {
        title: "Connections",
        toasts: {
          deleted: "WhatsApp connection successfully deleted!"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "Are you sure? This action cannot be undone.",
          disconnectTitle: "Disconnect",
          disconnectMessage:
            "Are you sure? You will need to scan the QR Code again.",
          closeTickets: "Close all open tickets from this connection"
        },
        buttons: {
          add: "Add WhatsApp",
          disconnect: "Disconnect",
          tryAgain: "Try Again",
          qrcode: "QR CODE",
          newQr: "New QR CODE",
          connecting: "Connecting"
        },
        toolTips: {
          disconnected: {
            title: "Failed to initiate WhatsApp session",
            content:
              "Make sure your phone is connected to the internet and try again, or request a new QR Code."
          },
          qrcode: {
            title: "Waiting for QR Code scan",
            content:
              "Click the 'QR CODE' button and scan the QR Code with your phone to start the session."
          },
          connected: {
            title: "Connection established!"
          },
          timeout: {
            title: "Connection to the phone has been lost",
            content:
              "Make sure your phone is connected to the internet and WhatsApp is open, or click 'Disconnect' to get a new QR Code."
          },
          passkey: {
            title: "Passkey authentication required",
            content:
              "Click the passkey button and use the browser extension to capture the authenticated WhatsApp Web session."
          },
          refresh: "Refresh",
          disconnect: "Disconnect",
          scan: "Scan QR Code",
          newQr: "Request new QR Code",
          retry: "Try Again",
          resetPasskey: "Reset passkey session"
        },
        table: {
          contact: "Contact",
          name: "Name",
          status: "Status",
          lastUpdate: "Last Update",
          default: "Default",
          actions: "Actions",
          session: "Session"
        }
      },
      internalChat: {
        title: "Internal Chat"
      },
      whatsappGroups: {
        configure: "Configure group",
        mode: "Group mode",
        conversation: "Conversation",
        attendance: "Attendance",
        allowedQueues: "Allowed queues",
        serviceQueue: "Service queue",
        cancel: "Cancel",
        save: "Save",
        confirmConversation:
          "Remove this group from the service flow? The active service will end without a rating."
      },
      whatsappModal: {
        title: {
          add: "Add WhatsApp",
          edit: "Edit WhatsApp"
        },
        form: {
          name: "Name",
          default: "Default"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "WhatsApp saved successfully."
      },
      qrCode: {
        message: "Scan the QR Code to start the session",
        extensionHint: "Authenticate through WhatsApp Web",
        startCapture: "Capture WhatsApp Web session",
        installExtension: "Install Capture Extension"
      },
      passkeyModal: {
        title: "Capture WhatsApp Web Extension",
        instructions:
          "Use the browser extension to capture the authenticated WhatsApp Web session and send it to the server.",
        connectorNotFound:
          "Extension not detected. Install the passkey capture extension and reload the page.",
        connectorReady:
          "Extension detected. Click below to authenticate through WhatsApp Web.",
        startCapture: "Start Capture",
        waitingForCapture: "Waiting for WhatsApp Web session capture…",
        existingSession: "WhatsApp Web already has a session for {{number}}.",
        captureExisting: "Capture this session",
        clearAndContinue: "Clear local session and continue",
        importSent: "Session captured and sent successfully.",
        importError: "Capture failed: {{reason}}.",
        missingToken: "Capture token is missing. Please reload the page.",
        downloadExtension: "Download capture extension",
        installInstructions: "How to install",
        hideInstructions: "Hide instructions",
        instructionsIntro: "Follow the steps below to install the extension:",
        installStep1: "Download the extension ZIP file.",
        installStep2: "Extract the ZIP file to a folder on your computer.",
        installStep3: "Open Google Chrome and go to chrome://extensions/.",
        installStep4:
          "Enable Developer mode using the toggle in the top-right corner.",
        installStep5: 'Click "Load unpacked".',
        installStep6:
          "Select the extracted folder containing the extension files.",
        installStep7: "The extension is now installed and ready to use.",
        installStep8: "Refresh this page with F5 and try to connect again."
      },
      contacts: {
        title: "Contacts",
        toasts: {
          deleted: "Contact successfully deleted!"
        },
        searchPlaceholder: "Search...",
        confirmationModal: {
          deleteTitle: "Delete ",
          importTitlte: "Import Contacts",
          deleteMessage:
            "Are you sure you want to delete this contact? All related interactions will be lost.",
          importMessage: "Do you want to import all contacts from the phone?"
        },
        buttons: {
          import: "Import Contacts",
          add: "Add Contact"
        },
        table: {
          name: "Name",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions"
        }
      },
      contactModal: {
        title: {
          add: "Add Contact",
          edit: "Edit Contact"
        },
        form: {
          mainInfo: "Contact Information",
          extraInfo: "Additional Information",
          name: "Name",
          number: "WhatsApp Number",
          email: "Email",
          extraName: "Field Name",
          extraValue: "Value",
          disableBot: "Disable chatbot"
        },
        buttons: {
          addExtraInfo: "Add Information",
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "Contact saved successfully."
      },
      queueModal: {
        title: {
          add: "Add Queue",
          edit: "Edit Queue"
        },
        form: {
          name: "Name",
          color: "Color",
          greetingMessage: "Greeting Message",
          complationMessage: "Completion Message",
          outOfHoursMessage: "Out of Hours Message",
          ratingMessage: "Rating Message",
          transferMessage: "Transfer Message",
          connections: "WhatsApp connections",
          connectionsHelp:
            "The queue and chatbot will only be offered on these connections.",
          token: "Token"
        },
        validation: {
          connectionRequired: "Select at least one connection for the queue."
        },
        tabs: {
          label: "Queue sections",
          data: "Queue Data",
          chatbot: "Chatbot",
          chatbotHint: "Save the queue before building the chatbot",
          schedules: "Business Hours"
        },
        toasts: {
          saved: "Queue saved successfully",
          deleted: "Attachment removed successfully"
        },
        confirmationModal: {
          deleteTitle: "Remove attachment",
          deleteMessage:
            "Are you sure you want to remove this queue's attachment? This action cannot be undone."
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
          attach: "Attach File"
        },
        serviceHours: {
          dayWeek: "Day of the week",
          startTimeA: "Start Time - Shift A",
          endTimeA: "End Time - Shift A",
          startTimeB: "Start Time - Shift B",
          endTimeB: "End Time - Shift B",
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          sunday: "Sunday"
        }
      },
      userModal: {
        title: {
          add: "Add User",
          edit: "Edit User"
        },
        listItems: {
          adminProfile: "Administrator",
          userProfile: "User"
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Password",
          profile: "Profile",
          visibleScreens: "Visible screens",
          screenAccessHint:
            "Regular users can view selected screens. Administrative actions remain limited to administrators."
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "User saved successfully."
      },
      scheduleModal: {
        title: {
          add: "New Schedule",
          edit: "Edit Schedule"
        },
        subtitle:
          "Define the audience and occasion, then personalize every delivery.",
        sections: {
          audience: "Audience",
          when: "When",
          message: "Message and variables",
          media: "Media",
          review: "Review"
        },
        form: {
          body: "Message",
          contact: "Contact",
          contacts: "Contacts",
          allContacts: "All eligible contacts",
          kind: "Schedule type",
          sendAt: "Scheduled Date",
          sendTime: "Annual time",
          timezone: "Time zone",
          commemorativeDate: "Commemorative date",
          sentAt: "Sent Date",
          saveMessage: "Save message in ticket",
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
          missingData: "Some data is missing",
          hint: "Preview the message with a real contact before saving."
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel",
          save: "Save schedule",
          preview: "Generate preview",
          attach: "Add media",
          removeMedia: "Remove"
        },
        success: "Schedule saved successfully."
      },
      tagModal: {
        title: {
          add: "New Tag",
          edit: "Edit Tag",
          addKanban: "New Lane",
          editKanban: "Edit Lane"
        },
        form: {
          name: "Name",
          color: "Color",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Add",
          okEdit: "Save",
          cancel: "Cancel"
        },
        success: "Tag saved successfully.",
        successKanban: "Lane saved successfully."
      },
      chat: {
        noTicketMessage: "Select a ticket to start the conversation."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "DRAG AND DROP FILES IN THE FIELD BELOW",
          titleFileList: "List of file(s)"
        }
      },
      billing: {
        trialDays: "Free trial days",
        trialDaysHelp: "0 means no free trial",
        dueDay: "Due day",
        dueDayHelp: "Monthly; shorter months use their last day",
        prorata: "Prorated",
        trialEndsIn: "Your trial ends in {{days}} days!",
        noActiveTrial: "No active trial",
        period: "Period: {{start}} to {{end}}"
      },
      todolist: {
        title: "Task board",
        loading: "Loading board...",
        loadError: "The board could not be loaded.",
        emptyColumn: "Drag a task to this column",
        dragTask: "Move task",
        dragTaskLabel: "Move task {{title}}",
        completedAt: "Completed on {{date}}",
        editTaskTitle: "Edit task",
        newTaskTitle: "New task",
        targets: { global: "Global", user: "User", queue: "Queue" },
        deadline: { ok: "On track", warning: "Due soon", overdue: "Overdue" },
        details: {
          noDescription: "No description",
          state: "State",
          createdBy: "Created by",
          target: "Target",
          createdAt: "Created at",
          dueAt: "Due at",
          completedAt: "Completed at",
          history: "History"
        },
        events: {
          CREATED: "Created",
          EDITED: "Edited",
          MOVED: "Moved",
          COMPLETED: "Completed",
          REOPENED: "Reopened"
        },
        form: {
          name: "Task name",
          columnName: "Column name",
          description: "Description",
          targetType: "Target",
          assignee: "Assigned user",
          queue: "Assigned queue",
          dueAt: "Due at"
        },
        buttons: {
          add: "Add",
          newTask: "New task",
          save: "Save",
          configure: "Configure columns",
          clearFilter: "Clear filter",
          tryAgain: "Try again",
          editTask: "Edit task",
          deleteTask: "Delete task",
          addColumn: "Add column"
        },
        filters: {
          from: "Completed from",
          to: "Completed to",
          invalidDate: "Invalid date"
        },
        settings: {
          title: "Configure columns",
          description:
            "Customize order, names and colors. Only one column represents completed tasks.",
          markDone: "Mark {{title}} as the completed column",
          doneColumn: "Completed tasks column",
          regularColumn: "Work in progress column",
          moveLeft: "Move left",
          moveRight: "Move right",
          editColumn: "Edit column",
          newColumn: "New column",
          chooseColor: "Choose color",
          useBrandColor: "Use company color"
        },
        confirm: {
          deleteTaskTitle: "Delete task",
          deleteTask: "Delete the task “{{title}}”?",
          deleteColumnTitle: "Delete column",
          deleteColumn: "Delete the column “{{title}}”?"
        },
        toasts: {
          taskCreated: "Task created.",
          taskSaved: "Task updated.",
          taskDeleted: "Task deleted.",
          columnSaved: "Column saved.",
          columnDeleted: "Column deleted.",
          doneColumnChanged: "Completed column updated."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "New"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Queues"
      },
      tickets: {
        toasts: {
          deleted: "The ticket you were working on has been deleted."
        },
        notification: {
          message: "Message from",
          nomessages: "No messages"
        },
        tabs: {
          open: { title: "Open" },
          closed: { title: "Closed" },
          groups: {
            title: "Groups",
            conversations: "Conversations",
            attendances: "Attendances",
            pending: "Pending",
            open: "In service",
            closed: "Closed"
          },
          search: { title: "Search" }
        },
        search: {
          placeholder: "Search for ticket and messages",
          filterByTags: "Filter by tags",
          filterByUsers: "Filter by users"
        },
        buttons: {
          showAll: "All"
        }
      },
      transferTicketModal: {
        title: "Transfer Ticket",
        fieldLabel: "Type to search for users",
        fieldConnectionLabel: "Transfer through connection",
        fieldConnectionPlaceholder: "Select a connection",
        connectionHelp:
          "After choosing the connection, select one of its available queues.",
        connectionUnavailable: "disconnected",
        fieldQueueLabel: "Transfer to queue",
        fieldQueuePlaceholder: "Select a queue",
        noOptions: "No user found with that name",
        buttons: {
          ok: "Transfer",
          cancel: "Cancel"
        }
      },
      ticketsList: {
        pendingHeader: "Pending",
        assignedHeader: "Assigned",
        noTicketsTitle: "Nothing here!",
        noTicketsMessage: "No ticket found with this status or searched term",
        buttons: {
          accept: "Accept"
        }
      },
      newTicketModal: {
        title: "Create Ticket",
        fieldLabel: "Type to search for contact",
        add: "Add",
        buttons: {
          ok: "Save",
          cancel: "Cancel"
        }
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Connections",
          tickets: "Tickets",
          quickMessages: "Quick Responses",
          contacts: "Contacts",
          queues: "Queues & Chatbot",
          tags: "Tags",
          administration: "Administration",
          service: "Service",
          users: "Users",
          settings: "Settings",
          helps: "Help",
          chatgpt: "ChatGPT",
          schedules: "Schedules",
          campaigns: "Campaigns",
          annoucements: "Announcements",
          chats: "Internal Chat",
          financeiro: "Financial",
          subscription: "Subscription",
          cobranca: "Billing",
          prospeccao: "Prospecting",
          logout: "Logout",
          management: "Management",
          kanban: "Kanban",
          tasks: "Tasks"
        },
        appBar: {
          i18n: {
            language: "English",
            language_short: "EN"
          },
          user: {
            profile: "Profile",
            subscriptionValidUntilLabel: "Subscription valid until",
            darkmode: "Dark mode",
            lightmode: "Light mode",
            language: "Select language",
            logout: "Logout"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Pilot enabled",
        disabled: "Pilot disabled",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Recommended",
          description:
            "The simplest way to use your customer service data in ChatGPT.",
          details:
            "Install the plugin, connect your Espaço Whats account with OAuth, and use it from the plugin menu or by mentioning @EspaçoWhats.",
          open: "Open plugin in ChatGPT",
          steps: {
            title: "How to install and connect",
            open: "Open the Espaço Whats plugin in ChatGPT",
            install: "Select Install plugin",
            connect: "Select Connect",
            login: "Sign in with the tenant, administrator email, and password",
            use: "Use the plugin menu or mention @EspaçoWhats"
          },
          marketplace: {
            title: "GitHub installation for workspaces",
            description:
              "An administrator can also import the official marketplace from Workspace settings → Plugins → Add → Import marketplace.",
            repository: "Repository",
            path: "Path",
            pathValue: "Leave blank",
            branch: "Branch",
            copy: "Copy repository"
          }
        },
        warningTitle: "Personal and clinical data",
        warning:
          "When connected, identifiable conversations and possible clinical data may be sent to ChatGPT based on your questions. Use only after legal and administrative approval.",
        copy: "Copy URL",
        connection: {
          title: "MCP server URL",
          description:
            "Espaço Whats does not use an OpenAI key. Intelligence and limits belong to the user's ChatGPT plan."
        },
        steps: {
          title: "How to connect",
          open: "Open ChatGPT Developer Mode",
          create: "Create a Draft MCP integration",
          url: "Paste the MCP URL",
          oauth: "Choose OAuth",
          login: "Sign in with the tenant, administrator email, and password"
        },
        connections: {
          title: "Active connections",
          empty: "No ChatGPT connection.",
          client: "Client",
          admin: "Administrator",
          created: "Created",
          lastUse: "Last used",
          revoke: "Revoke",
          revokeAll: "Revoke all"
        },
        revoke: {
          title: "Revoke connection",
          one: "This connection will lose access immediately.",
          all: "All connections for this tenant will lose access immediately."
        },
        toasts: {
          copied: "MCP URL copied.",
          repositoryCopied: "Plugin repository copied.",
          revoked: "Connection revoked."
        }
      },
      notifications: {
        noTickets: "No notifications."
      },
      quickMessages: {
        title: "Quick Responses",
        buttons: {
          add: "New Response"
        },
        dialog: {
          shortcode: "Shortcut",
          message: "Response"
        }
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Search",
        subMenus: {
          list: "Panel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Open",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Lane?",
          deleteMessage: "This action cannot be undone."
        },
        table: {
          name: "Name",
          color: "Color",
          tickets: "Tickets",
          actions: "Actions"
        },
        buttons: {
          add: "New Lane"
        },
        toasts: {
          deleted: "Lane deleted successfully."
        }
      },
      contactLists: {
        title: "Contact Lists",
        table: {
          name: "Name",
          contacts: "Contacts",
          actions: "Actions"
        },
        buttons: {
          add: "New List"
        },
        dialog: {
          name: "Name",
          company: "Company",
          okEdit: "Edit",
          okAdd: "Add",
          add: "Add",
          edit: "Edit",
          cancel: "Cancel"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone."
        },
        toasts: {
          deleted: "Record deleted",
          created: "Record created"
        }
      },
      contactListItems: {
        title: "Contacts",
        searchPlaceholder: "Search",
        buttons: {
          add: "New",
          lists: "Lists",
          import: "Import"
        },
        dialog: {
          name: "Name",
          number: "Number",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Edit",
          okAdd: "Add",
          add: "Add",
          edit: "Edit",
          cancel: "Cancel"
        },
        table: {
          name: "Name",
          number: "Number",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone.",
          importMessage:
            "Do you want to import the contacts from this spreadsheet? ",
          importTitlte: "Import"
        },
        toasts: {
          deleted: "Record deleted"
        }
      },
      campaigns: {
        title: "Campaigns",
        searchPlaceholder: "Search",
        buttons: {
          add: "New Campaign",
          contactLists: "Contact Lists"
        },
        table: {
          name: "Name",
          whatsapp: "Connection",
          contactList: "Contact List",
          status: "Status",
          scheduledAt: "Scheduled",
          completedAt: "Completed",
          confirmation: "Confirmation",
          actions: "Actions"
        },
        dialog: {
          new: "New Campaign",
          update: "Edit Campaign",
          readonly: "Read-only",
          form: {
            name: "Name",
            message1: "Message 1",
            message2: "Message 2",
            message3: "Message 3",
            message4: "Message 4",
            message5: "Message 5",
            confirmationMessage1: "Confirmation Message 1",
            confirmationMessage2: "Confirmation Message 2",
            confirmationMessage3: "Confirmation Message 3",
            confirmationMessage4: "Confirmation Message 4",
            confirmationMessage5: "Confirmation Message 5",
            messagePlaceholder: "Message content",
            whatsapp: "Connection",
            status: "Status",
            scheduledAt: "Scheduled",
            confirmation: "Confirmation",
            contactList: "Contact List"
          },
          buttons: {
            add: "Add",
            edit: "Update",
            okadd: "Ok",
            cancel: "Cancel Dispatches",
            restart: "Restart Dispatches",
            close: "Close",
            attach: "Attach File"
          }
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone."
        },
        toasts: {
          success: "Operation completed successfully",
          cancel: "Campaign canceled",
          restart: "Campaign restarted",
          deleted: "Record deleted"
        }
      },
      announcements: {
        title: "Announcements",
        searchPlaceholder: "Search",
        buttons: {
          add: "New Announcement",
          contactLists: "Announcement Lists"
        },
        table: {
          priority: "Priority",
          title: "Title",
          text: "Text",
          mediaName: "File",
          status: "Status",
          actions: "Actions"
        },
        dialog: {
          edit: "Announcement Edit",
          add: "New Announcement",
          update: "Edit Announcement",
          readonly: "Read-only",
          form: {
            priority: "Priority",
            title: "Title",
            text: "Text",
            mediaPath: "File",
            status: "Status"
          },
          buttons: {
            add: "Add",
            edit: "Update",
            okadd: "Ok",
            cancel: "Cancel",
            close: "Close",
            attach: "Attach File"
          }
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage: "This action cannot be undone."
        },
        toasts: {
          success: "Operation completed successfully",
          deleted: "Record deleted"
        }
      },
      campaignsConfig: {
        title: "Campaign Configurations",
        intervals: "Intervals",
        messageInterval: "Message Interval (seconds)",
        longerIntervalAfter: "Longer Interval After (messages)",
        longerInterval: "Longer Interval (seconds)",
        addVariable: "Add Variable"
      },
      queues: {
        title: "Queues & Chatbot",
        dragHint:
          "Drag queues by the handle to set the order they appear in the WhatsApp main menu.",
        empty: "No queues created yet.",
        noGreeting: "No greeting message",
        optionsCountHint: "Options in the chatbot main menu",
        moveHandle: "Move queue {{name}}",
        moved: "{{name}} moved to position {{position}} of {{total}}",
        table: {
          name: "Name",
          color: "Color",
          greeting: "Greeting Message",
          actions: "Actions"
        },
        toasts: {
          deleted: "Queue removed successfully"
        },
        buttons: {
          add: "Add Queue"
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage:
            "Are you sure? This action cannot be undone! The tickets from this queue will still exist but will no longer be assigned to any queue."
        }
      },
      chatbotFlow: {
        title: "Automated journey",
        subtitle: "This is how the customer sees the menu on WhatsApp",
        activeCount: "{{active}}/{{total}} active",
        path: "Chatbot path",
        root: "Main menu",
        footer:
          "Drag by the handle to reorder. The key the customer types is always 1, 2, 3… among the active options — deactivating one renumbers the rest automatically.",
        noTitle: "Untitled",
        noMessage: "No message",
        inactive: "Inactive — not shown in the menu",
        exitsChatbot: "Ends the chatbot and calls an agent",
        forwardsTo: "Forwards to {{queue}}",
        activeKey: "The customer types {{key}}",
        answers: "{{total}} answers",
        createAnswers: "Create answers",
        moveHandle: "Move option {{title}}",
        activate: "Activate {{title}}",
        deactivate: "Deactivate {{title}}",
        moved: "{{title}} moved to position {{position}} of {{total}}",
        emptyRoot:
          "No options yet. Create the first one and it becomes item 1 of the menu.",
        emptyBranch:
          "No answers for this option yet. The customer only gets its message.",
        addOption: "Add option",
        addAnswer: "Add answer",
        toasts: {
          saved: "Option saved successfully",
          deleted: "Option removed successfully"
        },
        confirmDelete: {
          title: "Delete option",
          message:
            "Are you sure? The answers inside it will also be deleted, and the following options will be renumbered."
        },
        editor: {
          addTitle: "New option",
          editTitle: "Edit option",
          title: "Title",
          titleHelp:
            "Shown next to the number in the menu sent to the customer.",
          message: "Message",
          messageHelp:
            "Sent when the customer picks this option. Leave blank to send only the following answers.",
          attach: "Attach file",
          removeAttachment: "Remove attachment",
          exitChatbot: "End the chatbot and call an agent",
          forwardQueue: "Forward to another queue",
          noForwardQueue: "Do not forward",
          forwardQueueHelp:
            "When this option is picked, the ticket moves to the selected queue and its menu is sent.",
          delete: "Delete",
          cancel: "Cancel",
          save: "Save"
        }
      },
      queueSelect: {
        inputLabel: "Queues"
      },
      users: {
        title: "Users",
        empty: "No users found.",
        filters: {
          queue: "Queue",
          allQueues: "All queues"
        },
        profiles: {
          admin: "Admin",
          user: "User"
        },
        groups: {
          admin: "Administrators",
          user: "Users"
        },
        table: {
          name: "Name",
          email: "Email",
          profile: "Profile",
          queues: "Queues",
          noQueues: "No queues",
          actions: "Actions"
        },
        buttons: {
          add: "Add User"
        },
        toasts: {
          deleted: "User deleted successfully."
        },
        confirmationModal: {
          deleteTitle: "Delete",
          deleteMessage:
            "All user data will be lost. Open tickets from this user will be moved to the queue."
        }
      },
      helps: {
        title: "Help Center",
        empty: "No material published yet.",
        emptyGroup: "No content in this card.",
        noGroups: "No cards registered.",
        inactive: "Inactive",
        active: "Active",
        adminOnly: "Admins only",
        videos: "Videos",
        articles: "Articles",
        articleOne: "article",
        articleOther: "articles",
        videoOne: "video",
        videoOther: "videos",
        tabs: {
          contents: "Content",
          groups: "Groups"
        },
        audience: {
          company: "Customers",
          partner: "Partners"
        },
        scope: {
          platform: "Platform",
          company: "My company"
        },
        sections: {
          platform: "Platform help",
          company: "{{name}} help",
          companyFallback: "Your company"
        },
        player: {
          title: "Video"
        },
        contentType: {
          video: "Video",
          article: "Article"
        },
        buttons: {
          addGroup: "New card",
          addContent: "New content",
          cancel: "Cancel",
          save: "Save"
        },
        iconPicker: {
          title: "Choose icon",
          search: "Search icon"
        },
        groupModal: {
          addTitle: "New card",
          editTitle: "Edit card",
          title: "Title",
          subtitle: "Subtitle",
          audience: "Audience",
          isGlobal: "Publish to every company",
          isGlobalHelper:
            "Platform material: shows up in the Help Center of every company.",
          adminOnlyHelper:
            "This card and all of its content are hidden from regular users."
        },
        contentModal: {
          addTitle: "New content",
          editTitle: "Edit content",
          group: "Card",
          title: "Title",
          description: "Description",
          contentPlaceholder: "Write the article...",
          adminOnly: "Visible to administrators only",
          video: "YouTube video",
          videoHelper:
            "Paste the YouTube link or just the ID, e.g. dQw4w9WgXcQ",
          videoInvalid: "We could not find a YouTube video in this value.",
          videoPreview: "Video thumbnail preview",
          duration: "Duration",
          link: "Link",
          linkHelper: "Optional. Used when the video is not on YouTube."
        },
        confirmDeleteGroup: {
          title: "Delete card",
          message:
            "Do you really want to delete this card? All of its content will be removed."
        },
        confirmDeleteContent: {
          title: "Delete content",
          message: "Do you really want to delete this content?"
        },
        toasts: {
          saved: "Operation completed successfully!",
          deleted: "Record deleted successfully!"
        }
      },
      about: {
        aboutthe: "About the",
        copyright: "© 2024 - Powered by Espaço Whats",
        buttonclose: "Close",
        title: "About Espaço Whats",
        abouttitle: "Origin and improvements",
        aboutdetail:
          "Espaço Whats is indirectly derived from the Whaticket project with improvements shared by the developers of the EquipeChat system through the VemFazer channel on YouTube, later improved by Claudemir Todo Bom",
        aboutauthorsite: "Author's site",
        aboutwhaticketsite: "Whaticket Community site on Github",
        aboutvemfazersite: "Vem Fazer channel site on Github",
        licenseheading: "Open Source License",
        licensedetail:
          "Espaço Whats is licensed under the GNU Affero General Public License version 3, which means that any user who has access to this application has the right to obtain access to the source code. More information at the links below:",
        licensefulltext: "Full text of the license",
        licensesourcecode: "Espaço Whats source code"
      },
      schedules: {
        title: "Schedules",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Schedule?",
          deleteMessage: "This action cannot be undone."
        },
        table: {
          contact: "Contact",
          body: "Message",
          sendAt: "Scheduling Date",
          sentAt: "Sending Date",
          status: "Status",
          actions: "Actions",
          occasion: "Occasion",
          nextRun: "Next occurrence",
          audience: "Audience",
          progress: "Deliveries"
        },
        tabs: { schedules: "Schedules", dates: "Commemorative dates" },
        filters: { kind: "Type", status: "Status" },
        empty: "No schedules found.",
        emptyDeliveries: "Deliveries will appear here after the occurrence.",
        buttons: {
          add: "New Schedule"
        },
        toasts: {
          deleted: "Schedule deleted successfully."
        }
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
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Are you sure you want to delete this Tag?",
          deleteMessage: "This action cannot be undone."
        },
        table: {
          name: "Name",
          color: "Color",
          tickets: "Tickets",
          contacts: "Contacts",
          actions: "Actions",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "New Tag"
        },
        toasts: {
          deleted: "Tag deleted successfully."
        }
      },
      whitelabel: {
        primaryColorLight: "Primary color light",
        primaryColorDark: "Primary color dark",
        lightLogo: "App logo light",
        darkLogo: "App logo dark",
        favicon: "App logo favicon",
        appname: "App name",
        logoHint: "Prefer SVG and aspect of 28:10",
        faviconHint: "Prefer square SVG image or 512x512 PNG",
        loginLinks: "Login links",
        loginLinksHint:
          "Add title and URL pairs to display below the login box on desktop and mobile.",
        linkTitle: "Link title",
        linkUrl: "Link URL",
        removeLink: "Remove link",
        sidePanelImage: "Login side panel image",
        sidePanelImageHint:
          "Displayed in the login side panel on desktop screens.",
        backgroundContent: "Login background content",
        backgroundContentHint:
          "Supports images, SVG files, and MP4 videos for the login screen background.",
        linkPreview: "Link preview (sharing)",
        linkPreviewImage: "Link banner",
        linkPreviewImageHint:
          "Image shown when the system link is shared (WhatsApp, Telegram, etc.). Prefer 1200x630.",
        linkPreviewDescription: "Link description",
        linkPreviewDescriptionHint:
          "Text shown below the title in the shared link preview.",
        noFileSelected: "No file selected yet.",
        buildExtension: "Build WA Session Capture extension",
        buildingExtension: "Building extension…",
        downloadExtension: "Download extension",
        extensionHint:
          "Builds a whitelabeled Chrome extension. The downloaded ZIP already contains the extension files: extract it and load the extracted folder as an unpacked extension.",
        extensionBuildStarted:
          "Extension build started. You will be notified when it is ready.",
        extensionBuildFailed: "Could not start the extension build.",
        extensionBuilt: "Extension built successfully.",
        extensionBuildUnknownError: "Unknown build error."
      },
      settings: {
        group: {
          general: "General",
          timeouts: "Timeouts",
          officeHours: "Office Hours",
          groups: "Groups",
          confidenciality: "Confidentiality",
          api: "API",
          externalServices: "External Services",
          serveradmin: "Server Administration"
        },
        success: "Setting saved successfully.",
        copiedToClipboard: "Copied to clipboard",
        title: "Settings",
        chatbotTicketTimeout: "Chatbot ticket timeout (minutes)",
        chatbotTicketTimeoutAction: "Action after chatbot timeout",
        settings: {
          userCreation: {
            name: "User creation",
            options: {
              enabled: "Enabled",
              disabled: "Disabled"
            }
          }
        },
        validations: {
          title: "validations",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        OfficeManagement: {
          title: "Office Management",
          options: {
            disabled: "disabled",
            ManagementByDepartment: "Management By Department",
            ManagementByCompany: "Management By Company"
          }
        },
        outOfHoursAction: {
          title: "Out of Hours Action",
          options: {
            pending: "Leave as pending",
            closed: "Close ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignore Group Messages",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        soundGroupNotifications: {
          title: "Sound on Group Notifications",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        groupsTab: {
          title: "Groups Tab",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        VoiceAndVideoCalls: {
          title: "Voice and video calls",
          options: {
            enabled: "Ignore",
            disabled: "unavailability report"
          }
        },
        AutomaticChatbotOutput: {
          title: "Automatic Chatbot Output",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        ShowNumericEmoticons: {
          title: "Display numeric emojis in the queue",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        QuickMessages: {
          title: "Quick Messages",
          options: {
            enabled: "By company",
            disabled: "By User"
          }
        },
        AllowRegistration: {
          title: "Allow Registration",
          options: {
            enabled: "enabled",
            disabled: "disabled"
          }
        },
        FileUploadLimit: {
          title: "File Upload Limit (MB)"
        },
        FileDownloadLimit: {
          title: "File Download Limit (MB)"
        },
        messageVisibility: {
          title: "Message Visibility",
          options: {
            respectMessageQueue: "Respect queue of message",
            respectTicketQueue: "Respect queue of ticket"
          }
        },
        keepQueueAndUser: {
          title: "Keep queue and user on closed ticket",
          options: {
            enabled: "Enabled",
            disabled: "Disabled"
          }
        },
        GracePeriod: {
          title: "Subscription Grace Period (days)"
        },
        ticketAcceptedMessage: {
          title: "Ticket Accepted Message",
          placeholder: "Enter your ticket accepted message here"
        },
        transferMessage: {
          title: "Transfer Message",
          placeholder: "Enter your transfer message here"
        },
        mustacheVariables: {
          title: "Available variables:"
        },
        WelcomeGreeting: {
          greetings: "Hello",
          welcome: "Welcome to",
          expirationTime: "Active until"
        },
        Options: {
          title: "Options"
        },
        Companies: {
          title: "Companies"
        },
        schedules: {
          title: "schedules",
          updateToNewFormat: "Update to new format"
        },
        Plans: {
          title: "Plans",
          public: "Public",
          usersLimit: "Users limit",
          connectionsLimit: "Connections limit",
          queuesLimit: "Queues limit",
          currencyCode: "Currency code (ISO 4217)"
        },
        Help: {
          title: "Help"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Pasarelas de pago"
        },
        i18nSettings: {
          title: "Translations"
        },
        AIProvider: {
          title: "AI Provider"
        },
        AudioTranscriptions: {
          title: "Audio Transcriptions"
        },
        TagsMode: {
          title: "Tags Mode",
          options: {
            ticket: "Ticket",
            contact: "Contact",
            both: "Ticket and Contact"
          }
        }
      },
      messagesList: {
        header: {
          assignedTo: "Assigned to:",
          buttons: {
            return: "Return",
            resolve: "Resolve",
            reopen: "Reopen",
            accept: "Accept",
            call: "Call",
            endCall: "End Call"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Type a message",
        placeholderClosed: "Reopen or accept this ticket to send a message.",
        signMessage: "Sign",
        replying: "Replying",
        editing: "Editing"
      },
      message: {
        edited: "Edited",
        forwarded: "Forwarded"
      },

      contactDrawer: {
        header: "Contact Information",
        addExtraInfo: "Additional information",
        fieldAddedAt: "Added on",
        groupHeader: "Group information",
        buttons: {
          edit: "Edit Contact"
        },
        extraInfo: "Other information",
        participants: "Participants",
        participantsUnavailable: "Unable to load participants",
        you: "you",
        admin: "Admin",
        owner: "Owner"
      },
      ticketOptionsMenu: {
        schedule: "Schedule",
        delete: "Delete",
        transfer: "Transfer",
        appointmentsModal: {
          title: "Ticket Notes",
          textarea: "Note",
          placeholder: "Insert the information you want to record here"
        },
        confirmationModal: {
          title: "Delete contact ticket",
          message: "Attention! All messages related to the ticket will be lost."
        },
        buttons: {
          delete: "Delete",
          cancel: "Cancel"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancel"
        }
      },
      messageOptionsMenu: {
        delete: "Delete",
        edit: "Edit",
        forward: "Forward",
        history: "History",
        reply: "Reply",
        confirmationModal: {
          title: "Delete message?",
          message: "This action cannot be undone."
        }
      },
      messageHistoryModal: {
        close: "Close",
        title: "Message edit history"
      },
      presence: {
        unavailable: "Unavailable",
        available: "Available",
        composing: "Composing...",
        recording: "Recording...",
        paused: "Paused"
      },
      privacyModal: {
        title: "Edit Whatsapp Privacy",
        buttons: {
          cancel: "Cancel",
          okEdit: "Save"
        },
        form: {
          menu: {
            all: "All",
            none: "Nobody",
            contacts: "My contacts",
            contact_blacklist: "Selected contacts",
            match_last_seen: "Match Last Seen",
            known: "Known",
            disable: "Disabled",
            hrs24: "24 Hours",
            dias7: "7 Days",
            dias90: "90 Days"
          },
          readreceipts: "To update the Read Receipts privacy",
          profile: "To update the Profile Picture privacy",
          status: "To update the Messages privacy",
          online: "To update the Online privacy",
          last: "To update the LastSeen privacy",
          groupadd: "To update the Groups Add privacy",
          calladd: "To update the Call Add privacy",
          disappearing: "To update the Default Disappearing Mode"
        }
      },
      phoneNumberInput: {
        country: "Country",
        phoneNumber: "Phone Number",
        localNumber: "Local Number"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR: "Configuration error. Please contact support.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Clock out of sync. Please check the date and time settings of your device.",
        ERR_BACKEND_UNREACHABLE: "Backend unreachable. Please try again later.",
        ERR_BACKEND_NOT_READY:
          "Backend is starting up and not ready yet. Retrying automatically."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "No WhatsApp connection available to open the conversation.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "This lead is no longer in your base.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "This lead has no phone number to start a conversation.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "Prospecting is not configured on this server yet.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "The prospecting access key was rejected. Contact support.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "The prospecting service did not respond. Try again in a few minutes.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "The prospecting service rejected this search. Check the niche and city.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "This search no longer exists in the prospecting service.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Enter a niche and a city to search for leads.",
        ERR_FLOW_INVALID: "Invalid flow data. Review the blocks.",
        ERR_FLOW_CONNECTION:
          "This connection is not allowed. Transfer and human support blocks end the flow.",
        ERR_FLOW_QUEUE_REQUIRED:
          "Select a valid destination queue different from this one.",
        ERR_FLOW_DISCONNECTED:
          "Connect every block to the start without creating cycles.",
        ERR_FLOW_CONFLICT:
          "This flow changed in another session. Reload before publishing.",
        ERR_FLOW_IN_USE:
          "A removed block is used by an active ticket. Disable it or wait for completion before deleting.",
        ERR_INVALID_TRIAL_DAYS: "Trial days must be an integer from 0 to 3650.",
        ERR_INVALID_DUE_DAY: "Due day must be an integer from 1 to 31.",
        ERR_TRIAL_ALREADY_STARTED:
          "The free trial cannot be changed after billing starts.",
        ERR_TASK_BOARD_INVALID_TITLE: "Enter a valid title.",
        ERR_TASK_BOARD_INVALID_COLOR: "Enter a valid hexadecimal color.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Column not found.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Task not found.",
        ERR_TASK_BOARD_INVALID_DATE: "Enter a valid date.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "The date range is invalid.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "The board must have a completed tasks column.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER: "The column order is invalid.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Choose another completed column before deleting this one.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Move this column's tasks before deleting it.",
        ERR_EMAIL_NOT_FOUND: "We couldn't find this email.",
        ERR_COMPANY_SUSPENDED:
          "This account is suspended. Contact the person responsible for your subscription.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "This account already has a password. Return to login to continue.",
        ERR_ACTIVATION_INVALID:
          "This activation link is invalid or has expired.",
        ERR_PASSWORD_CONFIRMATION: "The passwords do not match.",
        ERR_PASSWORD_TOO_WEAK:
          "The password must have at least 8 characters, uppercase, lowercase, and a number.",
        ERR_HELP_INVALID_TYPE: "Invalid content type.",
        ERR_HELP_REQUIRED: "Fill in the required content fields.",
        ERR_HELP_INVALID_NAME: "Invalid content title.",
        ERR_HELP_INVALID_GROUP: "The given card does not exist.",
        ERR_HELP_GROUP_REQUIRED: "Choose a card for the content.",
        ERR_HELP_VIDEO_REQUIRED: "Provide the YouTube video or a link.",
        ERR_HELP_INVALID_VIDEO:
          "Invalid video link. Paste the YouTube address or the 11-character ID.",
        ERR_HELP_CONTENT_REQUIRED: "The article cannot be empty.",
        ERR_NO_HELP_FOUND: "Help content not found.",
        ERR_NO_HELP_GROUP_FOUND: "Help card not found.",
        ERR_HELP_REORDER_EMPTY: "No content provided to reorder.",
        ERR_HELP_REORDER_INVALID:
          "Only contents from the same card can be reordered.",
        ERR_HELP_GROUP_REORDER_EMPTY: "No cards provided to reorder.",
        ERR_HELP_GROUP_REORDER_INVALID:
          "Only cards from the same audience can be reordered.",
        ERR_HELP_GROUP_INVALID_TITLE: "Invalid card title.",
        ERR_HELP_GROUP_INVALID_AUDIENCE: "Invalid card audience.",
        ERR_UNAUTHORIZED: "You are not authorized to perform this action.",
        ERR_FORBIDDEN: "You do not have permission to access this resource.",
        ERR_CHECK_NUMBER: "Check the number and try again.",
        ERR_NO_OTHER_WHATSAPP: "There must be at least one default WhatsApp.",
        ERR_NO_DEF_WAPP_FOUND:
          "No default WhatsApp found. Check the connections page.",
        ERR_WAPP_NOT_INITIALIZED:
          "This WhatsApp session has not been initialized. Check the connections page.",
        ERR_WAPP_CHECK_CONTACT:
          "Could not check WhatsApp contact. Check the connections page.",
        ERR_WAPP_INVALID_CONTACT: "This is not a valid WhatsApp number.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Could not download media from WhatsApp. Check the connections page.",
        ERR_INVALID_CREDENTIALS: "Authentication error. Please try again.",
        ERR_SENDING_WAPP_MSG:
          "Error sending WhatsApp message. Check the connections page.",
        ERR_DELETE_WAPP_MSG: "Could not delete WhatsApp message.",
        ERR_EDITING_WAPP_MSG: "Could not edit WhatsApp message.",
        ERR_OTHER_OPEN_TICKET:
          "There is already an open ticket for this contact.",
        ERR_QUEUE_INVALID_CONNECTION:
          "One of the selected connections does not belong to this company.",
        ERR_WAPP_INVALID_QUEUE:
          "One of the selected queues does not belong to this company.",
        ERR_TICKET_INVALID_CONNECTION:
          "The selected connection is not compatible with this ticket.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "A group ticket cannot be moved to another connection.",
        ERR_INVALID_GROUP_MODE: "The selected group mode is invalid.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Select at least one allowed queue for the group.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED: "Select an allowed service queue.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "This group is in conversation mode and does not accept service actions.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED:
          "The destination connection must be connected.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Select a queue when changing the connection.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "This queue is not linked to the selected connection.",
        ERR_SESSION_EXPIRED: "Session expired. Please log in.",
        ERR_USER_CREATION_DISABLED:
          "User creation has been disabled by the administrator.",
        ERR_NO_PERMISSION:
          "You do not have permission to access this resource.",
        ERR_DUPLICATED_CONTACT: "A contact with this number already exists.",
        ERR_NO_SETTING_FOUND: "No setting found with this ID.",
        ERR_NO_CONTACT_FOUND: "No contact found with this ID.",
        ERR_NO_TICKET_FOUND: "No ticket found with this ID.",
        ERR_NO_USER_FOUND: "No user found with this ID.",
        ERR_NO_WAPP_FOUND: "No WhatsApp found with this ID.",
        ERR_CREATING_MESSAGE: "Error creating message in the database.",
        ERR_CREATING_TICKET: "Error creating ticket in the database.",
        ERR_FETCH_WAPP_MSG:
          "Error fetching message from WhatsApp, perhaps it is too old.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "This color is already in use, choose another.",
        ERR_WAPP_GREETING_REQUIRED:
          "Greeting message is mandatory when there is more than one queue.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Subscription check failed.",
        ERR_WAPP_NOT_FOUND: "Connection unavailable.",
        ERR_SUBSCRIPTION_EXPIRED: "Your subscription has expired.",
        ERR_UNKOWN: "Unknown error."
      },
      phoneCall: {
        hangup: "Hang up"
      },
      wavoipModal: {
        title: "Enter your Wavoip connection token",
        instructions:
          "By accessing the address below you can create an account with 50 free calls for testing",
        coupon: "Check the available discount terms when subscribing."
      },
      openHours: {
        title: "Business Hours",
        timezone: {
          placeholder: "Select time zone",
          searchPlaceholder: "Type to search...",
          selected: "Selected time zone"
        },
        tabs: {
          weekly: "Weekly Hours",
          overrides: "Exceptions and Holidays"
        },
        weekly: {
          title: "Weekly Business Hours",
          description:
            "Configure regular business hours for each day of the week.",
          rule: "Rule",
          days: "Days of the Week",
          hours: "Hours",
          closedMessage: "Closed (no hours defined)",
          addHour: "Add Hours",
          addRule: "Add New Weekly Rule",
          from: "From",
          to: "To",
          until: "to"
        },
        overrides: {
          title: "Exceptions and Holidays",
          description:
            "Configure specific dates with special hours or closures (holidays, events, etc.).",
          exception: "Exception",
          date: "Date",
          label: "Description",
          labelPlaceholder: "E.g.: Christmas, Carnival...",
          repeat: "Repeat",
          repeatNone: "Don't repeat",
          repeatYearly: "Yearly",
          closedDay: "Closed on this day",
          specialHours: "Special Hours",
          addHour: "Add Hours",
          addException: "Add Exception or Holiday",
          from: "From",
          to: "To",
          until: "to"
        },
        days: {
          mon: "Monday",
          tue: "Tuesday",
          wed: "Wednesday",
          thu: "Thursday",
          fri: "Friday",
          sat: "Saturday",
          sun: "Sunday"
        }
      },
      ticketz: {
        registration: {
          header: "Register in the Espaço Whats user base",
          description:
            "Fill in the fields below to register in the Espaço Whats user base and receive news about the project.",
          name: "Name",
          country: "Country",
          phoneNumber: "Whatsapp Number",
          submit: "Register"
        },
        proAd: {
          imageAlt: "Espaço Whats PRO screenshot",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "Official WhatsApp - Instagram - Messenger and more",
            exclusiveFeatures: "Exclusive features",
            advancedSupport: "Advanced support",
            easyMigration: "Easy migration"
          },
          subscribePrice: "Subscribe for {{monthlyPrice}}/month",
          subscribeSubtitle: "directly inside the system",
          ctaUpgrade: "Click for upgrade instructions",
          ctaVisitSite: "Click to visit the website!",
          instructions: {
            title: "Upgrade Instructions",
            stepIntro:
              "If you installed the images provided by the project on a server or VPS using the simplified instructions, all you need to do is access your server and run the command below:",
            stepInstall:
              'In a few moments Espaço Whats PRO will be installed with all your data; then go to the user menu, click "Espaço Whats PRO Subscription", and complete your subscription.',
            helpPrefix:
              "If your installation is different or you believe you need help installing Espaço Whats PRO, ",
            helpLink: "contact us",
            helpSuffix: " and we will help you!"
          }
        },
        support: {
          title: "Support Espaço Whats project",
          mercadopagotitle: "Credit Card",
          recurringbrl: "Recurring donations in BRL",
          paypaltitle: "Credit Card",
          international: "Donations in USD"
        }
      }
    }
  }
};

export { messages };
