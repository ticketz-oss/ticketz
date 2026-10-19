const messages = {
  fr: {
    translations: {
      visual: {
        visualizar: "Voir",
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
          "Fin du flux. La conversation devient disponible pour l’équipe humaine.",
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
        settingsTab: "Appels expérimentaux",
        companySwitch: "Appels expérimentaux",
        enabled: "Activés",
        disabled: "Désactivés",
        experimentalTitle: "Intégration expérimentale des appels",
        warning:
          "Intégration WhatsApp non officielle. Il existe un risque de déconnexion, suspension ou bannissement. Utilisez-la uniquement dans le tenant de test.",
        serviceUnavailable:
          "Le service d'appels est actuellement indisponible.",
        riskConsent:
          "Je comprends le risque et souhaite associer un deuxième appareil par code QR.",
        status: "État",
        disconnect: "Désactiver et dissocier",
        pair: "Associer par code QR",
        noConnections:
          "Créez d'abord une connexion WhatsApp avant de configurer les appels.",
        qrInstruction:
          "Dans WhatsApp, ouvrez Appareils connectés et scannez ce deuxième code QR.",
        disconnectedSuccess: "Intégration des appels dissociée.",
        incoming: "Appel entrant",
        incomingHint: "Le premier agent qui accepte prendra l'appel.",
        reject: "Refuser",
        accept: "Répondre",
        active: "Appel en cours",
        mute: "Couper le micro",
        transcribe: "Transcrire l'appel",
        record: "Enregistrer l'appel",
        end: "Terminer",
        states: {
          disconnected: "Déconnectée",
          pairing: "En attente du code QR",
          connecting: "Connexion",
          open: "Connectée",
          logged_out: "Dissociée"
        },
        errors: {
          load: "Impossible de charger les appels expérimentaux.",
          pair: "Impossible de générer le code QR des appels.",
          action: "Impossible de terminer l'action d'appel.",
          transcriptionConfig:
            "Définissez GROQ_API_KEY dans l'environnement pour activer la transcription.",
          microphone: "L'accès au micro a été refusé. L'appel a été terminé."
        }
      },
      common: {
        search: "Rechercher",
        edit: "Éditer",
        delete: "Supprimer",
        cancel: "Annuler",
        save: "Enregistrer",
        you: "Vous",
        confirm: "Confirmer",
        close: "Fermer",
        error: "Erreur",
        success: "Succès",
        actions: "Actions",
        add: "Ajouter",
        name: "Nom",
        email: "Email",
        phone: "Téléphone",
        company: "Entreprise",
        user: "Utilisateur",
        connection: "Connexion",
        queue: "File d'attente",
        contact: "Contact",
        serverTime: "Heure du serveur :",
        clientTime: "Heure du client :",
        differenceMinutes: "Différence : {{count}} minute(s)"
      },
      signup: {
        title: "S'inscrire",
        toasts: {
          success: "Utilisateur créé avec succès ! Connectez-vous !!!",
          fail: "Erreur lors de la création de l'utilisateur. Vérifiez les informations fournies."
        },
        form: {
          name: "Nom",
          email: "Email",
          password: "Mot de passe"
        },
        buttons: {
          submit: "S'inscrire",
          login: "Vous avez déjà un compte ? Connectez-vous !"
        }
      },
      login: {
        title: "Connexion",
        form: {
          email: "Email",
          password: "Mot de passe",
          newPassword: "Nouveau mot de passe",
          confirmPassword: "Confirmer le mot de passe",
          passwordStrength:
            "Utilisez au moins 8 caractères avec une majuscule, une minuscule et un chiffre."
        },
        buttons: {
          submit: "Se connecter",
          continue: "Continuer",
          createPassword: "Créer le mot de passe et se connecter",
          changeEmail: "Changer d'email",
          backToLogin: "Retour à la connexion",
          register: "Vous n'avez pas de compte ? Inscrivez-vous !"
        },
        errors: {
          emailNotFound: "Nous n'avons pas trouvé cet email.",
          passwordMismatch: "Les mots de passe ne correspondent pas.",
          passwordStrength:
            "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
          activationInvalid: "Ce lien d'activation est invalide ou a expiré."
        },
        activation: {
          title: "Créez votre mot de passe",
          account: "Activation du compte {{email}}"
        }
      },
      companies: {
        title: "Enregistrer une entreprise",
        form: {
          name: "Nom de l'entreprise",
          plan: "Plan",
          token: "Jeton",
          submit: "Enregistrer",
          success: "Entreprise créée avec succès !"
        }
      },
      auth: {
        toasts: {
          success: "Connexion réussie !"
        },
        token: "Jeton"
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Interventions aujourd'hui : "
          }
        },
        blog: {
          title: "Le blog de Espaço Whats",
          loading: "Chargement des articles...",
          error: "Impossible de charger les articles du blog.",
          empty: "Aucun article trouve.",
          showAll: "Afficher tous les articles",
          showLess: "Afficher moins",
          openPost: "Lire l'article",
          previous: "Article precedent",
          next: "Article suivant"
        }
      },
      connections: {
        title: "Connexions",
        toasts: {
          deleted: "Connexion avec WhatsApp supprimée avec succès !"
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Êtes-vous sûr ? Cette action est irréversible.",
          disconnectTitle: "Déconnecter",
          disconnectMessage:
            "Êtes-vous sûr ? Vous devrez scanner à nouveau le QR Code."
        },
        buttons: {
          add: "Ajouter WhatsApp",
          disconnect: "Déconnecter",
          tryAgain: "Réessayer",
          qrcode: "QR CODE",
          newQr: "Nouveau QR CODE",
          connecting: "Connexion en cours"
        },
        toolTips: {
          disconnected: {
            title: "Échec de la connexion à WhatsApp",
            content:
              "Assurez-vous que votre téléphone est connecté à Internet et réessayez, ou demandez un nouveau QR Code"
          },
          qrcode: {
            title: "En attente de la lecture du QR Code",
            content:
              "Cliquez sur le bouton 'QR CODE' et scannez le QR Code avec votre téléphone pour démarrer la session"
          },
          connected: {
            title: "Connexion établie !"
          },
          timeout: {
            title: "Connexion avec le téléphone perdue",
            content:
              "Assurez-vous que votre téléphone est connecté à Internet et que WhatsApp est ouvert, ou cliquez sur le bouton 'Déconnecter' pour obtenir un nouveau QR Code"
          },
          passkey: {
            title: "Passkey authentication required",
            content:
              "Click the passkey button and use the browser extension to capture the authenticated WhatsApp Web session."
          },
          resetPasskey: "Réinitialiser la session passkey"
        },
        table: {
          contact: "Contact",
          name: "Nom",
          status: "Statut",
          lastUpdate: "Dernière mise à jour",
          default: "Par défaut",
          actions: "Actions",
          session: "Session"
        }
      },
      internalChat: {
        title: "Chat Interne"
      },
      whatsappGroups: {
        configure: "Configurer le groupe",
        mode: "Mode du groupe",
        conversation: "Conversation",
        attendance: "Prise en charge",
        allowedQueues: "Files autorisées",
        serviceQueue: "File de service",
        cancel: "Annuler",
        save: "Enregistrer",
        confirmConversation:
          "Retirer ce groupe du flux de prise en charge ? La prise en charge active sera terminée sans évaluation."
      },
      whatsappModal: {
        title: {
          add: "Ajouter WhatsApp",
          edit: "Modifier WhatsApp"
        },
        form: {
          name: "Nom",
          default: "Par défaut"
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler"
        },
        success: "WhatsApp enregistré avec succès."
      },
      qrCode: {
        message: "Scannez le QR Code pour démarrer la session",
        extensionHint: "S'authentifier via WhatsApp Web",
        startCapture: "Capturer la session WhatsApp Web",
        installExtension: "Installer l'extension de capture"
      },
      passkeyModal: {
        title: "Extension de capture WhatsApp Web",
        instructions:
          "Use the browser extension to capture the authenticated WhatsApp Web session and send it to the server.",
        connectorNotFound:
          "Extension not detected. Install the passkey capture extension and reload the page.",
        connectorReady:
          "Extension détectée. Cliquez ci-dessous pour vous authentifier via WhatsApp Web.",
        startCapture: "Start Capture",
        waitingForCapture: "Waiting for WhatsApp Web session capture…",
        existingSession: "WhatsApp Web already has a session for {{number}}.",
        captureExisting: "Capture this session",
        clearAndContinue: "Clear local session and continue",
        importSent: "Session captured and sent successfully.",
        importError: "Capture failed: {{reason}}.",
        missingToken: "Capture token is missing. Please reload the page.",
        downloadExtension: "Télécharger l'extension de capture",
        installInstructions: "Comment installer",
        hideInstructions: "Masquer les instructions",
        instructionsIntro:
          "Suivez les étapes ci-dessous pour installer l'extension :",
        installStep1: "Téléchargez le fichier ZIP de l'extension.",
        installStep2:
          "Extrayez le fichier ZIP dans un dossier de votre ordinateur.",
        installStep3: "Ouvrez Google Chrome et allez à chrome://extensions/.",
        installStep4:
          "Activez le Mode développeur avec le bouton en haut à droite.",
        installStep5: 'Cliquez sur "Charger l\'extension non empaquetée".',
        installStep6:
          "Sélectionnez le dossier extrait contenant les fichiers de l'extension.",
        installStep7: "L'extension est installée et prête à l'emploi.",
        installStep8:
          "Actualisez cette page avec F5 et essayez de vous connecter à nouveau."
      },
      contacts: {
        title: "Contacts",
        toasts: {
          deleted: "Contact supprimé avec succès !"
        },
        searchPlaceholder: "Rechercher...",
        confirmationModal: {
          deleteTitle: "Supprimer",
          importTitlte: "Importer des contacts",
          deleteMessage:
            "Êtes-vous sûr de vouloir supprimer ce contact ? Toutes les interventions associées seront perdues.",
          importMessage: "Voulez-vous importer tous les contacts du téléphone ?"
        },
        buttons: {
          import: "Importer des Contacts",
          add: "Ajouter un Contact"
        },
        table: {
          name: "Nom",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions"
        }
      },
      contactModal: {
        title: {
          add: "Ajouter un contact",
          edit: "Modifier le contact"
        },
        form: {
          mainInfo: "Informations du contact",
          extraInfo: "Informations supplémentaires",
          name: "Nom",
          number: "Numéro WhatsApp",
          email: "Email",
          extraName: "Nom du champ",
          extraValue: "Valeur",
          disableBot: "Désactiver le chatbot"
        },
        buttons: {
          addExtraInfo: "Ajouter une information",
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler"
        },
        success: "Contact enregistré avec succès."
      },
      queueModal: {
        title: {
          add: "Ajouter une file d'attente",
          edit: "Modifier la file d'attente"
        },
        form: {
          name: "Nom",
          color: "Couleur",
          greetingMessage: "Message de bienvenue",
          complationMessage: "Message de fin",
          outOfHoursMessage: "Message hors des heures d'ouverture",
          ratingMessage: "Message d'évaluation",
          transferMessage: "Message de transfert",
          connections: "Connexions WhatsApp",
          connectionsHelp:
            "La file et le chatbot ne seront proposés que sur ces connexions.",
          token: "Jeton"
        },
        validation: {
          connectionRequired:
            "Sélectionnez au moins une connexion pour la file."
        },
        toasts: {
          saved: "File d'attente enregistrée avec succès"
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
          attach: "Joindre un fichier"
        },
        serviceHours: {
          dayWeek: "Jour de la semaine",
          startTimeA: "Heure de début - Période A",
          endTimeA: "Heure de fin - Période A",
          startTimeB: "Heure de début - Période B",
          endTimeB: "Heure de fin - Période B",
          monday: "Lundi",
          tuesday: "Mardi",
          wednesday: "Mercredi",
          thursday: "Jeudi",
          friday: "Vendredi",
          saturday: "Samedi",
          sunday: "Dimanche"
        }
      },
      userModal: {
        title: {
          add: "Ajouter un utilisateur",
          edit: "Modifier l'utilisateur"
        },
        form: {
          name: "Nom",
          email: "Email",
          password: "Mot de passe",
          profile: "Profil"
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler"
        },
        success: "Utilisateur enregistré avec succès."
      },
      scheduleModal: {
        title: {
          add: "Nouveau Planification",
          edit: "Modifier Planification"
        },
        form: {
          body: "Message",
          contact: "Contact",
          sendAt: "Date de Planification",
          sentAt: "Date d'Envoi",
          saveMessage: "Enregistrer le Message dans le Ticket"
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler"
        },
        success: "Planification enregistrée avec succès."
      },
      tagModal: {
        title: {
          add: "Nouvelle Étiquette",
          edit: "Modifier Étiquette",
          addKanban: "Nouvelle Lane",
          editKanban: "Modifier Lane"
        },
        form: {
          name: "Nom",
          color: "Couleur",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler"
        },
        success: "Étiquette enregistrée avec succès.",
        successKanban: "Lane enregistrée avec succès."
      },
      chat: {
        noTicketMessage: "Sélectionnez un ticket pour commencer à discuter."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop:
            "GLISSEZ ET DÉPOSEZ LES FICHIERS DANS LE CHAMP CI-DESSOUS",
          titleFileList: "Liste des fichiers"
        }
      },
      billing: {
        trialDays: "Jours d’essai gratuit",
        trialDaysHelp: "0 signifie aucun essai gratuit",
        dueDay: "Jour d’échéance",
        dueDayHelp: "Mensuel ; les mois courts utilisent leur dernier jour",
        prorata: "Prorata",
        trialEndsIn: "Votre essai se termine dans {{days}} jours.",
        noActiveTrial: "Aucun essai actif",
        period: "Période : {{start}} à {{end}}"
      },
      todolist: {
        title: "Tableau des tâches",
        loading: "Chargement du tableau...",
        loadError: "Impossible de charger le tableau.",
        emptyColumn: "Glissez une tâche dans cette colonne",
        dragTask: "Déplacer la tâche",
        dragTaskLabel: "Déplacer la tâche {{title}}",
        completedAt: "Terminée le {{date}}",
        editTaskTitle: "Modifier la tâche",
        newTaskTitle: "Nouvelle tâche",
        targets: { global: "Global", user: "Utilisateur", queue: "File" },
        deadline: {
          ok: "Dans les temps",
          warning: "Échéance proche",
          overdue: "En retard"
        },
        details: {
          noDescription: "Sans description",
          state: "État",
          createdBy: "Créée par",
          target: "Destination",
          createdAt: "Créée le",
          dueAt: "Échéance",
          completedAt: "Terminée le",
          history: "Historique"
        },
        events: {
          CREATED: "Créée",
          EDITED: "Modifiée",
          MOVED: "Déplacée",
          COMPLETED: "Terminée",
          REOPENED: "Rouverte"
        },
        form: {
          name: "Nom de la tâche",
          columnName: "Nom de la colonne",
          description: "Description",
          targetType: "Destination",
          assignee: "Utilisateur assigné",
          queue: "File assignée",
          dueAt: "Échéance"
        },
        buttons: {
          add: "Ajouter",
          newTask: "Nouvelle tâche",
          save: "Enregistrer",
          configure: "Configurer les colonnes",
          clearFilter: "Effacer le filtre",
          tryAgain: "Réessayer",
          editTask: "Modifier la tâche",
          deleteTask: "Supprimer la tâche",
          addColumn: "Ajouter une colonne"
        },
        filters: {
          from: "Terminées depuis",
          to: "Terminées jusqu’au",
          invalidDate: "Date invalide"
        },
        settings: {
          title: "Configurer les colonnes",
          description:
            "Personnalisez l’ordre, les noms et les couleurs. Une seule colonne représente les tâches terminées.",
          markDone: "Marquer {{title}} comme colonne terminée",
          doneColumn: "Colonne des tâches terminées",
          regularColumn: "Colonne de travail en cours",
          moveLeft: "Déplacer à gauche",
          moveRight: "Déplacer à droite",
          editColumn: "Modifier la colonne",
          newColumn: "Nouvelle colonne",
          chooseColor: "Choisir la couleur",
          useBrandColor: "Utiliser la couleur de l’entreprise"
        },
        confirm: {
          deleteTaskTitle: "Supprimer la tâche",
          deleteTask: "Supprimer la tâche « {{title}} » ?",
          deleteColumnTitle: "Supprimer la colonne",
          deleteColumn: "Supprimer la colonne « {{title}} » ?"
        },
        toasts: {
          taskCreated: "Tâche créée.",
          taskSaved: "Tâche mise à jour.",
          taskDeleted: "Tâche supprimée.",
          columnSaved: "Colonne enregistrée.",
          columnDeleted: "Colonne supprimée.",
          doneColumnChanged: "Colonne terminée mise à jour."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nouveau"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Files d'attente"
      },
      tickets: {
        toasts: {
          deleted: "L'intervention que vous gérez a été supprimée."
        },
        notification: {
          message: "Message de",
          nomessages: "Aucun message"
        },
        tabs: {
          open: { title: "Ouverts" },
          closed: { title: "Résolus" },
          groups: {
            title: "Groupes",
            conversations: "Conversations",
            attendances: "Prises en charge",
            pending: "En attente",
            open: "En cours",
            closed: "Terminées"
          },
          search: { title: "Recherche" }
        },
        search: {
          placeholder: "Rechercher des interventions et des messages"
        },
        buttons: {
          showAll: "Tous"
        }
      },
      transferTicketModal: {
        title: "Transférer le Ticket",
        fieldLabel: "Tapez pour rechercher des utilisateurs",
        fieldConnectionLabel: "Transférer via la connexion",
        fieldConnectionPlaceholder: "Sélectionnez une connexion",
        connectionHelp:
          "Après avoir choisi la connexion, sélectionnez une file disponible.",
        connectionUnavailable: "déconnectée",
        fieldQueueLabel: "Transférer à la file d'attente",
        fieldQueuePlaceholder: "Sélectionnez une file d'attente",
        noOptions: "Aucun utilisateur trouvé avec ce nom",
        buttons: {
          ok: "Transférer",
          cancel: "Annuler"
        }
      },
      ticketsList: {
        pendingHeader: "En attente",
        assignedHeader: "En cours",
        noTicketsTitle: "Rien ici !",
        noTicketsMessage:
          "Aucune intervention trouvée avec ce statut ou ce terme de recherche",
        buttons: {
          accept: "Accepter"
        }
      },
      newTicketModal: {
        title: "Créer un Ticket",
        fieldLabel: "Tapez pour rechercher le contact",
        add: "Ajouter",
        buttons: {
          ok: "Enregistrer",
          cancel: "Annuler"
        }
      },
      mainDrawer: {
        listItems: {
          dashboard: "Tableau de bord",
          connections: "Connexions",
          tickets: "Interventions",
          quickMessages: "Réponses Rapides",
          contacts: "Contacts",
          queues: "Files d'attente & Chatbot",
          tags: "Étiquettes",
          administration: "Administration",
          service: "Service",
          users: "Utilisateurs",
          settings: "Paramètres",
          helps: "Aide",
          chatgpt: "ChatGPT",
          schedules: "Planifications",
          campaigns: "Campagnes",
          annoucements: "Annonces",
          chats: "Chat Interne",
          financeiro: "Financier",
          cobranca: "Billing",
          prospeccao: "Prospection",
          logout: "Déconnexion",
          management: "Gestion",
          kanban: "Kanban",
          tasks: "Tâches"
        },
        appBar: {
          i18n: {
            language: "Français",
            language_short: "FR"
          },
          user: {
            profile: "Profil",
            subscriptionValidUntilLabel: "Abonnement valide jusqu'au",
            darkmode: "Mode sombre",
            lightmode: "Mode clair",
            language: "Sélectionner la langue",
            about: "À propos",
            logout: "Déconnexion"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Pilote activé",
        disabled: "Pilote désactivé",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Recommandé",
          description:
            "Le moyen le plus simple d'utiliser vos données de service client dans ChatGPT.",
          details:
            "Installez le plugin, connectez votre compte Espaço Whats avec OAuth et utilisez-le depuis le menu des plugins ou en mentionnant @EspaçoWhats.",
          open: "Ouvrir le plugin dans ChatGPT",
          steps: {
            title: "Comment installer et connecter",
            open: "Ouvrez le plugin Espaço Whats dans ChatGPT",
            install: "Cliquez sur Installer le plugin",
            connect: "Sélectionnez Connecter",
            login:
              "Connectez-vous avec le tenant, l'e-mail et le mot de passe administrateur",
            use: "Utilisez le menu des plugins ou mentionnez @EspaçoWhats"
          },
          marketplace: {
            title: "Installation GitHub pour les workspaces",
            description:
              "Un administrateur peut aussi importer le marketplace officiel depuis Paramètres du workspace → Plugins → Ajouter → Importer un marketplace.",
            repository: "Dépôt",
            path: "Chemin",
            pathValue: "Laissez vide",
            branch: "Branche",
            copy: "Copier le dépôt"
          }
        },
        warningTitle: "Données personnelles et cliniques",
        warning:
          "Une fois connecté, des conversations identifiables et d'éventuelles données cliniques peuvent être transmises à ChatGPT selon vos questions. À utiliser uniquement après validation juridique et administrative.",
        copy: "Copier l'URL",
        connection: {
          title: "URL du serveur MCP",
          description:
            "Espaço Whats n'utilise pas de clé OpenAI. L'intelligence et les limites dépendent de l'abonnement ChatGPT de l'utilisateur."
        },
        steps: {
          title: "Comment se connecter",
          open: "Ouvrez le Developer Mode de ChatGPT",
          create: "Créez une intégration MCP Draft",
          url: "Collez l'URL MCP",
          oauth: "Choisissez OAuth",
          login:
            "Connectez-vous avec le tenant, l'e-mail et le mot de passe administrateur"
        },
        connections: {
          title: "Connexions actives",
          empty: "Aucune connexion ChatGPT.",
          client: "Client",
          admin: "Administrateur",
          created: "Créée",
          lastUse: "Dernière utilisation",
          revoke: "Révoquer",
          revokeAll: "Tout révoquer"
        },
        revoke: {
          title: "Révoquer la connexion",
          one: "Cette connexion perdra immédiatement l'accès.",
          all: "Toutes les connexions de ce tenant perdront immédiatement l'accès."
        },
        toasts: {
          copied: "URL MCP copiée.",
          repositoryCopied: "Dépôt du plugin copié.",
          revoked: "Connexion révoquée."
        }
      },
      notifications: {
        noTickets: "Aucune notification."
      },
      quickMessages: {
        title: "Réponses Rapides",
        buttons: {
          add: "Nouvelle Réponse"
        },
        dialog: {
          shortcode: "Raccourci",
          message: "Réponse"
        }
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Recherche",
        subMenus: {
          list: "Tableau",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Ouvert",
        confirmationModal: {
          deleteTitle: "Êtes-vous sûr de vouloir supprimer cette Lane ?",
          deleteMessage: "Cette action est irréversible."
        },
        table: {
          name: "Nom",
          color: "Couleur",
          tickets: "Tickets",
          actions: "Actions"
        },
        buttons: {
          add: "Nouvelle Lane"
        },
        toasts: {
          deleted: "Lane supprimée avec succès."
        }
      },
      contactLists: {
        title: "Listes de Contacts",
        table: {
          name: "Nom",
          contacts: "Contacts",
          actions: "Actions"
        },
        buttons: {
          add: "Nouvelle Liste"
        },
        dialog: {
          name: "Nom",
          company: "Entreprise",
          okEdit: "Modifier",
          okAdd: "Ajouter",
          add: "Ajouter",
          edit: "Modifier",
          cancel: "Annuler"
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible."
        },
        toasts: {
          deleted: "Enregistrement supprimé",
          created: "Enregistrement créé"
        }
      },
      contactListItems: {
        title: "Contacts",
        searchPlaceholder: "Recherche",
        buttons: {
          add: "Nouveau",
          lists: "Listes",
          import: "Importer"
        },
        dialog: {
          name: "Nom",
          number: "Numéro",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Modifier",
          okAdd: "Ajouter",
          add: "Ajouter",
          edit: "Modifier",
          cancel: "Annuler"
        },
        table: {
          name: "Nom",
          number: "Numéro",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions"
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible.",
          importMessage: "Voulez-vous importer les contacts de cette feuille ?",
          importTitlte: "Importer"
        },
        toasts: {
          deleted: "Enregistrement supprimé"
        }
      },
      campaigns: {
        title: "Campagnes",
        searchPlaceholder: "Recherche",
        buttons: {
          add: "Nouvelle Campagne",
          contactLists: "Listes de Contacts"
        },
        table: {
          name: "Nom",
          whatsapp: "Connexion",
          contactList: "Liste de Contacts",
          status: "Statut",
          scheduledAt: "Planification",
          completedAt: "Complétée",
          confirmation: "Confirmation",
          actions: "Actions"
        },
        dialog: {
          new: "Nouvelle Campagne",
          update: "Modifier Campagne",
          readonly: "Lecture seule",
          form: {
            name: "Nom",
            message1: "Message 1",
            message2: "Message 2",
            message3: "Message 3",
            message4: "Message 4",
            message5: "Message 5",
            confirmationMessage1: "Message de Confirmation 1",
            confirmationMessage2: "Message de Confirmation 2",
            confirmationMessage3: "Message de Confirmation 3",
            confirmationMessage4: "Message de Confirmation 4",
            confirmationMessage5: "Message de Confirmation 5",
            messagePlaceholder: "Contenu du message",
            whatsapp: "Connexion",
            status: "Statut",
            scheduledAt: "Planification",
            confirmation: "Confirmation",
            contactList: "Liste de Contacts"
          },
          buttons: {
            add: "Ajouter",
            edit: "Mettre à jour",
            okadd: "Ok",
            cancel: "Annuler les Envois",
            restart: "Redémarrer les Envois",
            close: "Fermer",
            attach: "Joindre un Fichier"
          }
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible."
        },
        toasts: {
          success: "Opération réussie",
          cancel: "Campagne annulée",
          restart: "Campagne redémarrée",
          deleted: "Enregistrement supprimé"
        }
      },
      announcements: {
        title: "Annonces",
        searchPlaceholder: "Recherche",
        buttons: {
          add: "Nouvelle Annonce",
          contactLists: "Listes d'Annonces"
        },
        table: {
          priority: "Priorité",
          title: "Titre",
          text: "Texte",
          mediaName: "Fichier",
          status: "Statut",
          actions: "Actions"
        },
        dialog: {
          edit: "Modifier Annonce",
          add: "Nouvelle Annonce",
          update: "Mettre à jour Annonce",
          readonly: "Lecture seule",
          form: {
            priority: "Priorité",
            title: "Titre",
            text: "Texte",
            mediaPath: "Fichier",
            status: "Statut"
          },
          buttons: {
            add: "Ajouter",
            edit: "Mettre à jour",
            okadd: "Ok",
            cancel: "Annuler",
            close: "Fermer",
            attach: "Joindre un Fichier"
          }
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible."
        },
        toasts: {
          success: "Opération réussie",
          deleted: "Enregistrement supprimé"
        }
      },
      campaignsConfig: {
        title: "Configurations des Campagnes"
      },
      queues: {
        title: "Files d'attente & Chatbot",
        table: {
          name: "Nom",
          color: "Couleur",
          greeting: "Message de bienvenue",
          actions: "Actions"
        },
        toasts: {
          deleted: "File d'attente supprimée avec succès"
        },
        buttons: {
          add: "Ajouter une file d'attente"
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage:
            "Êtes-vous sûr ? Cette action est irréversible ! Les interventions de cette file d'attente continueront d'exister, mais n'auront plus de file d'attente attribuée."
        }
      },
      queueSelect: {
        inputLabel: "Files d'attente"
      },
      users: {
        title: "Utilisateurs",
        empty: "Aucun utilisateur trouvé.",
        filters: {
          queue: "File d'attente",
          allQueues: "Toutes les files d'attente"
        },
        profiles: {
          admin: "Administrateur",
          user: "Utilisateur"
        },
        groups: {
          admin: "Administrateurs",
          user: "Utilisateurs"
        },
        table: {
          name: "Nom",
          email: "Email",
          profile: "Profil",
          queues: "Files d'attente",
          noQueues: "Aucune file d'attente",
          actions: "Actions"
        },
        buttons: {
          add: "Ajouter un utilisateur"
        },
        toasts: {
          deleted: "Utilisateur supprimé avec succès."
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage:
            "Toutes les données de l'utilisateur seront perdues. Les interventions ouvertes de cet utilisateur seront déplacées vers la file d'attente."
        }
      },
      helps: {
        title: "Centre d'Aide",
        adminOnly: "Administrateurs uniquement",
        groupModal: {
          adminOnlyHelper:
            "Cette carte et tout son contenu sont masqués pour les utilisateurs ordinaires."
        },
        contentModal: {
          adminOnly: "Visible uniquement par les administrateurs"
        }
      },
      about: {
        aboutthe: "À propos de",
        copyright: "© 2024 - Fonctionne avec Espaço Whats",
        buttonclose: "Fermer",
        title: "À propos de Espaço Whats",
        abouttitle: "Origine et améliorations",
        aboutdetail:
          "Le Espaço Whats est dérivé indirectement du projet Whaticket avec des améliorations partagées par les développeurs du système EquipeChat via la chaîne VemFazer sur YouTube, puis améliorées par Claudemir Todo Bom",
        aboutauthorsite: "Site de l'auteur",
        aboutwhaticketsite: "Site de la communauté Whaticket sur Github",
        aboutvemfazersite: "Site de la chaîne Vem Fazer sur Github",
        licenseheading: "Licence Open Source",
        licensedetail:
          "Le Espaço Whats est sous licence GNU Affero General Public License version 3, ce qui signifie que tout utilisateur ayant accès à cette application a le droit d'accéder au code source. Plus d'informations dans les liens ci-dessous :",
        licensefulltext: "Texte complet de la licence",
        licensesourcecode: "Code source de Espaço Whats"
      },
      schedules: {
        title: "Planifications",
        confirmationModal: {
          deleteTitle:
            "Êtes-vous sûr de vouloir supprimer cette Planification ?",
          deleteMessage: "Cette action est irréversible."
        },
        table: {
          contact: "Contact",
          body: "Message",
          sendAt: "Date de Planification",
          sentAt: "Date d'Envoi",
          status: "Statut",
          actions: "Actions"
        },
        buttons: {
          add: "Nouvelle Planification"
        },
        toasts: {
          deleted: "Planification supprimée avec succès."
        }
      },
      tags: {
        title: "Étiquettes",
        confirmationModal: {
          deleteTitle: "Êtes-vous sûr de vouloir supprimer cette Étiquette ?",
          deleteMessage: "Cette action est irréversible."
        },
        table: {
          name: "Nom",
          color: "Couleur",
          tickets: "Enregistrements",
          actions: "Actions",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nouvelle Étiquette"
        },
        toasts: {
          deleted: "Étiquette supprimée avec succès."
        }
      },
      whitelabel: {
        primaryColorLight: "Couleur primaire claire",
        primaryColorDark: "Couleur primaire foncée",
        lightLogo: "Logo clair de l'application",
        darkLogo: "Logo sombre de l'application",
        favicon: "Favicon de l'application",
        appname: "Nom de l'application",
        logoHint: "Préférez le SVG et un ratio de 28:10",
        faviconHint: "Préférez une image SVG carrée ou PNG 512x512",
        loginLinks: "Liens de connexion",
        loginLinksHint:
          "Ajoutez des paires titre/URL à afficher sous le bloc de connexion sur ordinateur et mobile.",
        linkTitle: "Titre du lien",
        linkUrl: "URL du lien",
        removeLink: "Supprimer le lien",
        sidePanelImage: "Image latérale de connexion",
        sidePanelImageHint:
          "Affichée dans le panneau latéral de connexion sur les écrans de bureau.",
        backgroundContent: "Contenu d'arrière-plan de connexion",
        backgroundContentHint:
          "Accepte les images, fichiers SVG et vidéos MP4 pour l'arrière-plan de l'écran de connexion.",
        noFileSelected: "Aucun fichier sélectionné pour le moment.",
        buildExtension: "Construire l'extension WA Session Capture",
        buildingExtension: "Construction de l'extension…",
        downloadExtension: "Télécharger l'extension",
        extensionHint:
          "Construit une extension Chrome en marque blanche. Le ZIP téléchargé contient déjà les fichiers de l'extension : décompressez-le et chargez le dossier extrait comme extension non empaquetée.",
        extensionBuildStarted:
          "Construction de l'extension démarrée. Vous serez notifié lorsqu'elle sera prête.",
        extensionBuildFailed:
          "Impossible de démarrer la construction de l'extension.",
        extensionBuilt: "Extension construite avec succès.",
        extensionBuildUnknownError: "Erreur de construction inconnue."
      },
      settings: {
        group: {
          general: "Général",
          timeouts: "Temps d'attente",
          officeHours: "Heures de bureau",
          groups: "Groupes",
          confidenciality: "Confidentialité",
          api: "API",
          serveradmin: "Administration du serveur"
        },
        success: "Paramètres enregistrés avec succès.",
        title: "Paramètres",
        settings: {
          userCreation: {
            name: "Création d'utilisateur",
            options: {
              enabled: "Activé",
              disabled: "Désactivé"
            }
          }
        },
        validations: {
          title: "Évaluations",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        OfficeManagement: {
          title: "Gestion des Heures de Bureau",
          options: {
            disabled: "Désactivé",
            ManagementByDepartment: "Gestion par File d'attente",
            ManagementByCompany: "Gestion par Entreprise"
          }
        },
        outOfHoursAction: {
          title: "Action hors des heures de bureau",
          options: {
            pending: "Laisser en attente",
            closed: "Fermer le ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignorer les Messages de Groupe",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        soundGroupNotifications: {
          title: "Notifications sonores de groupe",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        groupsTab: {
          title: "Onglet Groupes",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        VoiceAndVideoCalls: {
          title: "Appels Vocaux et Vidéo",
          options: {
            enabled: "Ignorer",
            disabled: "Informer de l'indisponibilité"
          }
        },
        AutomaticChatbotOutput: {
          title: "Sortie automatique du chatbot",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        ShowNumericEmoticons: {
          title: "Afficher les émojis numériques dans la file d'attente",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        QuickMessages: {
          title: "Messages Rapides",
          options: {
            enabled: "Par entreprise",
            disabled: "Par Utilisateur"
          }
        },
        AllowRegistration: {
          title: "Autoriser l'inscription",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        FileDownloadLimit: {
          title: "Limite de Téléchargement de fichiers (MB)"
        },
        messageVisibility: {
          title: "Visibilité du message",
          options: {
            respectMessageQueue: "Respecter la file d'attente du message",
            respectTicketQueue: "Respecter la file d'attente du ticket"
          }
        },
        keepQueueAndUser: {
          title:
            "Maintenir la file d'attente et l'utilisateur dans le ticket fermé",
          options: {
            enabled: "Activé",
            disabled: "Désactivé"
          }
        },
        WelcomeGreeting: {
          greetings: "Bonjour",
          welcome: "Bienvenue à",
          expirationTime: "Actif jusqu'à"
        },
        Options: {
          title: "Options"
        },
        Companies: {
          title: "Entreprises"
        },
        schedules: {
          title: "Horaires"
        },
        Plans: {
          title: "Plans"
        },
        Help: {
          title: "Aide"
        },
        Whitelabel: {
          title: "Marque blanche"
        },
        PaymentGateways: {
          title: "Passerelles de paiement"
        }
      },
      messagesList: {
        header: {
          assignedTo: "Attribué à :",
          buttons: {
            return: "Retourner",
            resolve: "Résoudre",
            reopen: "Rouvrir",
            accept: "Accepter"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Tapez un message",
        placeholderClosed:
          "Rouvrez ou acceptez ce ticket pour envoyer un message.",
        signMessage: "Signer",
        replying: "Répondre",
        editing: "Modifier"
      },
      message: {
        edited: "Modifié"
      },
      contactDrawer: {
        header: "Informations du contact",
        groupHeader: "Informations du groupe",
        buttons: {
          edit: "Modifier le contact"
        },
        extraInfo: "Autres informations",
        participants: "Participants",
        participantsUnavailable: "Impossible de charger les participants",
        you: "vous",
        admin: "Admin",
        owner: "Créateur"
      },
      ticketOptionsMenu: {
        schedule: "Planification",
        delete: "Supprimer",
        transfer: "Transférer",
        appointmentsModal: {
          title: "Observations du Service",
          textarea: "Observation",
          placeholder:
            "Insérez ici les informations que vous souhaitez enregistrer"
        },
        confirmationModal: {
          title: "Supprimer le ticket du contact",
          message: "Attention ! Tous les messages liés au ticket seront perdus."
        },
        buttons: {
          delete: "Supprimer",
          cancel: "Annuler"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Annuler"
        }
      },
      messageOptionsMenu: {
        delete: "Supprimer",
        edit: "Modifier",
        history: "Historique",
        reply: "Répondre",
        confirmationModal: {
          title: "Supprimer le message ?",
          message: "Cette action est irréversible."
        }
      },
      messageHistoryModal: {
        close: "Fermer",
        title: "Historique des modifications du message"
      },
      presence: {
        unavailable: "Indisponible",
        available: "Disponible",
        composing: "En train de taper...",
        recording: "En train d'enregistrer...",
        paused: "En pause"
      },
      privacyModal: {
        title: "Modifier la Confidentialité de WhatsApp",
        buttons: {
          cancel: "Annuler",
          okEdit: "Enregistrer"
        },
        form: {
          menu: {
            all: "Tous",
            none: "Personne",
            contacts: "Mes contacts",
            contact_blacklist: "Contacts sélectionnés",
            match_last_seen: "Similaire à Vu en dernier",
            known: "Connu",
            disable: "Désactivé",
            hrs24: "24 Heures",
            dias7: "7 Jours",
            dias90: "90 Jours"
          },
          readreceipts:
            "Pour mettre à jour la confidentialité des accusés de lecture",
          profile:
            "Pour mettre à jour la confidentialité de la photo de profil",
          status: "Pour mettre à jour la confidentialité des statuts",
          online: "Pour mettre à jour la confidentialité en ligne",
          last: "Pour mettre à jour la confidentialité du Dernier Vu",
          groupadd:
            "Pour mettre à jour la confidentialité de l'ajout aux groupes",
          calladd:
            "Pour mettre à jour la confidentialité de l'ajout aux appels",
          disappearing: "Pour mettre à jour le Mode Disparition par Défaut"
        }
      },
      frontendErrors: {
        ERR_CONFIG_ERROR:
          "Erreur de configuration. Veuillez contacter le support.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Horloge désynchronisée. Veuillez vérifier les paramètres de date et d'heure de votre appareil.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inaccessible. Veuillez réessayer plus tard.",
        ERR_BACKEND_NOT_READY:
          "Le backend démarre et n'est pas encore prêt. Nouvelle tentative automatique."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "Aucune connexion WhatsApp disponible pour ouvrir la conversation.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "Ce lead n'est plus dans votre base.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Ce lead n'a pas de téléphone pour ouvrir une conversation.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "La prospection n'est pas encore configurée sur ce serveur.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "La clé d'accès à la prospection a été refusée. Contactez le support.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "Le service de prospection n'a pas répondu. Réessayez dans quelques minutes.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "Le service de prospection a refusé cette recherche. Vérifiez la niche et la ville.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Cette recherche n'existe plus dans le service de prospection.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Indiquez la niche et la ville pour chercher des leads.",
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
          "Les jours d’essai doivent être un entier entre 0 et 3650.",
        ERR_INVALID_DUE_DAY:
          "Le jour d’échéance doit être un entier entre 1 et 31.",
        ERR_TRIAL_ALREADY_STARTED:
          "L’essai gratuit ne peut plus être modifié après le début de la facturation.",
        ERR_TASK_BOARD_INVALID_TITLE: "Saisissez un titre valide.",
        ERR_TASK_BOARD_INVALID_COLOR:
          "Saisissez une couleur hexadécimale valide.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Colonne introuvable.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Tâche introuvable.",
        ERR_TASK_BOARD_INVALID_DATE: "Saisissez une date valide.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "La plage de dates est invalide.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "Le tableau doit avoir une colonne de tâches terminées.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER:
          "L’ordre des colonnes est invalide.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Choisissez une autre colonne terminée avant de supprimer celle-ci.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Déplacez les tâches de cette colonne avant de la supprimer.",
        ERR_EMAIL_NOT_FOUND: "Nous n'avons pas trouvé cet email.",
        ERR_COMPANY_SUSPENDED:
          "Ce compte est suspendu. Contactez le responsable de votre abonnement.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Ce compte possède déjà un mot de passe. Revenez à la connexion.",
        ERR_ACTIVATION_INVALID:
          "Ce lien d'activation est invalide ou a expiré.",
        ERR_PASSWORD_CONFIRMATION: "Les mots de passe ne correspondent pas.",
        ERR_PASSWORD_TOO_WEAK:
          "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
        ERR_NO_OTHER_WHATSAPP:
          "Il doit y avoir au moins un WhatsApp par défaut.",
        ERR_NO_DEF_WAPP_FOUND:
          "Aucun WhatsApp par défaut trouvé. Vérifiez la page des connexions.",
        ERR_WAPP_NOT_INITIALIZED:
          "Cette session WhatsApp n'a pas été initialisée. Vérifiez la page des connexions.",
        ERR_WAPP_CHECK_CONTACT:
          "Impossible de vérifier le contact WhatsApp. Vérifiez la page des connexions",
        ERR_WAPP_INVALID_CONTACT: "Ce n'est pas un numéro WhatsApp valide.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Impossible de télécharger les médias de WhatsApp. Vérifiez la page des connexions.",
        ERR_INVALID_CREDENTIALS:
          "Erreur d'authentification. Veuillez réessayer.",
        ERR_SENDING_WAPP_MSG:
          "Erreur lors de l'envoi du message WhatsApp. Vérifiez la page des connexions.",
        ERR_DELETE_WAPP_MSG: "Impossible de supprimer le message WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Impossible de modifier le message WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Il y a déjà un ticket ouvert pour ce contact.",
        ERR_QUEUE_INVALID_CONNECTION:
          "Une connexion sélectionnée n'appartient pas à cette entreprise.",
        ERR_WAPP_INVALID_QUEUE:
          "Une file sélectionnée n'appartient pas à cette entreprise.",
        ERR_TICKET_INVALID_CONNECTION:
          "La connexion sélectionnée n'est pas compatible avec ce ticket.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "Un ticket de groupe ne peut pas changer de connexion.",
        ERR_INVALID_GROUP_MODE: "Le mode de groupe sélectionné est invalide.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Sélectionnez au moins une file autorisée pour le groupe.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED:
          "Sélectionnez une file de prise en charge autorisée.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "Ce groupe est en mode conversation et n'accepte pas les actions de prise en charge.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED:
          "La connexion de destination doit être connectée.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Sélectionnez une file lors du changement de connexion.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "Cette file n'est pas liée à la connexion sélectionnée.",
        ERR_SESSION_EXPIRED: "Session expirée. Veuillez vous reconnecter.",
        ERR_USER_CREATION_DISABLED:
          "La création d'utilisateur a été désactivée par l'administrateur.",
        ERR_NO_PERMISSION:
          "Vous n'avez pas la permission d'accéder à cette fonctionnalité.",
        ERR_DUPLICATED_CONTACT: "Il existe déjà un contact avec ce numéro.",
        ERR_NO_SETTING_FOUND: "Aucun paramètre trouvé avec cet ID.",
        ERR_NO_CONTACT_FOUND: "Aucun contact trouvé avec cet ID.",
        ERR_NO_TICKET_FOUND: "Aucun ticket trouvé avec cet ID.",
        ERR_NO_USER_FOUND: "Aucun utilisateur trouvé avec cet ID.",
        ERR_NO_WAPP_FOUND: "Aucun WhatsApp trouvé avec cet ID.",
        ERR_CREATING_MESSAGE:
          "Erreur lors de la création du message dans la base de données.",
        ERR_CREATING_TICKET:
          "Erreur lors de la création du ticket dans la base de données.",
        ERR_FETCH_WAPP_MSG:
          "Erreur lors de la récupération du message sur WhatsApp, il est peut-être trop ancien.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Cette couleur est déjà utilisée, choisissez-en une autre.",
        ERR_WAPP_GREETING_REQUIRED:
          "Le message de bienvenue est obligatoire lorsqu'il y a plus d'une file d'attente."
      },
      ticketz: {
        registration: {
          header: "Inscrivez-vous à la base d'utilisateurs de Espaço Whats",
          description:
            "Remplissez les champs ci-dessous pour vous inscrire à la base d'utilisateurs de Espaço Whats et recevoir des nouvelles sur le projet.",
          name: "Nom",
          country: "Pays",
          phoneNumber: "Numéro WhatsApp",
          submit: "S'inscrire"
        },
        proAd: {
          imageAlt: "Capture d'écran Espaço Whats PRO",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "WhatsApp officiel - Instagram - Messenger et plus",
            exclusiveFeatures: "Fonctionnalités exclusives",
            advancedSupport: "Support avancé",
            easyMigration: "Migration facilitée"
          },
          subscribePrice: "Abonnez-vous pour {{monthlyPrice}}/mois",
          subscribeSubtitle: "directement dans le système",
          ctaUpgrade: "Cliquez pour les instructions de mise à niveau",
          ctaVisitSite: "Cliquez pour visiter le site",
          instructions: {
            title: "Instructions de mise à niveau",
            stepIntro:
              "Si vous avez installé les images fournies par le projet sur un serveur ou un VPS à l'aide des instructions simplifiées, il vous suffit d'accéder à votre serveur et d'exécuter la commande ci-dessous :",
            stepInstall:
              'Dans quelques instants, Espaço Whats PRO sera installé avec toutes vos données ; ensuite, allez dans le menu utilisateur, cliquez sur "Abonnement Espaço Whats PRO" et finalisez votre abonnement.',
            helpPrefix:
              "Si votre installation est différente ou si vous pensez avoir besoin d'aide pour installer Espaço Whats PRO, ",
            helpLink: "contactez-nous",
            helpSuffix: " et nous vous aiderons !"
          }
        },
        support: {
          title: "Soutenez le projet Espaço Whats Open Source",
          mercadopagotitle: "Carte de Crédit",
          recurringbrl: "Don récurrent en R$",
          paypaltitle: "Carte de Crédit",
          international: "International en US$"
        }
      }
    }
  }
};

export { messages };
