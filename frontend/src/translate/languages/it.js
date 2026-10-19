const messages = {
  it: {
    translations: {
      visual: {
        visualizar: "Visualizza",
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
          "Fine del flusso. La conversazione passa al team di assistenza.",
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
        settingsTab: "Chiamate sperimentali",
        companySwitch: "Chiamate sperimentali",
        enabled: "Attivate",
        disabled: "Disattivate",
        experimentalTitle: "Integrazione sperimentale delle chiamate",
        warning:
          "Integrazione WhatsApp non ufficiale. Esiste il rischio di disconnessione, sospensione o blocco. Usala solo nel tenant di test.",
        serviceUnavailable:
          "Il servizio chiamate non è al momento disponibile.",
        riskConsent:
          "Comprendo il rischio e voglio collegare un secondo dispositivo tramite codice QR.",
        status: "Stato",
        disconnect: "Disattiva e scollega",
        pair: "Collega con codice QR",
        noConnections:
          "Crea prima una connessione WhatsApp per configurare le chiamate.",
        qrInstruction:
          "In WhatsApp, apri Dispositivi collegati e scansiona questo secondo codice QR.",
        disconnectedSuccess: "Integrazione chiamate scollegata.",
        incoming: "Chiamata in arrivo",
        incomingHint: "Il primo operatore che accetta prenderà la chiamata.",
        reject: "Rifiuta",
        accept: "Rispondi",
        active: "Chiamata in corso",
        mute: "Disattiva microfono",
        transcribe: "Trascrivi chiamata",
        record: "Registra chiamata",
        end: "Termina",
        states: {
          disconnected: "Disconnessa",
          pairing: "In attesa del codice QR",
          connecting: "Connessione",
          open: "Connessa",
          logged_out: "Scollegata"
        },
        errors: {
          load: "Impossibile caricare le chiamate sperimentali.",
          pair: "Impossibile generare il codice QR delle chiamate.",
          action: "Impossibile completare l'azione di chiamata.",
          transcriptionConfig:
            "Imposta GROQ_API_KEY nell'ambiente per abilitare la trascrizione.",
          microphone: "Il microfono è stato negato. La chiamata è terminata."
        }
      },
      common: {
        search: "Cerca",
        edit: "Modifica",
        delete: "Elimina",
        cancel: "Annulla",
        save: "Salva",
        you: "Tu",
        confirm: "Conferma",
        close: "Chiudi",
        error: "Errore",
        success: "Successo",
        actions: "Azioni",
        add: "Aggiungi",
        name: "Nome",
        email: "Email",
        phone: "Telefono",
        company: "Azienda",
        user: "Utente",
        connection: "Connessione",
        queue: "Coda",
        contact: "Contatto",
        serverTime: "Ora del server:",
        clientTime: "Ora del client:",
        differenceMinutes: "Differenza: {{count}} minuto(i)"
      },
      signup: {
        title: "Registrati",
        toasts: {
          success: "Utente creato con successo! Effettua il login!!!",
          fail: "Errore nella creazione dell'utente. Verifica i dati inseriti."
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Password"
        },
        buttons: {
          submit: "Registrati",
          login: "Hai già un account? Accedi!"
        }
      },
      login: {
        title: "Accesso",
        form: {
          email: "Email",
          password: "Password",
          newPassword: "Nuova password",
          confirmPassword: "Conferma password",
          passwordStrength:
            "Usa almeno 8 caratteri con maiuscola, minuscola e un numero."
        },
        buttons: {
          submit: "Accedi",
          continue: "Continua",
          createPassword: "Crea password e accedi",
          changeEmail: "Cambia email",
          backToLogin: "Torna all'accesso",
          register: "Non hai un account? Registrati!"
        },
        errors: {
          emailNotFound: "Non abbiamo trovato questa email.",
          passwordMismatch: "Le password non coincidono.",
          passwordStrength:
            "La password deve avere almeno 8 caratteri, maiuscola, minuscola e un numero.",
          activationInvalid:
            "Questo link di attivazione non è valido o è scaduto."
        },
        activation: {
          title: "Crea la tua password",
          account: "Attivazione dell'account {{email}}"
        }
      },
      companies: {
        title: "Registra Azienda",
        form: {
          name: "Nome dell'Azienda",
          plan: "Piano",
          token: "Token",
          submit: "Registrati",
          success: "Azienda creata con successo!"
        }
      },
      auth: {
        toasts: {
          success: "Accesso effettuato con successo!"
        },
        token: "Token"
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Interazioni di oggi: "
          }
        },
        blog: {
          title: "Il blog di Espaço Whats",
          loading: "Caricamento articoli...",
          error: "Impossibile caricare gli articoli del blog.",
          empty: "Nessun articolo trovato.",
          showAll: "Mostra tutti gli articoli",
          showLess: "Mostra meno",
          openPost: "Leggi articolo",
          previous: "Articolo precedente",
          next: "Articolo successivo"
        }
      },
      connections: {
        title: "Connessioni",
        toasts: {
          deleted: "Connessione con WhatsApp eliminata con successo!"
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Sei sicuro? Questa azione non può essere annullata.",
          disconnectTitle: "Disconnetti",
          disconnectMessage:
            "Sei sicuro? Dovrai scansionare nuovamente il QR Code."
        },
        buttons: {
          add: "Aggiungi WhatsApp",
          disconnect: "Disconnetti",
          tryAgain: "Riprova",
          qrcode: "QR CODE",
          newQr: "Nuovo QR CODE",
          connecting: "Connessione in corso"
        },
        toolTips: {
          disconnected: {
            title: "Errore nell'avvio della sessione di WhatsApp",
            content:
              "Assicurati che il tuo telefono sia connesso a Internet e riprova, oppure richiedi un nuovo QR Code"
          },
          qrcode: {
            title: "In attesa della scansione del QR Code",
            content:
              "Clicca sul pulsante 'QR CODE' e scansiona il QR Code con il tuo telefono per avviare la sessione"
          },
          connected: {
            title: "Connessione stabilita!"
          },
          timeout: {
            title: "Connessione con il telefono persa",
            content:
              "Assicurati che il tuo telefono sia connesso a Internet e che WhatsApp sia aperto, oppure clicca sul pulsante 'Disconnetti' per ottenere un nuovo QR Code"
          },
          passkey: {
            title: "Passkey authentication required",
            content:
              "Click the passkey button and use the browser extension to capture the authenticated WhatsApp Web session."
          },
          resetPasskey: "Reimposta sessione passkey"
        },
        table: {
          contact: "Contatto",
          name: "Nome",
          status: "Stato",
          lastUpdate: "Ultimo aggiornamento",
          default: "Predefinito",
          actions: "Azioni",
          session: "Sessione"
        }
      },
      internalChat: {
        title: "Chat Interno"
      },
      whatsappGroups: {
        configure: "Configura gruppo",
        mode: "Modalità gruppo",
        conversation: "Conversazione",
        attendance: "Assistenza",
        allowedQueues: "Code autorizzate",
        serviceQueue: "Coda di assistenza",
        cancel: "Annulla",
        save: "Salva",
        confirmConversation:
          "Rimuovere questo gruppo dal flusso di assistenza? L'assistenza attiva terminerà senza valutazione."
      },
      whatsappModal: {
        title: {
          add: "Aggiungi WhatsApp",
          edit: "Modifica WhatsApp"
        },
        form: {
          name: "Nome",
          default: "Predefinito"
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla"
        },
        success: "WhatsApp salvato con successo."
      },
      qrCode: {
        message: "Scansiona il QR Code per avviare la sessione",
        extensionHint: "Autenticati tramite WhatsApp Web",
        startCapture: "Cattura sessione WhatsApp Web",
        installExtension: "Installa estensione di cattura"
      },
      passkeyModal: {
        title: "Estensione di cattura WhatsApp Web",
        instructions:
          "Use the browser extension to capture the authenticated WhatsApp Web session and send it to the server.",
        connectorNotFound:
          "Extension not detected. Install the passkey capture extension and reload the page.",
        connectorReady:
          "Estensione rilevata. Clicca qui sotto per autenticarti tramite WhatsApp Web.",
        startCapture: "Start Capture",
        waitingForCapture: "Waiting for WhatsApp Web session capture…",
        existingSession: "WhatsApp Web already has a session for {{number}}.",
        captureExisting: "Capture this session",
        clearAndContinue: "Clear local session and continue",
        importSent: "Session captured and sent successfully.",
        importError: "Capture failed: {{reason}}.",
        missingToken: "Capture token is missing. Please reload the page.",
        downloadExtension: "Scarica l'estensione di cattura",
        installInstructions: "Come installare",
        hideInstructions: "Nascondi istruzioni",
        instructionsIntro:
          "Segui i passaggi seguenti per installare l'estensione:",
        installStep1: "Scarica il file ZIP dell'estensione.",
        installStep2: "Estrai il file ZIP in una cartella del tuo computer.",
        installStep3: "Apri Google Chrome e vai a chrome://extensions/.",
        installStep4:
          "Attiva la Modalità sviluppatore con l'interruttore in alto a destra.",
        installStep5: 'Clicca su "Carica estensione non pacchettizzata".',
        installStep6:
          "Seleziona la cartella estratta che contiene i file dell'estensione.",
        installStep7: "L'estensione è installata e pronta all'uso.",
        installStep8:
          "Aggiorna questa pagina con F5 e prova a connetterti di nuovo."
      },
      contacts: {
        title: "Contatti",
        toasts: {
          deleted: "Contatto eliminato con successo!"
        },
        searchPlaceholder: "Cerca...",
        confirmationModal: {
          deleteTitle: "Elimina",
          importTitlte: "Importa contatti",
          deleteMessage:
            "Sei sicuro di voler eliminare questo contatto? Tutte le interazioni correlate saranno perse.",
          importMessage: "Vuoi importare tutti i contatti dal telefono?"
        },
        buttons: {
          import: "Importa Contatti",
          add: "Aggiungi Contatto"
        },
        table: {
          name: "Nome",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Azioni"
        }
      },
      contactModal: {
        title: {
          add: "Aggiungi contatto",
          edit: "Modifica contatto"
        },
        form: {
          mainInfo: "Dati del contatto",
          extraInfo: "Informazioni aggiuntive",
          name: "Nome",
          number: "Numero di WhatsApp",
          email: "Email",
          extraName: "Nome del campo",
          extraValue: "Valore",
          disableBot: "Disabilita chatbot"
        },
        buttons: {
          addExtraInfo: "Aggiungi informazione",
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla"
        },
        success: "Contatto salvato con successo."
      },
      queueModal: {
        title: {
          add: "Aggiungi coda",
          edit: "Modifica coda"
        },
        form: {
          name: "Nome",
          color: "Colore",
          greetingMessage: "Messaggio di benvenuto",
          complationMessage: "Messaggio di completamento",
          outOfHoursMessage: "Messaggio fuori orario",
          ratingMessage: "Messaggio di valutazione",
          transferMessage: "Messaggio di trasferimento",
          connections: "Connessioni WhatsApp",
          connectionsHelp:
            "La coda e il chatbot saranno disponibili solo su queste connessioni.",
          token: "Token"
        },
        validation: {
          connectionRequired: "Seleziona almeno una connessione per la coda."
        },
        toasts: {
          saved: "Coda salvata con successo"
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
          attach: "Allega File"
        },
        serviceHours: {
          dayWeek: "Giorno della settimana",
          startTimeA: "Ora Iniziale - Turno A",
          endTimeA: "Ora Finale - Turno A",
          startTimeB: "Ora Iniziale - Turno B",
          endTimeB: "Ora Finale - Turno B",
          monday: "Lunedì",
          tuesday: "Martedì",
          wednesday: "Mercoledì",
          thursday: "Giovedì",
          friday: "Venerdì",
          saturday: "Sabato",
          sunday: "Domenica"
        }
      },
      userModal: {
        title: {
          add: "Aggiungi utente",
          edit: "Modifica utente"
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Password",
          profile: "Profilo"
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla"
        },
        success: "Utente salvato con successo."
      },
      scheduleModal: {
        title: {
          add: "Nuova Pianificazione",
          edit: "Modifica Pianificazione"
        },
        form: {
          body: "Messaggio",
          contact: "Contatto",
          sendAt: "Data di Pianificazione",
          sentAt: "Data di Invio",
          saveMessage: "Salva Messaggio nel Ticket"
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla"
        },
        success: "Pianificazione salvata con successo."
      },
      tagModal: {
        title: {
          add: "Nuova Tag",
          edit: "Modifica Tag",
          addKanban: "Nuova Lane",
          editKanban: "Modifica Lane"
        },
        form: {
          name: "Nome",
          color: "Colore",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla"
        },
        success: "Tag salvata con successo.",
        successKanban: "Lane salvata con successo."
      },
      chat: {
        noTicketMessage: "Seleziona un ticket per iniziare a conversare."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "TRASCINA E RILASCIA I FILE NEL CAMPO SOTTO",
          titleFileList: "Lista dei file"
        }
      },
      billing: {
        trialDays: "Giorni di prova gratuita",
        trialDaysHelp: "0 significa nessuna prova gratuita",
        dueDay: "Giorno di scadenza",
        dueDayHelp: "Mensile; i mesi brevi usano l’ultimo giorno",
        prorata: "Pro rata",
        trialEndsIn: "La prova termina tra {{days}} giorni.",
        noActiveTrial: "Nessuna prova attiva",
        period: "Periodo: {{start}} - {{end}}"
      },
      todolist: {
        title: "Bacheca attività",
        loading: "Caricamento bacheca...",
        loadError: "Impossibile caricare la bacheca.",
        emptyColumn: "Trascina un’attività in questa colonna",
        dragTask: "Sposta attività",
        dragTaskLabel: "Sposta attività {{title}}",
        completedAt: "Completata il {{date}}",
        editTaskTitle: "Modifica attività",
        newTaskTitle: "Nuova attività",
        targets: { global: "Globale", user: "Utente", queue: "Coda" },
        deadline: {
          ok: "In tempo",
          warning: "Scadenza vicina",
          overdue: "In ritardo"
        },
        details: {
          noDescription: "Nessuna descrizione",
          state: "Stato",
          createdBy: "Creata da",
          target: "Destinazione",
          createdAt: "Creata",
          dueAt: "Scadenza",
          completedAt: "Completata",
          history: "Cronologia"
        },
        events: {
          CREATED: "Creata",
          EDITED: "Modificata",
          MOVED: "Spostata",
          COMPLETED: "Completata",
          REOPENED: "Riaperta"
        },
        form: {
          name: "Nome attività",
          columnName: "Nome colonna",
          description: "Descrizione",
          targetType: "Destinazione",
          assignee: "Utente assegnato",
          queue: "Coda assegnata",
          dueAt: "Scadenza"
        },
        buttons: {
          add: "Aggiungi",
          newTask: "Nuova attività",
          save: "Salva",
          configure: "Configura colonne",
          clearFilter: "Cancella filtro",
          tryAgain: "Riprova",
          editTask: "Modifica attività",
          deleteTask: "Elimina attività",
          addColumn: "Aggiungi colonna"
        },
        filters: {
          from: "Completate da",
          to: "Completate fino a",
          invalidDate: "Data non valida"
        },
        settings: {
          title: "Configura colonne",
          description:
            "Personalizza ordine, nomi e colori. Una sola colonna rappresenta le attività completate.",
          markDone: "Contrassegna {{title}} come colonna completata",
          doneColumn: "Colonna attività completate",
          regularColumn: "Colonna attività in corso",
          moveLeft: "Sposta a sinistra",
          moveRight: "Sposta a destra",
          editColumn: "Modifica colonna",
          newColumn: "Nuova colonna",
          chooseColor: "Scegli colore",
          useBrandColor: "Usa colore aziendale"
        },
        confirm: {
          deleteTaskTitle: "Elimina attività",
          deleteTask: "Eliminare l’attività “{{title}}”?",
          deleteColumnTitle: "Elimina colonna",
          deleteColumn: "Eliminare la colonna “{{title}}”?"
        },
        toasts: {
          taskCreated: "Attività creata.",
          taskSaved: "Attività aggiornata.",
          taskDeleted: "Attività eliminata.",
          columnSaved: "Colonna salvata.",
          columnDeleted: "Colonna eliminata.",
          doneColumnChanged: "Colonna completata aggiornata."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuovo"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Code"
      },
      tickets: {
        toasts: {
          deleted: "Il ticket che stavi gestendo è stato eliminato."
        },
        notification: {
          message: "Messaggio da",
          nomessages: "Nessun messaggio"
        },
        tabs: {
          open: { title: "Aperti" },
          closed: { title: "Risolti" },
          groups: {
            title: "Gruppi",
            conversations: "Conversazioni",
            attendances: "Assistenze",
            pending: "In attesa",
            open: "In assistenza",
            closed: "Concluse"
          },
          search: { title: "Cerca" }
        },
        search: {
          placeholder: "Cerca ticket e messaggi"
        },
        buttons: {
          showAll: "Tutti"
        }
      },
      transferTicketModal: {
        title: "Trasferisci Ticket",
        fieldLabel: "Digita per cercare utenti",
        fieldConnectionLabel: "Trasferisci tramite connessione",
        fieldConnectionPlaceholder: "Seleziona una connessione",
        connectionHelp:
          "Dopo aver scelto la connessione, seleziona una coda disponibile.",
        connectionUnavailable: "disconnessa",
        fieldQueueLabel: "Trasferisci alla coda",
        fieldQueuePlaceholder: "Seleziona una coda",
        noOptions: "Nessun utente trovato con questo nome",
        buttons: {
          ok: "Trasferisci",
          cancel: "Annulla"
        }
      },
      ticketsList: {
        pendingHeader: "In attesa",
        assignedHeader: "In gestione",
        noTicketsTitle: "Niente qui!",
        noTicketsMessage:
          "Nessun ticket trovato con questo stato o termine di ricerca",
        buttons: {
          accept: "Accetta"
        }
      },
      newTicketModal: {
        title: "Crea Ticket",
        fieldLabel: "Digita per cercare il contatto",
        add: "Aggiungi",
        buttons: {
          ok: "Salva",
          cancel: "Annulla"
        }
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Connessioni",
          tickets: "Interazioni",
          quickMessages: "Risposte Rapide",
          contacts: "Contatti",
          queues: "Code & Chatbot",
          tags: "Tag",
          administration: "Amministrazione",
          service: "Servizio",
          users: "Utenti",
          settings: "Impostazioni",
          helps: "Aiuto",
          chatgpt: "ChatGPT",
          schedules: "Pianificazioni",
          campaigns: "Campagne",
          annoucements: "Informazioni",
          chats: "Chat Interna",
          financeiro: "Finanziario",
          cobranca: "Billing",
          prospeccao: "Prospezione",
          logout: "Esci",
          management: "Gestione",
          kanban: "Kanban",
          tasks: "Compiti"
        },
        appBar: {
          i18n: {
            language: "Italiano",
            language_short: "IT"
          },
          user: {
            profile: "Profilo",
            subscriptionValidUntilLabel: "Abbonamento valido fino al",
            darkmode: "Modalità scura",
            lightmode: "Modalità chiara",
            language: "Seleziona lingua",
            about: "Informazioni",
            logout: "Esci"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Pilota abilitato",
        disabled: "Pilota disabilitato",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Consigliato",
          description:
            "Il modo più semplice per usare i dati del servizio clienti in ChatGPT.",
          details:
            "Installa il plugin, collega il tuo account Espaço Whats con OAuth e usalo dal menu dei plugin o menzionando @EspaçoWhats.",
          open: "Apri il plugin in ChatGPT",
          steps: {
            title: "Come installare e collegare",
            open: "Apri il plugin Espaço Whats in ChatGPT",
            install: "Fai clic su Installa plugin",
            connect: "Seleziona Collega",
            login: "Accedi con tenant, e-mail e password amministratore",
            use: "Usa il menu dei plugin o menziona @EspaçoWhats"
          },
          marketplace: {
            title: "Installazione GitHub per i workspace",
            description:
              "Un amministratore può anche importare il marketplace ufficiale da Impostazioni workspace → Plugin → Aggiungi → Importa marketplace.",
            repository: "Repository",
            path: "Percorso",
            pathValue: "Lascia vuoto",
            branch: "Branch",
            copy: "Copia repository"
          }
        },
        warningTitle: "Dati personali e clinici",
        warning:
          "Dopo la connessione, conversazioni identificabili e possibili dati clinici potranno essere inviati a ChatGPT in base alle domande. Usare solo dopo l'approvazione legale e amministrativa.",
        copy: "Copia URL",
        connection: {
          title: "URL server MCP",
          description:
            "Espaço Whats non usa una chiave OpenAI. Intelligenza e limiti appartengono al piano ChatGPT dell'utente."
        },
        steps: {
          title: "Come connettersi",
          open: "Apri Developer Mode di ChatGPT",
          create: "Crea un'integrazione MCP Draft",
          url: "Incolla l'URL MCP",
          oauth: "Scegli OAuth",
          login: "Accedi con tenant, e-mail e password amministratore"
        },
        connections: {
          title: "Connessioni attive",
          empty: "Nessuna connessione ChatGPT.",
          client: "Client",
          admin: "Amministratore",
          created: "Creata",
          lastUse: "Ultimo utilizzo",
          revoke: "Revoca",
          revokeAll: "Revoca tutte"
        },
        revoke: {
          title: "Revoca connessione",
          one: "Questa connessione perderà immediatamente l'accesso.",
          all: "Tutte le connessioni del tenant perderanno immediatamente l'accesso."
        },
        toasts: {
          copied: "URL MCP copiato.",
          repositoryCopied: "Repository del plugin copiato.",
          revoked: "Connessione revocata."
        }
      },
      notifications: {
        noTickets: "Nessuna notifica."
      },
      quickMessages: {
        title: "Risposte Rapide",
        buttons: {
          add: "Nuova Risposta"
        },
        dialog: {
          shortcode: "Scorciatoia",
          message: "Risposta"
        }
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Cerca",
        subMenus: {
          list: "Pannello",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Aperto",
        confirmationModal: {
          deleteTitle: "Sei sicuro di voler eliminare questa Lane?",
          deleteMessage: "Questa azione non può essere annullata."
        },
        table: {
          name: "Nome",
          color: "Colore",
          tickets: "Tickets",
          actions: "Azioni"
        },
        buttons: {
          add: "Nuova Lane"
        },
        toasts: {
          deleted: "Lane eliminata con successo."
        }
      },
      contactLists: {
        title: "Liste di Contatti",
        table: {
          name: "Nome",
          contacts: "Contatti",
          actions: "Azioni"
        },
        buttons: {
          add: "Nuova Lista"
        },
        dialog: {
          name: "Nome",
          company: "Azienda",
          okEdit: "Modifica",
          okAdd: "Aggiungi",
          add: "Aggiungi",
          edit: "Modifica",
          cancel: "Annulla"
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata."
        },
        toasts: {
          deleted: "Registro eliminato",
          created: "Registro creato"
        }
      },
      contactListItems: {
        title: "Contatti",
        searchPlaceholder: "Cerca",
        buttons: {
          add: "Nuovo",
          lists: "Liste",
          import: "Importa"
        },
        dialog: {
          name: "Nome",
          number: "Numero",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Modifica",
          okAdd: "Aggiungi",
          add: "Aggiungi",
          edit: "Modifica",
          cancel: "Annulla"
        },
        table: {
          name: "Nome",
          number: "Numero",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Azioni"
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata.",
          importMessage: "Vuoi importare i contatti da questo foglio?",
          importTitlte: "Importa"
        },
        toasts: {
          deleted: "Registro eliminato"
        }
      },
      campaigns: {
        title: "Campagne",
        searchPlaceholder: "Cerca",
        buttons: {
          add: "Nuova Campagna",
          contactLists: "Liste di Contatti"
        },
        table: {
          name: "Nome",
          whatsapp: "Connessione",
          contactList: "Lista di Contatti",
          status: "Stato",
          scheduledAt: "Pianificazione",
          completedAt: "Completata",
          confirmation: "Conferma",
          actions: "Azioni"
        },
        dialog: {
          new: "Nuova Campagna",
          update: "Modifica Campagna",
          readonly: "Solo Visualizzazione",
          form: {
            name: "Nome",
            message1: "Messaggio 1",
            message2: "Messaggio 2",
            message3: "Messaggio 3",
            message4: "Messaggio 4",
            message5: "Messaggio 5",
            confirmationMessage1: "Messaggio di Conferma 1",
            confirmationMessage2: "Messaggio di Conferma 2",
            confirmationMessage3: "Messaggio di Conferma 3",
            confirmationMessage4: "Messaggio di Conferma 4",
            confirmationMessage5: "Messaggio di Conferma 5",
            messagePlaceholder: "Contenuto del messaggio",
            whatsapp: "Connessione",
            status: "Stato",
            scheduledAt: "Pianificazione",
            confirmation: "Conferma",
            contactList: "Lista di Contatti"
          },
          buttons: {
            add: "Aggiungi",
            edit: "Aggiorna",
            okadd: "Ok",
            cancel: "Annulla Invii",
            restart: "Riavvia Invii",
            close: "Chiudi",
            attach: "Allega File"
          }
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata."
        },
        toasts: {
          success: "Operazione completata con successo",
          cancel: "Campagna annullata",
          restart: "Campagna riavviata",
          deleted: "Registro eliminato"
        }
      },
      announcements: {
        title: "Informazioni",
        searchPlaceholder: "Cerca",
        buttons: {
          add: "Nuova Informazione",
          contactLists: "Liste di Informazioni"
        },
        table: {
          priority: "Priorità",
          title: "Titolo",
          text: "Testo",
          mediaName: "File",
          status: "Stato",
          actions: "Azioni"
        },
        dialog: {
          edit: "Modifica Informazione",
          add: "Nuova Informazione",
          update: "Modifica Informazione",
          readonly: "Solo Visualizzazione",
          form: {
            priority: "Priorità",
            title: "Titolo",
            text: "Testo",
            mediaPath: "File",
            status: "Stato"
          },
          buttons: {
            add: "Aggiungi",
            edit: "Aggiorna",
            okadd: "Ok",
            cancel: "Annulla",
            close: "Chiudi",
            attach: "Allega File"
          }
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata."
        },
        toasts: {
          success: "Operazione completata con successo",
          deleted: "Registro eliminato"
        }
      },
      campaignsConfig: {
        title: "Configurazioni Campagne"
      },
      queues: {
        title: "Code & Chatbot",
        table: {
          name: "Nome",
          color: "Colore",
          greeting: "Messaggio di benvenuto",
          actions: "Azioni"
        },
        toasts: {
          deleted: "Coda rimossa con successo"
        },
        buttons: {
          add: "Aggiungi coda"
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage:
            "Sei sicuro? Questa azione non può essere annullata! Le interazioni di questa coda continueranno ad esistere, ma non avranno più nessuna coda assegnata."
        }
      },
      queueSelect: {
        inputLabel: "Code"
      },
      users: {
        title: "Utenti",
        empty: "Nessun utente trovato.",
        filters: {
          queue: "Coda",
          allQueues: "Tutte le code"
        },
        profiles: {
          admin: "Amministratore",
          user: "Utente"
        },
        groups: {
          admin: "Amministratori",
          user: "Utenti"
        },
        table: {
          name: "Nome",
          email: "Email",
          profile: "Profilo",
          queues: "Code",
          noQueues: "Nessuna coda",
          actions: "Azioni"
        },
        buttons: {
          add: "Aggiungi utente"
        },
        toasts: {
          deleted: "Utente eliminato con successo."
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage:
            "Tutti i dati dell'utente saranno persi. Le interazioni aperte di questo utente saranno spostate nella coda."
        }
      },
      helps: {
        title: "Centro di Aiuto",
        adminOnly: "Solo amministratori",
        groupModal: {
          adminOnlyHelper:
            "Questa scheda e tutti i contenuti sono nascosti agli utenti comuni."
        },
        contentModal: {
          adminOnly: "Visibile solo agli amministratori"
        }
      },
      about: {
        aboutthe: "Informazioni su",
        copyright: "© 2024 - Funzionante con Espaço Whats",
        buttonclose: "Chiudi",
        title: "Informazioni su Espaço Whats",
        abouttitle: "Origine e miglioramenti",
        aboutdetail:
          "Il Espaço Whats è derivato indirettamente dal progetto Whaticket con miglioramenti condivisi dagli sviluppatori del sistema EquipeChat attraverso il canale VemFazer su YouTube, successivamente migliorati da Claudemir Todo Bom",
        aboutauthorsite: "Sito dell'autore",
        aboutwhaticketsite: "Sito della comunità Whaticket su Github",
        aboutvemfazersite: "Sito del canale Vem Fazer su Github",
        licenseheading: "Licenza Open Source",
        licensedetail:
          "Il Espaço Whats è concesso in licenza sotto la GNU Affero General Public License versione 3, il che significa che qualsiasi utente che ha accesso a questa applicazione ha il diritto di ottenere l'accesso al codice sorgente. Maggiori informazioni nei link sottostanti:",
        licensefulltext: "Testo completo della licenza",
        licensesourcecode: "Codice sorgente di Espaço Whats"
      },
      schedules: {
        title: "Pianificazioni",
        confirmationModal: {
          deleteTitle: "Sei sicuro di voler eliminare questa Pianificazione?",
          deleteMessage: "Questa azione non può essere annullata."
        },
        table: {
          contact: "Contatto",
          body: "Messaggio",
          sendAt: "Data di Pianificazione",
          sentAt: "Data di Invio",
          status: "Stato",
          actions: "Azioni"
        },
        buttons: {
          add: "Nuova Pianificazione"
        },
        toasts: {
          deleted: "Pianificazione eliminata con successo."
        }
      },
      tags: {
        title: "Tag",
        confirmationModal: {
          deleteTitle: "Sei sicuro di voler eliminare questa Tag?",
          deleteMessage: "Questa azione non può essere annullata."
        },
        table: {
          name: "Nome",
          color: "Colore",
          tickets: "Registrazioni",
          actions: "Azioni",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nuova Tag"
        },
        toasts: {
          deleted: "Tag eliminata con successo."
        }
      },
      whitelabel: {
        primaryColorLight: "Colore primario chiaro",
        primaryColorDark: "Colore primario scuro",
        lightLogo: "Logo app chiaro",
        darkLogo: "Logo app scuro",
        favicon: "Favicon dell'app",
        appname: "Nome app",
        logoHint: "Preferisci SVG e proporzioni 28:10",
        faviconHint: "Preferisci un'immagine SVG quadrata o PNG 512x512",
        loginLinks: "Link di login",
        loginLinksHint:
          "Aggiungi coppie titolo e URL da mostrare sotto il box di login su desktop e mobile.",
        linkTitle: "Titolo del link",
        linkUrl: "URL del link",
        removeLink: "Rimuovi link",
        sidePanelImage: "Immagine laterale del login",
        sidePanelImageHint:
          "Mostrata nel pannello laterale del login sugli schermi desktop.",
        backgroundContent: "Contenuto di sfondo del login",
        backgroundContentHint:
          "Supporta immagini, file SVG e video MP4 per lo sfondo della schermata di login.",
        noFileSelected: "Nessun file selezionato.",
        buildExtension: "Crea estensione WA Session Capture",
        buildingExtension: "Creazione estensione in corso…",
        downloadExtension: "Scarica estensione",
        extensionHint:
          "Crea un'estensione Chrome whitelabel. Il ZIP scaricato contiene già i file dell'estensione: estrailo e carica la cartella estratta come estensione non pacchettizzata.",
        extensionBuildStarted:
          "Creazione dell'estensione avviata. Riceverai una notifica quando sarà pronta.",
        extensionBuildFailed:
          "Impossibile avviare la creazione dell'estensione.",
        extensionBuilt: "Estensione creata con successo.",
        extensionBuildUnknownError: "Errore di creazione sconosciuto."
      },
      settings: {
        group: {
          general: "Generale",
          timeouts: "Tempi di attesa",
          officeHours: "Orario di lavoro",
          groups: "Gruppi",
          confidenciality: "Riservatezza",
          api: "API",
          serveradmin: "Amministrazione del server"
        },
        success: "Impostazioni salvate con successo.",
        title: "Impostazioni",
        settings: {
          userCreation: {
            name: "Creazione utente",
            options: {
              enabled: "Attivato",
              disabled: "Disattivato"
            }
          }
        },
        validations: {
          title: "Valutazioni",
          options: {
            enabled: "Abilitato",
            disabled: "Disabilitato"
          }
        },
        OfficeManagement: {
          title: "Gestione dell'orario di lavoro",
          options: {
            disabled: "Disabilitato",
            ManagementByDepartment: "Gestione per coda",
            ManagementByCompany: "Gestione per azienda"
          }
        },
        outOfHoursAction: {
          title: "Azione fuori orario",
          options: {
            pending: "Lascia come pendente",
            closed: "Chiudi ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignora messaggi di gruppo",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        soundGroupNotifications: {
          title: "Notifiche sonore di gruppo",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        groupsTab: {
          title: "Scheda Gruppi",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        VoiceAndVideoCalls: {
          title: "Chiamate vocali e video",
          options: {
            enabled: "Ignora",
            disabled: "informa indisponibilità"
          }
        },
        AutomaticChatbotOutput: {
          title: "Uscita automatica del chatbot",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        ShowNumericEmoticons: {
          title: "Visualizza emoji numerici nella coda",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        QuickMessages: {
          title: "Messaggi Rapidi",
          options: {
            enabled: "Per azienda",
            disabled: "Per utente"
          }
        },
        AllowRegistration: {
          title: "Permetti registrazione",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        FileDownloadLimit: {
          title: "Limite di download dei file (MB)"
        },
        messageVisibility: {
          title: "Visibilità del messaggio",
          options: {
            respectMessageQueue: "Rispetta coda del messaggio",
            respectTicketQueue: "Rispetta coda del ticket"
          }
        },
        keepQueueAndUser: {
          title: "Mantieni coda e utente nel ticket chiuso",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato"
          }
        },
        WelcomeGreeting: {
          greetings: "Ciao",
          welcome: "Benvenuto a",
          expirationTime: "Attivo fino a"
        },
        Options: {
          title: "Opzioni"
        },
        Companies: {
          title: "Aziende"
        },
        schedules: {
          title: "Orari"
        },
        Plans: {
          title: "Piani"
        },
        Help: {
          title: "Aiuto"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Gateway di pagamento"
        },
        i18nSettings: {
          title: "Traduzioni"
        }
      },
      messagesList: {
        header: {
          assignedTo: "Assegnato a:",
          buttons: {
            return: "Ritorna",
            resolve: "Risolvi",
            reopen: "Riapri",
            accept: "Accetta"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Digita un messaggio",
        placeholderClosed:
          "Riapri o accetta questo ticket per inviare un messaggio.",
        signMessage: "Firma",
        replying: "Rispondendo",
        editing: "Modificando"
      },
      message: {
        edited: "Modificata"
      },
      contactDrawer: {
        header: "Dati del contatto",
        groupHeader: "Informazioni sul gruppo",
        buttons: {
          edit: "Modifica contatto"
        },
        extraInfo: "Altre informazioni",
        participants: "Partecipanti",
        participantsUnavailable: "Impossibile caricare i partecipanti",
        you: "tu",
        admin: "Admin",
        owner: "Creatore"
      },
      ticketOptionsMenu: {
        schedule: "Pianificazione",
        delete: "Elimina",
        transfer: "Trasferisci",
        appointmentsModal: {
          title: "Osservazioni del Ticket",
          textarea: "Osservazione",
          placeholder: "Inserisci qui le informazioni che desideri registrare"
        },
        confirmationModal: {
          title: "Elimina il ticket del contatto",
          message:
            "Attenzione! Tutti i messaggi relativi al ticket saranno persi."
        },
        buttons: {
          delete: "Elimina",
          cancel: "Annulla"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Annulla"
        }
      },
      messageOptionsMenu: {
        delete: "Elimina",
        edit: "Modifica",
        history: "Cronologia",
        reply: "Rispondi",
        confirmationModal: {
          title: "Eliminare il messaggio?",
          message: "Questa azione non può essere annullata."
        }
      },
      messageHistoryModal: {
        close: "Chiudi",
        title: "Cronologia delle modifiche del messaggio"
      },
      presence: {
        unavailable: "Non disponibile",
        available: "Disponibile",
        composing: "Sta scrivendo...",
        recording: "Sta registrando...",
        paused: "In pausa"
      },
      privacyModal: {
        title: "Modifica Privacy di WhatsApp",
        buttons: {
          cancel: "Annulla",
          okEdit: "Salva"
        },
        form: {
          menu: {
            all: "Tutti",
            none: "Nessuno",
            contacts: "I miei contatti",
            contact_blacklist: "Contatti selezionati",
            match_last_seen: "Simile a Ultimo Visto",
            known: "Conosciuti",
            disable: "Disattivata",
            hrs24: "24 Ore",
            dias7: "7 Giorni",
            dias90: "90 Giorni"
          },
          readreceipts: "Per aggiornare la privacy delle ricevute di lettura",
          profile: "Per aggiornare la privacy della foto del profilo",
          status: "Per aggiornare la privacy degli stati",
          online: "Per aggiornare la privacy online",
          last: "Per aggiornare la privacy dell'Ultimo Visto",
          groupadd: "Per aggiornare la privacy di Aggiunta ai gruppi",
          calladd: "Per aggiornare la privacy di Aggiunta alle chiamate",
          disappearing: "Per aggiornare la Modalità di Scomparsa Predefinita"
        }
      },
      frontendErrors: {
        ERR_CONFIG_ERROR: "Errore di configurazione. Contatta il supporto.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Orologio non sincronizzato. Controlla le impostazioni di data e ora del tuo dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend non raggiungibile. Riprova più tardi.",
        ERR_BACKEND_NOT_READY:
          "Il backend si sta avviando e non è ancora pronto. Nuovo tentativo automatico."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "Nessuna connessione WhatsApp disponibile per aprire la conversazione.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "Questo lead non è più nella tua base.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Questo lead non ha telefono per aprire una conversazione.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "La prospezione non è ancora configurata su questo server.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "La chiave di accesso alla prospezione è stata rifiutata. Avvisa il supporto.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "Il servizio di prospezione non ha risposto. Riprova tra qualche minuto.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "Il servizio di prospezione ha rifiutato questa ricerca. Controlla nicchia e città.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Questa ricerca non esiste più nel servizio di prospezione.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Indica nicchia e città per cercare lead.",
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
        ERR_INVALID_TRIAL_DAYS:
          "I giorni di prova devono essere un intero tra 0 e 3650.",
        ERR_INVALID_DUE_DAY:
          "Il giorno di scadenza deve essere un intero tra 1 e 31.",
        ERR_TRIAL_ALREADY_STARTED:
          "La prova gratuita non può essere modificata dopo l’inizio della fatturazione.",
        ERR_TASK_BOARD_INVALID_TITLE: "Inserisci un titolo valido.",
        ERR_TASK_BOARD_INVALID_COLOR: "Inserisci un colore esadecimale valido.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Colonna non trovata.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Attività non trovata.",
        ERR_TASK_BOARD_INVALID_DATE: "Inserisci una data valida.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "L’intervallo di date non è valido.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "La bacheca deve avere una colonna per le attività completate.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER:
          "L’ordine delle colonne non è valido.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Scegli un’altra colonna completata prima di eliminare questa.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Sposta le attività prima di eliminare questa colonna.",
        ERR_EMAIL_NOT_FOUND: "Non abbiamo trovato questa email.",
        ERR_COMPANY_SUSPENDED:
          "Questo account è sospeso. Contatta il responsabile del tuo abbonamento.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Questo account ha già una password. Torna alla pagina di accesso.",
        ERR_ACTIVATION_INVALID:
          "Questo link di attivazione non è valido o è scaduto.",
        ERR_PASSWORD_CONFIRMATION: "Le password non coincidono.",
        ERR_PASSWORD_TOO_WEAK:
          "La password deve avere almeno 8 caratteri, maiuscola, minuscola e un numero.",
        ERR_NO_OTHER_WHATSAPP: "Deve esserci almeno un WhatsApp predefinito.",
        ERR_NO_DEF_WAPP_FOUND:
          "Nessun WhatsApp predefinito trovato. Controlla la pagina delle connessioni.",
        ERR_WAPP_NOT_INITIALIZED:
          "Questa sessione di WhatsApp non è stata inizializzata. Controlla la pagina delle connessioni.",
        ERR_WAPP_CHECK_CONTACT:
          "Impossibile verificare il contatto di WhatsApp. Controlla la pagina delle connessioni",
        ERR_WAPP_INVALID_CONTACT: "Questo non è un numero di WhatsApp valido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Impossibile scaricare i media da WhatsApp. Controlla la pagina delle connessioni.",
        ERR_INVALID_CREDENTIALS:
          "Errore di autenticazione. Per favore, riprova.",
        ERR_SENDING_WAPP_MSG:
          "Errore nell'invio del messaggio di WhatsApp. Controlla la pagina delle connessioni.",
        ERR_DELETE_WAPP_MSG: "Impossibile eliminare il messaggio di WhatsApp.",
        ERR_EDITING_WAPP_MSG:
          "Impossibile modificare il messaggio di WhatsApp.",
        ERR_OTHER_OPEN_TICKET:
          "Esiste già un ticket aperto per questo contatto.",
        ERR_QUEUE_INVALID_CONNECTION:
          "Una connessione selezionata non appartiene a questa azienda.",
        ERR_WAPP_INVALID_QUEUE:
          "Una coda selezionata non appartiene a questa azienda.",
        ERR_TICKET_INVALID_CONNECTION:
          "La connessione selezionata non è compatibile con questo ticket.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "Un ticket di gruppo non può cambiare connessione.",
        ERR_INVALID_GROUP_MODE: "La modalità gruppo selezionata non è valida.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Seleziona almeno una coda autorizzata per il gruppo.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED:
          "Seleziona una coda di assistenza autorizzata.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "Questo gruppo è in modalità conversazione e non accetta azioni di assistenza.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED:
          "La connessione di destinazione deve essere connessa.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Seleziona una coda quando cambi connessione.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "Questa coda non è collegata alla connessione selezionata.",
        ERR_SESSION_EXPIRED: "Sessione scaduta. Per favore, accedi di nuovo.",
        ERR_USER_CREATION_DISABLED:
          "La creazione dell'utente è stata disabilitata dall'amministratore.",
        ERR_NO_PERMISSION: "Non hai il permesso di accedere a questa funzione.",
        ERR_DUPLICATED_CONTACT: "Esiste già un contatto con questo numero.",
        ERR_NO_SETTING_FOUND: "Nessuna impostazione trovata con questo ID.",
        ERR_NO_CONTACT_FOUND: "Nessun contatto trovato con questo ID.",
        ERR_NO_TICKET_FOUND: "Nessun ticket trovato con questo ID.",
        ERR_NO_USER_FOUND: "Nessun utente trovato con questo ID.",
        ERR_NO_WAPP_FOUND: "Nessun WhatsApp trovato con questo ID.",
        ERR_CREATING_MESSAGE:
          "Errore nella creazione del messaggio nel database.",
        ERR_CREATING_TICKET: "Errore nella creazione del ticket nel database.",
        ERR_FETCH_WAPP_MSG:
          "Errore nel recupero del messaggio su WhatsApp, potrebbe essere troppo vecchio.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Questo colore è già in uso, scegline un altro.",
        ERR_WAPP_GREETING_REQUIRED:
          "Il messaggio di benvenuto è obbligatorio quando ci sono più code."
      },
      ticketz: {
        registration: {
          header: "Registrati nella base utenti di Espaço Whats",
          description:
            "Compila i campi sottostanti per registrarti nella base utenti di Espaço Whats e ricevere aggiornamenti sul progetto.",
          name: "Nome",
          country: "Paese",
          phoneNumber: "Numero di WhatsApp",
          submit: "Registrati"
        },
        proAd: {
          imageAlt: "Screenshot di Espaço Whats PRO",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "WhatsApp ufficiale - Instagram - Messenger e altri",
            exclusiveFeatures: "Funzionalità esclusive",
            advancedSupport: "Supporto avanzato",
            easyMigration: "Migrazione semplificata"
          },
          subscribePrice: "Abbonati per {{monthlyPrice}}/mese",
          subscribeSubtitle: "direttamente nel sistema",
          ctaUpgrade: "Clicca per le istruzioni di upgrade",
          ctaVisitSite: "Clicca per visitare il sito",
          instructions: {
            title: "Istruzioni di upgrade",
            stepIntro:
              "Se hai installato le immagini fornite dal progetto su un server o VPS usando le istruzioni semplificate, devi solo accedere al server ed eseguire il comando seguente:",
            stepInstall:
              'Tra pochi istanti Espaço Whats PRO sarà installato con tutti i tuoi dati; poi vai nel menu utente, clicca su "Abbonamento Espaço Whats PRO" e completa l\'abbonamento.',
            helpPrefix:
              "Se la tua installazione è diversa o pensi di aver bisogno di aiuto per installare Espaço Whats PRO, ",
            helpLink: "contattaci",
            helpSuffix: " e ti aiuteremo!"
          }
        },
        support: {
          title: "Supporta il progetto Espaço Whats Open Source",
          mercadopagotitle: "Carta di Credito",
          recurringbrl: "Donazione ricorrente in R$",
          paypaltitle: "Carta di Credito",
          international: "Internazionale in US$"
        }
      }
    }
  }
};

export { messages };
