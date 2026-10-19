const messages = {
  de: {
    translations: {
      visual: {
        visualizar: "Ansehen",
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
          "Ende des Ablaufs. Das Ticket steht dem Support-Team zur Verfügung.",
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
        settingsTab: "Experimentelle Anrufe",
        companySwitch: "Experimentelle Anrufe",
        enabled: "Aktiviert",
        disabled: "Deaktiviert",
        experimentalTitle: "Experimentelle Anrufintegration",
        warning:
          "Inoffizielle WhatsApp-Integration. Es besteht das Risiko einer Trennung, Sperrung oder Kontosperre. Nur im Test-Mandanten verwenden.",
        serviceUnavailable: "Der Anrufdienst ist derzeit nicht verfügbar.",
        riskConsent:
          "Ich verstehe das Risiko und möchte ein zweites Gerät per QR-Code verknüpfen.",
        status: "Status",
        disconnect: "Ausschalten und trennen",
        pair: "Mit QR-Code verknüpfen",
        noConnections: "Erstellen Sie zuerst eine WhatsApp-Verbindung.",
        qrInstruction:
          "Öffnen Sie in WhatsApp Verknüpfte Geräte und scannen Sie diesen zweiten QR-Code.",
        disconnectedSuccess: "Anrufintegration getrennt.",
        incoming: "Eingehender Anruf",
        incomingHint:
          "Der erste Mitarbeiter, der annimmt, übernimmt den Anruf.",
        reject: "Ablehnen",
        accept: "Annehmen",
        active: "Laufender Anruf",
        mute: "Mikrofon stummschalten",
        transcribe: "Anruf transkribieren",
        record: "Anruf aufzeichnen",
        end: "Beenden",
        states: {
          disconnected: "Getrennt",
          pairing: "Warten auf QR-Code",
          connecting: "Verbinden",
          open: "Verbunden",
          logged_out: "Getrennt"
        },
        errors: {
          load: "Experimentelle Anrufe konnten nicht geladen werden.",
          pair: "Der Anruf-QR-Code konnte nicht erstellt werden.",
          action: "Die Anrufaktion konnte nicht abgeschlossen werden.",
          transcriptionConfig:
            "Setzen Sie GROQ_API_KEY in der Umgebung, um die Transkription zu aktivieren.",
          microphone:
            "Der Mikrofonzugriff wurde verweigert. Der Anruf wurde beendet."
        }
      },
      common: {
        search: "Suchen",
        edit: "Bearbeiten",
        delete: "Löschen",
        cancel: "Abbrechen",
        save: "Speichern",
        you: "Sie",
        confirm: "Bestätigen",
        close: "Schließen",
        error: "Fehler",
        success: "Erfolg",
        actions: "Aktionen",
        add: "Hinzufügen",
        name: "Name",
        email: "E-Mail",
        phone: "Telefon",
        company: "Firma",
        connection: "Verbindung",
        queue: "Warteschlange",
        contact: "Kontakt",
        serverTime: "Serverzeit:",
        clientTime: "Clientzeit:",
        differenceMinutes: "Unterschied: {{count}} Minute(n)"
      },
      signup: {
        title: "Registrieren",
        toasts: {
          success: "Benutzer erfolgreich erstellt! Bitte einloggen!!!",
          fail: "Fehler beim Erstellen des Benutzers. Überprüfen Sie die angegebenen Daten."
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Passwort"
        },
        buttons: {
          submit: "Registrieren",
          login: "Haben Sie bereits ein Konto? Einloggen!"
        }
      },
      login: {
        title: "Anmelden",
        form: {
          email: "Email",
          password: "Passwort",
          newPassword: "Neues Passwort",
          confirmPassword: "Passwort bestätigen",
          passwordStrength:
            "Verwenden Sie mindestens 8 Zeichen mit Großbuchstaben, Kleinbuchstaben und einer Zahl."
        },
        buttons: {
          submit: "Einloggen",
          continue: "Weiter",
          createPassword: "Passwort erstellen und anmelden",
          changeEmail: "E-Mail ändern",
          backToLogin: "Zurück zur Anmeldung",
          register: "Noch kein Konto? Registrieren!"
        },
        errors: {
          emailNotFound: "Diese E-Mail wurde nicht gefunden.",
          passwordMismatch: "Die Passwörter stimmen nicht überein.",
          passwordStrength:
            "Das Passwort muss mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie eine Zahl enthalten.",
          activationInvalid:
            "Dieser Aktivierungslink ist ungültig oder abgelaufen."
        },
        activation: {
          title: "Passwort erstellen",
          account: "Konto {{email}} wird aktiviert"
        }
      },
      companies: {
        title: "Unternehmen registrieren",
        form: {
          name: "Name des Unternehmens",
          plan: "Plan",
          token: "Token",
          submit: "Registrieren",
          success: "Unternehmen erfolgreich erstellt!"
        }
      },
      auth: {
        toasts: {
          success: "Erfolgreich eingeloggt!"
        },
        token: "Token"
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Heutige Interaktionen: "
          }
        },
        blog: {
          title: "Espaço Whats-Blog",
          loading: "Lade Blogbeitraege...",
          error: "Blogbeitraege konnten nicht geladen werden.",
          empty: "Keine Blogbeitraege gefunden.",
          showAll: "Alle Beitraege anzeigen",
          showLess: "Weniger anzeigen",
          openPost: "Beitrag lesen",
          previous: "Vorheriger Beitrag",
          next: "Naechster Beitrag"
        }
      },
      connections: {
        title: "Verbindungen",
        toasts: {
          deleted: "Verbindung mit WhatsApp erfolgreich gelöscht!"
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage:
            "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.",
          disconnectTitle: "Trennen",
          disconnectMessage:
            "Sind Sie sicher? Sie müssen den QR-Code erneut scannen."
        },
        buttons: {
          add: "WhatsApp hinzufügen",
          disconnect: "Trennen",
          tryAgain: "Erneut versuchen",
          qrcode: "QR CODE",
          newQr: "Neuer QR CODE",
          connecting: "Verbinden"
        },
        toolTips: {
          disconnected: {
            title: "Fehler beim Starten der WhatsApp-Sitzung",
            content:
              "Stellen Sie sicher, dass Ihr Telefon mit dem Internet verbunden ist, und versuchen Sie es erneut, oder fordern Sie einen neuen QR-Code an"
          },
          qrcode: {
            title: "Warten auf QR-Code-Scan",
            content:
              "Klicken Sie auf die Schaltfläche 'QR CODE' und scannen Sie den QR-Code mit Ihrem Telefon, um die Sitzung zu starten"
          },
          connected: {
            title: "Verbindung hergestellt!"
          },
          timeout: {
            title: "Verbindung zum Telefon verloren",
            content:
              "Stellen Sie sicher, dass Ihr Telefon mit dem Internet verbunden ist und WhatsApp geöffnet ist, oder klicken Sie auf die Schaltfläche 'Trennen', um einen neuen QR-Code zu erhalten"
          },
          passkey: {
            title: "Passkey authentication required",
            content:
              "Click the passkey button and use the browser extension to capture the authenticated WhatsApp Web session."
          },
          resetPasskey: "Passkey-Sitzung zurücksetzen"
        },
        table: {
          contact: "Kontakt",
          name: "Name",
          status: "Status",
          lastUpdate: "Letztes Update",
          default: "Standard",
          actions: "Aktionen",
          session: "Sitzung"
        }
      },
      internalChat: {
        title: "Interner Chat"
      },
      whatsappGroups: {
        configure: "Gruppe konfigurieren",
        mode: "Gruppenmodus",
        conversation: "Unterhaltung",
        attendance: "Betreuung",
        allowedQueues: "Berechtigte Warteschlangen",
        serviceQueue: "Service-Warteschlange",
        cancel: "Abbrechen",
        save: "Speichern",
        confirmConversation:
          "Diese Gruppe aus dem Betreuungsvorgang entfernen? Die aktive Betreuung wird ohne Bewertung beendet."
      },
      whatsappModal: {
        title: {
          add: "WhatsApp hinzufügen",
          edit: "WhatsApp bearbeiten"
        },
        form: {
          name: "Name",
          default: "Standard"
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen"
        },
        success: "WhatsApp erfolgreich gespeichert."
      },
      qrCode: {
        message: "Scannen Sie den QR-Code, um die Sitzung zu starten",
        extensionHint: "Über WhatsApp Web authentifizieren",
        startCapture: "WhatsApp Web-Sitzung erfassen",
        installExtension: "Capture-Erweiterung installieren"
      },
      passkeyModal: {
        title: "WhatsApp Web Capture-Erweiterung",
        instructions:
          "Use the browser extension to capture the authenticated WhatsApp Web session and send it to the server.",
        connectorNotFound:
          "Extension not detected. Install the passkey capture extension and reload the page.",
        connectorReady:
          "Erweiterung erkannt. Klicken Sie unten, um sich über WhatsApp Web zu authentifizieren.",
        startCapture: "Start Capture",
        waitingForCapture: "Waiting for WhatsApp Web session capture…",
        existingSession: "WhatsApp Web already has a session for {{number}}.",
        captureExisting: "Capture this session",
        clearAndContinue: "Clear local session and continue",
        importSent: "Session captured and sent successfully.",
        importError: "Capture failed: {{reason}}.",
        missingToken: "Capture token is missing. Please reload the page.",
        downloadExtension: "Capture-Erweiterung herunterladen",
        installInstructions: "Installation",
        hideInstructions: "Anleitung ausblenden",
        instructionsIntro:
          "Folgen Sie den unten stehenden Schritten, um die Erweiterung zu " +
          "installieren:",
        installStep1: "Laden Sie die ZIP-Datei der Erweiterung herunter.",
        installStep2:
          "Entpacken Sie die ZIP-Datei in einen Ordner auf Ihrem Computer.",
        installStep3:
          "Öffnen Sie Google Chrome und rufen Sie chrome://extensions/ auf.",
        installStep4:
          "Aktivieren Sie den Entwicklermodus über den Schalter oben rechts.",
        installStep5: 'Klicken Sie auf "Entpackte Erweiterung laden".',
        installStep6:
          "Wählen Sie den entpackten Ordner mit den Erweiterungsdateien aus.",
        installStep7:
          "Die Erweiterung ist jetzt installiert und einsatzbereit.",
        installStep8:
          "Aktualisieren Sie diese Seite mit F5 und versuchen Sie erneut zu verbinden."
      },
      contacts: {
        title: "Kontakte",
        toasts: {
          deleted: "Kontakt erfolgreich gelöscht!"
        },
        searchPlaceholder: "Suchen...",
        confirmationModal: {
          deleteTitle: "Löschen",
          importTitlte: "Kontakte importieren",
          deleteMessage:
            "Sind Sie sicher, dass Sie diesen Kontakt löschen möchten? Alle zugehörigen Interaktionen gehen verloren.",
          importMessage: "Möchten Sie alle Kontakte vom Telefon importieren?"
        },
        buttons: {
          import: "Kontakte importieren",
          add: "Kontakt hinzufügen"
        },
        table: {
          name: "Name",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Aktionen"
        }
      },
      contactModal: {
        title: {
          add: "Kontakt hinzufügen",
          edit: "Kontakt bearbeiten"
        },
        form: {
          mainInfo: "Kontaktdaten",
          extraInfo: "Zusätzliche Informationen",
          name: "Name",
          number: "WhatsApp-Nummer",
          email: "Email",
          extraName: "Feldname",
          extraValue: "Wert",
          disableBot: "Chatbot deaktivieren"
        },
        buttons: {
          addExtraInfo: "Information hinzufügen",
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen"
        },
        success: "Kontakt erfolgreich gespeichert."
      },
      queueModal: {
        title: {
          add: "Warteschlange hinzufügen",
          edit: "Warteschlange bearbeiten"
        },
        form: {
          name: "Name",
          color: "Farbe",
          greetingMessage: "Begrüßungsnachricht",
          complationMessage: "Abschlussnachricht",
          outOfHoursMessage: "Nachricht außerhalb der Geschäftszeiten",
          ratingMessage: "Bewertungsnachricht",
          transferMessage: "Übertragungsnachricht",
          connections: "WhatsApp-Verbindungen",
          connectionsHelp:
            "Warteschlange und Chatbot werden nur in diesen Verbindungen angeboten.",
          token: "Token"
        },
        validation: {
          connectionRequired:
            "Wählen Sie mindestens eine Verbindung für die Warteschlange."
        },
        toasts: {
          saved: "Warteschlange erfolgreich gespeichert"
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen",
          attach: "Datei anhängen"
        },
        serviceHours: {
          dayWeek: "Wochentag",
          startTimeA: "Startzeit - Schicht A",
          endTimeA: "Endzeit - Schicht A",
          startTimeB: "Startzeit - Schicht B",
          endTimeB: "Endzeit - Schicht B",
          monday: "Montag",
          tuesday: "Dienstag",
          wednesday: "Mittwoch",
          thursday: "Donnerstag",
          friday: "Freitag",
          saturday: "Samstag",
          sunday: "Sonntag"
        }
      },
      userModal: {
        title: {
          add: "Benutzer hinzufügen",
          edit: "Benutzer bearbeiten"
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Passwort",
          profile: "Profil"
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen"
        },
        success: "Benutzer erfolgreich gespeichert."
      },
      scheduleModal: {
        title: {
          add: "Neue Planung",
          edit: "Planung bearbeiten"
        },
        form: {
          body: "Nachricht",
          contact: "Kontakt",
          sendAt: "Planungsdatum",
          sentAt: "Sendedatum",
          saveMessage: "Nachricht im Ticket speichern"
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen"
        },
        success: "Planung erfolgreich gespeichert."
      },
      tagModal: {
        title: {
          add: "Neues Tag",
          edit: "Tag bearbeiten",
          addKanban: "Neue Lane",
          editKanban: "Lane bearbeiten"
        },
        form: {
          name: "Name",
          color: "Farbe",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen"
        },
        success: "Tag erfolgreich gespeichert.",
        successKanban: "Lane erfolgreich gespeichert."
      },
      chat: {
        noTicketMessage: "Wählen Sie ein Ticket, um zu chatten."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "DATEIEN HIERHIN ZIEHEN UND ABLEGEN",
          titleFileList: "Dateiliste"
        }
      },
      billing: {
        trialDays: "Kostenlose Testtage",
        trialDaysHelp: "0 bedeutet keine kostenlose Testphase",
        dueDay: "Fälligkeitstag",
        dueDayHelp: "Monatlich; kurze Monate nutzen den letzten Tag",
        prorata: "Anteilig",
        trialEndsIn: "Ihre Testphase endet in {{days}} Tagen.",
        noActiveTrial: "Keine aktive Testphase",
        period: "Zeitraum: {{start}} bis {{end}}"
      },
      todolist: {
        title: "Aufgabenboard",
        loading: "Board wird geladen...",
        loadError: "Das Board konnte nicht geladen werden.",
        emptyColumn: "Ziehen Sie eine Aufgabe in diese Spalte",
        dragTask: "Aufgabe verschieben",
        dragTaskLabel: "Aufgabe {{title}} verschieben",
        completedAt: "Abgeschlossen am {{date}}",
        editTaskTitle: "Aufgabe bearbeiten",
        newTaskTitle: "Neue Aufgabe",
        targets: { global: "Global", user: "Benutzer", queue: "Warteschlange" },
        deadline: {
          ok: "Im Zeitplan",
          warning: "Bald fällig",
          overdue: "Überfällig"
        },
        details: {
          noDescription: "Keine Beschreibung",
          state: "Status",
          createdBy: "Erstellt von",
          target: "Ziel",
          createdAt: "Erstellt",
          dueAt: "Fällig",
          completedAt: "Abgeschlossen",
          history: "Verlauf"
        },
        events: {
          CREATED: "Erstellt",
          EDITED: "Bearbeitet",
          MOVED: "Verschoben",
          COMPLETED: "Abgeschlossen",
          REOPENED: "Wieder geöffnet"
        },
        form: {
          name: "Aufgabenname",
          columnName: "Spaltenname",
          description: "Beschreibung",
          targetType: "Ziel",
          assignee: "Zugewiesener Benutzer",
          queue: "Zugewiesene Warteschlange",
          dueAt: "Fällig"
        },
        buttons: {
          add: "Hinzufügen",
          newTask: "Neue Aufgabe",
          save: "Speichern",
          configure: "Spalten konfigurieren",
          clearFilter: "Filter löschen",
          tryAgain: "Erneut versuchen",
          editTask: "Aufgabe bearbeiten",
          deleteTask: "Aufgabe löschen",
          addColumn: "Spalte hinzufügen"
        },
        filters: {
          from: "Abgeschlossen von",
          to: "Abgeschlossen bis",
          invalidDate: "Ungültiges Datum"
        },
        settings: {
          title: "Spalten konfigurieren",
          description:
            "Reihenfolge, Namen und Farben anpassen. Nur eine Spalte steht für abgeschlossene Aufgaben.",
          markDone: "{{title}} als abgeschlossene Spalte markieren",
          doneColumn: "Spalte für abgeschlossene Aufgaben",
          regularColumn: "Spalte für laufende Aufgaben",
          moveLeft: "Nach links verschieben",
          moveRight: "Nach rechts verschieben",
          editColumn: "Spalte bearbeiten",
          newColumn: "Neue Spalte",
          chooseColor: "Farbe auswählen",
          useBrandColor: "Unternehmensfarbe verwenden"
        },
        confirm: {
          deleteTaskTitle: "Aufgabe löschen",
          deleteTask: "Aufgabe „{{title}}“ löschen?",
          deleteColumnTitle: "Spalte löschen",
          deleteColumn: "Spalte „{{title}}“ löschen?"
        },
        toasts: {
          taskCreated: "Aufgabe erstellt.",
          taskSaved: "Aufgabe aktualisiert.",
          taskDeleted: "Aufgabe gelöscht.",
          columnSaved: "Spalte gespeichert.",
          columnDeleted: "Spalte gelöscht.",
          doneColumnChanged: "Abgeschlossene Spalte aktualisiert."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Neu"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Warteschlangen"
      },
      tickets: {
        toasts: {
          deleted: "Das von Ihnen verwaltete Ticket wurde gelöscht."
        },
        notification: {
          message: "Nachricht von",
          nomessages: "Keine Nachricht"
        },
        tabs: {
          open: { title: "Offen" },
          closed: { title: "Gelöst" },
          groups: {
            title: "Gruppen",
            conversations: "Unterhaltungen",
            attendances: "Betreuungen",
            pending: "Ausstehend",
            open: "In Bearbeitung",
            closed: "Abgeschlossen"
          },
          search: { title: "Suche" }
        },
        search: {
          placeholder: "Tickets und Nachrichten suchen"
        },
        buttons: {
          showAll: "Alle"
        }
      },
      transferTicketModal: {
        title: "Ticket übertragen",
        fieldLabel: "Benutzer suchen",
        fieldConnectionLabel: "Über Verbindung übertragen",
        fieldConnectionPlaceholder: "Verbindung auswählen",
        connectionHelp:
          "Wählen Sie danach eine verfügbare Warteschlange der Verbindung.",
        connectionUnavailable: "getrennt",
        fieldQueueLabel: "In Warteschlange übertragen",
        fieldQueuePlaceholder: "Wählen Sie eine Warteschlange",
        noOptions: "Kein Benutzer mit diesem Namen gefunden",
        buttons: {
          ok: "Übertragen",
          cancel: "Abbrechen"
        }
      },
      ticketsList: {
        pendingHeader: "Wartend",
        assignedHeader: "In Bearbeitung",
        noTicketsTitle: "Nichts hier!",
        noTicketsMessage:
          "Keine Tickets mit diesem Status oder Suchbegriff gefunden",
        buttons: {
          accept: "Akzeptieren"
        }
      },
      newTicketModal: {
        title: "Ticket erstellen",
        fieldLabel: "Kontakt suchen",
        add: "Hinzufügen",
        buttons: {
          ok: "Speichern",
          cancel: "Abbrechen"
        }
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Verbindungen",
          tickets: "Tickets",
          quickMessages: "Schnellantworten",
          contacts: "Kontakte",
          queues: "Warteschlangen & Chatbot",
          tags: "Tags",
          administration: "Verwaltung",
          service: "Service",
          users: "Benutzer",
          settings: "Einstellungen",
          helps: "Hilfe",
          chatgpt: "ChatGPT",
          schedules: "Planungen",
          campaigns: "Kampagnen",
          annoucements: "Ankündigungen",
          chats: "Interner Chat",
          financeiro: "Finanzen",
          cobranca: "Billing",
          prospeccao: "Akquise",
          logout: "Abmelden",
          management: "Management",
          kanban: "Kanban",
          tasks: "Aufgaben"
        },
        appBar: {
          i18n: {
            language: "Deutsch",
            language_short: "DE"
          },
          user: {
            profile: "Profil",
            subscriptionValidUntilLabel: "Abo gueltig bis",
            darkmode: "Dunkelmodus",
            lightmode: "Hellmodus",
            language: "Sprache auswählen",
            about: "Über",
            logout: "Abmelden"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Pilot aktiviert",
        disabled: "Pilot deaktiviert",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Empfohlen",
          description:
            "Der einfachste Weg, Ihre Kundendienstdaten in ChatGPT zu verwenden.",
          details:
            "Installieren Sie das Plugin, verbinden Sie Ihr Espaço-Whats-Konto über OAuth und verwenden Sie es im Plugin-Menü oder mit @EspaçoWhats.",
          open: "Plugin in ChatGPT öffnen",
          steps: {
            title: "Installation und Verbindung",
            open: "Öffnen Sie das Espaço-Whats-Plugin in ChatGPT",
            install: "Klicken Sie auf Plugin installieren",
            connect: "Wählen Sie Verbinden",
            login: "Mit Tenant, Admin-E-Mail und Passwort anmelden",
            use: "Plugin-Menü verwenden oder @EspaçoWhats erwähnen"
          },
          marketplace: {
            title: "GitHub-Installation für Workspaces",
            description:
              "Administratoren können den offiziellen Marketplace auch unter Workspace-Einstellungen → Plugins → Hinzufügen → Marketplace importieren einbinden.",
            repository: "Repository",
            path: "Pfad",
            pathValue: "Leer lassen",
            branch: "Branch",
            copy: "Repository kopieren"
          }
        },
        warningTitle: "Personenbezogene und klinische Daten",
        warning:
          "Nach der Verbindung können identifizierbare Gespräche und mögliche klinische Daten entsprechend Ihren Fragen an ChatGPT übertragen werden. Nur nach rechtlicher und administrativer Freigabe verwenden.",
        copy: "URL kopieren",
        connection: {
          title: "MCP-Server-URL",
          description:
            "Espaço Whats verwendet keinen OpenAI-Schlüssel. Intelligenz und Limits gehören zum ChatGPT-Plan des Benutzers."
        },
        steps: {
          title: "Verbindung herstellen",
          open: "ChatGPT Developer Mode öffnen",
          create: "Eine Draft-MCP-Integration erstellen",
          url: "MCP-URL einfügen",
          oauth: "OAuth auswählen",
          login: "Mit Tenant, Admin-E-Mail und Passwort anmelden"
        },
        connections: {
          title: "Aktive Verbindungen",
          empty: "Keine ChatGPT-Verbindung.",
          client: "Client",
          admin: "Administrator",
          created: "Erstellt",
          lastUse: "Letzte Nutzung",
          revoke: "Widerrufen",
          revokeAll: "Alle widerrufen"
        },
        revoke: {
          title: "Verbindung widerrufen",
          one: "Diese Verbindung verliert sofort den Zugriff.",
          all: "Alle Verbindungen dieses Tenants verlieren sofort den Zugriff."
        },
        toasts: {
          copied: "MCP-URL kopiert.",
          repositoryCopied: "Plugin-Repository kopiert.",
          revoked: "Verbindung widerrufen."
        }
      },
      notifications: {
        noTickets: "Keine Benachrichtigungen."
      },
      quickMessages: {
        title: "Schnellantworten",
        buttons: {
          add: "Neue Antwort"
        },
        dialog: {
          shortcode: "Abkürzung",
          message: "Antwort"
        }
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Suche",
        subMenus: {
          list: "Tafel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Offen",
        confirmationModal: {
          deleteTitle: "Sind Sie sicher, dass Sie diese Lane löschen möchten?",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden."
        },
        table: {
          name: "Name",
          color: "Farbe",
          tickets: "Tickets",
          actions: "Aktionen"
        },
        buttons: {
          add: "Neue Lane"
        },
        toasts: {
          deleted: "Lane erfolgreich gelöscht."
        }
      },
      contactLists: {
        title: "Kontaktlisten",
        table: {
          name: "Name",
          contacts: "Kontakte",
          actions: "Aktionen"
        },
        buttons: {
          add: "Neue Liste"
        },
        dialog: {
          name: "Name",
          company: "Unternehmen",
          okEdit: "Bearbeiten",
          okAdd: "Hinzufügen",
          add: "Hinzufügen",
          edit: "Bearbeiten",
          cancel: "Abbrechen"
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden."
        },
        toasts: {
          deleted: "Eintrag gelöscht",
          created: "Eintrag erstellt"
        }
      },
      contactListItems: {
        title: "Kontakte",
        searchPlaceholder: "Suche",
        buttons: {
          add: "Neu",
          lists: "Listen",
          import: "Importieren"
        },
        dialog: {
          name: "Name",
          number: "Nummer",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Bearbeiten",
          okAdd: "Hinzufügen",
          add: "Hinzufügen",
          edit: "Bearbeiten",
          cancel: "Abbrechen"
        },
        table: {
          name: "Name",
          number: "Nummer",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Aktionen"
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
          importMessage:
            "Möchten Sie die Kontakte aus dieser Tabelle importieren?",
          importTitlte: "Importieren"
        },
        toasts: {
          deleted: "Eintrag gelöscht"
        }
      },
      campaigns: {
        title: "Kampagnen",
        searchPlaceholder: "Suche",
        buttons: {
          add: "Neue Kampagne",
          contactLists: "Kontaktlisten"
        },
        table: {
          name: "Name",
          whatsapp: "Verbindung",
          contactList: "Kontaktliste",
          status: "Status",
          scheduledAt: "Planung",
          completedAt: "Abgeschlossen",
          confirmation: "Bestätigung",
          actions: "Aktionen"
        },
        dialog: {
          new: "Neue Kampagne",
          update: "Kampagne bearbeiten",
          readonly: "Nur Lesen",
          form: {
            name: "Name",
            message1: "Nachricht 1",
            message2: "Nachricht 2",
            message3: "Nachricht 3",
            message4: "Nachricht 4",
            message5: "Nachricht 5",
            confirmationMessage1: "Bestätigungsnachricht 1",
            confirmationMessage2: "Bestätigungsnachricht 2",
            confirmationMessage3: "Bestätigungsnachricht 3",
            confirmationMessage4: "Bestätigungsnachricht 4",
            confirmationMessage5: "Bestätigungsnachricht 5",
            messagePlaceholder: "Nachrichteninhalt",
            whatsapp: "Verbindung",
            status: "Status",
            scheduledAt: "Planung",
            confirmation: "Bestätigung",
            contactList: "Kontaktliste"
          },
          buttons: {
            add: "Hinzufügen",
            edit: "Aktualisieren",
            okadd: "Ok",
            cancel: "Sendungen abbrechen",
            restart: "Sendungen neu starten",
            close: "Schließen",
            attach: "Datei anhängen"
          }
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden."
        },
        toasts: {
          success: "Operation erfolgreich",
          cancel: "Kampagne abgebrochen",
          restart: "Kampagne neu gestartet",
          deleted: "Eintrag gelöscht"
        }
      },
      announcements: {
        title: "Ankündigungen",
        searchPlaceholder: "Suche",
        buttons: {
          add: "Neue Ankündigung",
          contactLists: "Ankündigungslisten"
        },
        table: {
          priority: "Priorität",
          title: "Titel",
          text: "Text",
          mediaName: "Datei",
          status: "Status",
          actions: "Aktionen"
        },
        dialog: {
          edit: "Ankündigung bearbeiten",
          add: "Neue Ankündigung",
          update: "Ankündigung aktualisieren",
          readonly: "Nur Lesen",
          form: {
            priority: "Priorität",
            title: "Titel",
            text: "Text",
            mediaPath: "Datei",
            status: "Status"
          },
          buttons: {
            add: "Hinzufügen",
            edit: "Aktualisieren",
            okadd: "Ok",
            cancel: "Abbrechen",
            close: "Schließen",
            attach: "Datei anhängen"
          }
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden."
        },
        toasts: {
          success: "Operation erfolgreich",
          deleted: "Eintrag gelöscht"
        }
      },
      campaignsConfig: {
        title: "Kampagnenkonfigurationen"
      },
      queues: {
        title: "Warteschlangen & Chatbot",
        table: {
          name: "Name",
          color: "Farbe",
          greeting: "Begrüßungsnachricht",
          actions: "Aktionen"
        },
        toasts: {
          deleted: "Warteschlange erfolgreich entfernt"
        },
        buttons: {
          add: "Warteschlange hinzufügen"
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage:
            "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden! Die Interaktionen dieser Warteschlange bleiben bestehen, haben jedoch keine zugewiesene Warteschlange mehr."
        }
      },
      queueSelect: {
        inputLabel: "Warteschlangen"
      },
      users: {
        title: "Benutzer",
        empty: "Keine Benutzer gefunden.",
        filters: {
          queue: "Warteschlange",
          allQueues: "Alle Warteschlangen"
        },
        profiles: {
          admin: "Administrator",
          user: "Benutzer"
        },
        groups: {
          admin: "Administratoren",
          user: "Benutzer"
        },
        table: {
          name: "Name",
          email: "Email",
          profile: "Profil",
          queues: "Warteschlangen",
          noQueues: "Keine Warteschlangen",
          actions: "Aktionen"
        },
        buttons: {
          add: "Benutzer hinzufügen"
        },
        toasts: {
          deleted: "Benutzer erfolgreich gelöscht."
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage:
            "Alle Benutzerdaten gehen verloren. Die offenen Tickets dieses Benutzers werden in die Warteschlange verschoben."
        }
      },
      helps: {
        title: "Hilfezentrum",
        adminOnly: "Nur Administratoren",
        groupModal: {
          adminOnlyHelper:
            "Diese Karte und alle Inhalte sind für normale Benutzer ausgeblendet."
        },
        contentModal: {
          adminOnly: "Nur für Administratoren sichtbar"
        }
      },
      about: {
        aboutthe: "Über",
        copyright: "© 2024 - Betrieben mit Espaço Whats",
        buttonclose: "Schließen",
        title: "Über Espaço Whats",
        abouttitle: "Ursprung und Verbesserungen",
        aboutdetail:
          "Espaço Whats ist indirekt vom Whaticket-Projekt abgeleitet, mit Verbesserungen, die von den Entwicklern des EquipeChat-Systems über den YouTube-Kanal VemFazer geteilt wurden, und später von Claudemir Todo Bom verbessert wurden",
        aboutauthorsite: "Website des Autors",
        aboutwhaticketsite: "Website der Whaticket-Community auf Github",
        aboutvemfazersite: "Website des Vem Fazer-Kanals auf Github",
        licenseheading: "Open-Source-Lizenz",
        licensedetail:
          "Espaço Whats ist unter der GNU Affero General Public License Version 3 lizenziert, was bedeutet, dass jeder Benutzer, der Zugriff auf diese Anwendung hat, das Recht hat, auf den Quellcode zuzugreifen. Weitere Informationen finden Sie in den folgenden Links:",
        licensefulltext: "Vollständiger Lizenztext",
        licensesourcecode: "Quellcode von Espaço Whats"
      },
      schedules: {
        title: "Planungen",
        confirmationModal: {
          deleteTitle:
            "Sind Sie sicher, dass Sie diese Planung löschen möchten?",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden."
        },
        table: {
          contact: "Kontakt",
          body: "Nachricht",
          sendAt: "Planungsdatum",
          sentAt: "Sendedatum",
          status: "Status",
          actions: "Aktionen"
        },
        buttons: {
          add: "Neue Planung"
        },
        toasts: {
          deleted: "Planung erfolgreich gelöscht."
        }
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Sind Sie sicher, dass Sie dieses Tag löschen möchten?",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden."
        },
        table: {
          name: "Name",
          color: "Farbe",
          tickets: "Einträge",
          actions: "Aktionen",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Neues Tag"
        },
        toasts: {
          deleted: "Tag erfolgreich gelöscht."
        }
      },
      whitelabel: {
        primaryColorLight: "Primarfarbe hell",
        primaryColorDark: "Primarfarbe dunkel",
        lightLogo: "Helles App-Logo",
        darkLogo: "Dunkles App-Logo",
        favicon: "App-Favicon",
        appname: "App-Name",
        logoHint: "Bevorzugen Sie SVG und ein Seitenverhältnis von 28:10",
        faviconHint:
          "Bevorzugen Sie ein quadratisches SVG-Bild oder 512x512 PNG",
        loginLinks: "Login-Links",
        loginLinksHint:
          "Fügen Sie Titel- und URL-Paare hinzu, die unter dem Login-Bereich auf Desktop und Mobilgeräten angezeigt werden.",
        linkTitle: "Linktitel",
        linkUrl: "Link-URL",
        removeLink: "Link entfernen",
        sidePanelImage: "Seitliches Login-Bild",
        sidePanelImageHint:
          "Wird im Seitenbereich der Anmeldung auf Desktop-Bildschirmen angezeigt.",
        backgroundContent: "Login-Hintergrundinhalt",
        backgroundContentHint:
          "Unterstützt Bilder, SVG-Dateien und MP4-Videos für den Hintergrund des Login-Bildschirms.",
        noFileSelected: "Noch keine Datei ausgewählt.",
        buildExtension: "WA Session Capture-Erweiterung erstellen",
        buildingExtension: "Erweiterung wird erstellt…",
        downloadExtension: "Erweiterung herunterladen",
        extensionHint:
          "Erstellt eine whitelabel Chrome-Erweiterung. Die heruntergeladene ZIP enthält bereits die Erweiterungsdateien: Entpacken Sie sie und laden Sie den entpackten Ordner als entpackte Erweiterung.",
        extensionBuildStarted:
          "Erweiterungs-Build gestartet. Sie werden benachrichtigt, sobald er fertig ist.",
        extensionBuildFailed:
          "Der Erweiterungs-Build konnte nicht gestartet werden.",
        extensionBuilt: "Erweiterung erfolgreich erstellt.",
        extensionBuildUnknownError: "Unbekannter Build-Fehler."
      },
      settings: {
        group: {
          general: "Allgemein",
          timeouts: "Zeitüberschreitungen",
          officeHours: "Bürozeiten",
          groups: "Gruppen",
          confidenciality: "Vertraulichkeit",
          api: "API",
          serveradmin: "Serververwaltung"
        },
        success: "Einstellungen erfolgreich gespeichert.",
        title: "Einstellungen",
        settings: {
          userCreation: {
            name: "Benutzererstellung",
            options: {
              enabled: "Aktiviert",
              disabled: "Deaktiviert"
            }
          }
        },
        validations: {
          title: "Bewertungen",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        OfficeManagement: {
          title: "Bürozeitenverwaltung",
          options: {
            disabled: "Deaktiviert",
            ManagementByDepartment: "Verwaltung nach Warteschlange",
            ManagementByCompany: "Verwaltung nach Unternehmen"
          }
        },
        outOfHoursAction: {
          title: "Aktion außerhalb der Bürozeiten",
          options: {
            pending: "Als ausstehend belassen",
            closed: "Ticket schließen"
          }
        },
        IgnoreGroupMessages: {
          title: "Gruppennachrichten ignorieren",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        soundGroupNotifications: {
          title: "Gruppentonbenachrichtigungen",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        groupsTab: {
          title: "Gruppen-Tab",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        VoiceAndVideoCalls: {
          title: "Sprach- und Videoanrufe",
          options: {
            enabled: "Ignorieren",
            disabled: "Verfügbarkeit melden"
          }
        },
        AutomaticChatbotOutput: {
          title: "Automatische Chatbot-Ausgabe",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        ShowNumericEmoticons: {
          title: "Numerische Emojis in der Warteschlange anzeigen",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        QuickMessages: {
          title: "Schnellnachrichten",
          options: {
            enabled: "Nach Unternehmen",
            disabled: "Nach Benutzer"
          }
        },
        AllowRegistration: {
          title: "Registrierung erlauben",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        FileDownloadLimit: {
          title: "Dateidownload-Limit (MB)"
        },
        messageVisibility: {
          title: "Nachrichtensichtbarkeit",
          options: {
            respectMessageQueue: "Nachrichtenwarteschlange respektieren",
            respectTicketQueue: "Ticketwarteschlange respektieren"
          }
        },
        keepQueueAndUser: {
          title:
            "Warteschlange und Benutzer im geschlossenen Ticket beibehalten",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert"
          }
        },
        WelcomeGreeting: {
          greetings: "Hallo",
          welcome: "Willkommen bei",
          expirationTime: "Aktiv bis"
        },
        Options: {
          title: "Optionen"
        },
        Companies: {
          title: "Unternehmen"
        },
        schedules: {
          title: "Zeitpläne"
        },
        Plans: {
          title: "Pläne"
        },
        Help: {
          title: "Hilfe"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Zahlungsgateways"
        }
      },
      messagesList: {
        header: {
          assignedTo: "Zugewiesen an:",
          buttons: {
            return: "Zurückkehren",
            resolve: "Lösen",
            reopen: "Wieder öffnen",
            accept: "Akzeptieren"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Nachricht eingeben",
        placeholderClosed:
          "Öffnen oder akzeptieren Sie dieses Ticket, um eine Nachricht zu senden.",
        signMessage: "Signieren",
        replying: "Antworten",
        editing: "Bearbeiten"
      },
      message: {
        edited: "Bearbeitet"
      },
      contactDrawer: {
        header: "Kontaktdaten",
        groupHeader: "Gruppeninformationen",
        buttons: {
          edit: "Kontakt bearbeiten"
        },
        extraInfo: "Weitere Informationen",
        participants: "Teilnehmer",
        participantsUnavailable: "Teilnehmer konnten nicht geladen werden",
        you: "Sie",
        admin: "Admin",
        owner: "Ersteller"
      },
      ticketOptionsMenu: {
        schedule: "Planung",
        delete: "Löschen",
        transfer: "Übertragen",
        appointmentsModal: {
          title: "Beobachtungen zum Ticket",
          textarea: "Beobachtung",
          placeholder:
            "Geben Sie hier die Informationen ein, die Sie registrieren möchten"
        },
        confirmationModal: {
          title: "Ticket des Kontakts löschen",
          message:
            "Achtung! Alle Nachrichten im Zusammenhang mit dem Ticket gehen verloren."
        },
        buttons: {
          delete: "Löschen",
          cancel: "Abbrechen"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Abbrechen"
        }
      },
      messageOptionsMenu: {
        delete: "Löschen",
        edit: "Bearbeiten",
        history: "Verlauf",
        reply: "Antworten",
        confirmationModal: {
          title: "Nachricht löschen?",
          message: "Diese Aktion kann nicht rückgängig gemacht werden."
        }
      },
      messageHistoryModal: {
        close: "Schließen",
        title: "Nachrichtenbearbeitungsverlauf"
      },
      presence: {
        unavailable: "Nicht verfügbar",
        available: "Verfügbar",
        composing: "Schreibt...",
        recording: "Nimmt auf...",
        paused: "Pausiert"
      },
      privacyModal: {
        title: "WhatsApp-Datenschutz bearbeiten",
        buttons: {
          cancel: "Abbrechen",
          okEdit: "Speichern"
        },
        form: {
          menu: {
            all: "Alle",
            none: "Niemand",
            contacts: "Meine Kontakte",
            contact_blacklist: "Ausgewählte Kontakte",
            match_last_seen: "Ähnlich wie Zuletzt gesehen",
            known: "Bekannt",
            disable: "Deaktiviert",
            hrs24: "24 Stunden",
            dias7: "7 Tage",
            dias90: "90 Tage"
          },
          readreceipts:
            "Um den Datenschutz der Lesebestätigungen zu aktualisieren",
          profile: "Um den Datenschutz des Profilbilds zu aktualisieren",
          status: "Um den Datenschutz der Statusmeldungen zu aktualisieren",
          online: "Um den Online-Datenschutz zu aktualisieren",
          last: "Um den Datenschutz des Zuletzt gesehen zu aktualisieren",
          groupadd:
            "Um den Datenschutz der Gruppenhinzufügung zu aktualisieren",
          calladd: "Um den Datenschutz der Anrufhinzufügung zu aktualisieren",
          disappearing:
            "Um den Standardmodus für verschwindende Nachrichten zu aktualisieren"
        }
      },
      frontendErrors: {
        ERR_CONFIG_ERROR:
          "Konfigurationsfehler. Bitte kontaktieren Sie den Support.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Uhrzeit nicht synchron. Bitte überprüfen Sie die Datums- und Uhrzeiteinstellungen Ihres Geräts.",
        ERR_BACKEND_UNREACHABLE:
          "Backend nicht erreichbar. Bitte versuchen Sie es später erneut.",
        ERR_BACKEND_NOT_READY:
          "Das Backend startet noch und ist noch nicht bereit. Automatischer neuer Versuch."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "Keine WhatsApp-Verbindung verfügbar, um das Gespräch zu öffnen.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "Dieser Lead ist nicht mehr in deiner Basis.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Dieser Lead hat keine Telefonnummer für ein Gespräch.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "Die Akquise ist auf diesem Server noch nicht eingerichtet.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "Der Zugriffsschlüssel für die Akquise wurde abgelehnt. Bitte den Support informieren.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "Der Akquise-Dienst hat nicht geantwortet. Versuche es in einigen Minuten erneut.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "Der Akquise-Dienst hat diese Suche abgelehnt. Prüfe Nische und Stadt.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Diese Suche existiert im Akquise-Dienst nicht mehr.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Gib Nische und Stadt an, um Leads zu suchen.",
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
          "Testtage müssen eine ganze Zahl zwischen 0 und 3650 sein.",
        ERR_INVALID_DUE_DAY:
          "Der Fälligkeitstag muss zwischen 1 und 31 liegen.",
        ERR_TRIAL_ALREADY_STARTED:
          "Die Testphase kann nach Rechnungsbeginn nicht geändert werden.",
        ERR_TASK_BOARD_INVALID_TITLE: "Geben Sie einen gültigen Titel ein.",
        ERR_TASK_BOARD_INVALID_COLOR: "Geben Sie eine gültige Hex-Farbe ein.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Spalte nicht gefunden.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Aufgabe nicht gefunden.",
        ERR_TASK_BOARD_INVALID_DATE: "Geben Sie ein gültiges Datum ein.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "Der Datumsbereich ist ungültig.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "Das Board benötigt eine Spalte für abgeschlossene Aufgaben.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER:
          "Die Spaltenreihenfolge ist ungültig.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Wählen Sie eine andere abgeschlossene Spalte, bevor Sie diese löschen.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Verschieben Sie die Aufgaben, bevor Sie diese Spalte löschen.",
        ERR_EMAIL_NOT_FOUND: "Diese E-Mail wurde nicht gefunden.",
        ERR_COMPANY_SUSPENDED:
          "Dieses Konto ist gesperrt. Wenden Sie sich an die für Ihr Abonnement verantwortliche Person.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Dieses Konto hat bereits ein Passwort. Kehren Sie zur Anmeldung zurück.",
        ERR_ACTIVATION_INVALID:
          "Dieser Aktivierungslink ist ungültig oder abgelaufen.",
        ERR_PASSWORD_CONFIRMATION: "Die Passwörter stimmen nicht überein.",
        ERR_PASSWORD_TOO_WEAK:
          "Das Passwort muss mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie eine Zahl enthalten.",
        ERR_NO_OTHER_WHATSAPP:
          "Es muss mindestens ein Standard-WhatsApp geben.",
        ERR_NO_DEF_WAPP_FOUND:
          "Kein Standard-WhatsApp gefunden. Überprüfen Sie die Verbindungsseite.",
        ERR_WAPP_NOT_INITIALIZED:
          "Diese WhatsApp-Sitzung wurde nicht initialisiert. Überprüfen Sie die Verbindungsseite.",
        ERR_WAPP_CHECK_CONTACT:
          "WhatsApp-Kontakt konnte nicht überprüft werden. Überprüfen Sie die Verbindungsseite",
        ERR_WAPP_INVALID_CONTACT: "Dies ist keine gültige WhatsApp-Nummer.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Medien von WhatsApp konnten nicht heruntergeladen werden. Überprüfen Sie die Verbindungsseite.",
        ERR_INVALID_CREDENTIALS:
          "Authentifizierungsfehler. Bitte versuchen Sie es erneut.",
        ERR_SENDING_WAPP_MSG:
          "Fehler beim Senden der WhatsApp-Nachricht. Überprüfen Sie die Verbindungsseite.",
        ERR_DELETE_WAPP_MSG: "WhatsApp-Nachricht konnte nicht gelöscht werden.",
        ERR_EDITING_WAPP_MSG:
          "WhatsApp-Nachricht konnte nicht bearbeitet werden.",
        ERR_OTHER_OPEN_TICKET:
          "Es gibt bereits ein offenes Ticket für diesen Kontakt.",
        ERR_QUEUE_INVALID_CONNECTION:
          "Eine ausgewählte Verbindung gehört nicht zu diesem Unternehmen.",
        ERR_WAPP_INVALID_QUEUE:
          "Eine ausgewählte Warteschlange gehört nicht zu diesem Unternehmen.",
        ERR_TICKET_INVALID_CONNECTION:
          "Die ausgewählte Verbindung ist mit diesem Ticket nicht kompatibel.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "Ein Gruppenticket kann nicht zu einer anderen Verbindung wechseln.",
        ERR_INVALID_GROUP_MODE: "Der ausgewählte Gruppenmodus ist ungültig.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Wählen Sie mindestens eine berechtigte Warteschlange für die Gruppe aus.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED:
          "Wählen Sie eine berechtigte Service-Warteschlange aus.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "Diese Gruppe befindet sich im Unterhaltungsmodus und erlaubt keine Betreuungsaktionen.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED:
          "Die Zielverbindung muss verbunden sein.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Wählen Sie beim Verbindungswechsel eine Warteschlange.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "Diese Warteschlange ist nicht mit der Verbindung verknüpft.",
        ERR_SESSION_EXPIRED: "Sitzung abgelaufen. Bitte erneut einloggen.",
        ERR_USER_CREATION_DISABLED:
          "Die Benutzererstellung wurde vom Administrator deaktiviert.",
        ERR_NO_PERMISSION:
          "Sie haben keine Berechtigung, auf diese Funktion zuzugreifen.",
        ERR_DUPLICATED_CONTACT:
          "Es gibt bereits einen Kontakt mit dieser Nummer.",
        ERR_NO_SETTING_FOUND: "Keine Einstellung mit dieser ID gefunden.",
        ERR_NO_CONTACT_FOUND: "Kein Kontakt mit dieser ID gefunden.",
        ERR_NO_TICKET_FOUND: "Kein Ticket mit dieser ID gefunden.",
        ERR_NO_USER_FOUND: "Kein Benutzer mit dieser ID gefunden.",
        ERR_NO_WAPP_FOUND: "Kein WhatsApp mit dieser ID gefunden.",
        ERR_CREATING_MESSAGE:
          "Fehler beim Erstellen der Nachricht in der Datenbank.",
        ERR_CREATING_TICKET:
          "Fehler beim Erstellen des Tickets in der Datenbank.",
        ERR_FETCH_WAPP_MSG:
          "Fehler beim Abrufen der Nachricht auf WhatsApp, möglicherweise ist sie zu alt.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Diese Farbe wird bereits verwendet, wählen Sie eine andere.",
        ERR_WAPP_GREETING_REQUIRED:
          "Die Begrüßungsnachricht ist erforderlich, wenn es mehr als eine Warteschlange gibt."
      },
      ticketz: {
        registration: {
          header: "Registrieren Sie sich in der Espaço Whats-Benutzerdatenbank",
          description:
            "Füllen Sie die folgenden Felder aus, um sich in der Espaço Whats-Benutzerdatenbank zu registrieren und Neuigkeiten über das Projekt zu erhalten.",
          name: "Name",
          country: "Land",
          phoneNumber: "WhatsApp-Nummer",
          submit: "Registrieren"
        },
        proAd: {
          imageAlt: "Espaço Whats PRO Screenshot",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "Offizielles WhatsApp - Instagram - Messenger und mehr",
            exclusiveFeatures: "Exklusive Funktionen",
            advancedSupport: "Erweiterter Support",
            easyMigration: "Einfache Migration"
          },
          subscribePrice: "Abonnieren Sie für {{monthlyPrice}}/Monat",
          subscribeSubtitle: "direkt im System",
          ctaUpgrade: "Klicken Sie für Upgrade-Anweisungen",
          ctaVisitSite: "Klicken Sie, um die Website zu besuchen",
          instructions: {
            title: "Upgrade-Anweisungen",
            stepIntro:
              "Wenn Sie die vom Projekt bereitgestellten Images auf einem Server oder VPS mit den vereinfachten Anweisungen installiert haben, müssen Sie nur auf Ihren Server zugreifen und den folgenden Befehl ausführen:",
            stepInstall:
              'In wenigen Augenblicken wird Espaço Whats PRO mit all Ihren Daten installiert; gehen Sie dann ins Benutzermenü, klicken Sie auf "Espaço Whats PRO-Abonnement" und schließen Sie Ihr Abonnement ab.',
            helpPrefix:
              "Wenn Ihre Installation anders ist oder Sie Hilfe bei der Installation von Espaço Whats PRO benötigen, ",
            helpLink: "kontaktieren Sie uns",
            helpSuffix: " und wir helfen Ihnen!"
          }
        },
        support: {
          title: "Unterstützen Sie das Espaço Whats Open Source-Projekt",
          mercadopagotitle: "Kreditkarte",
          recurringbrl: "Wiederkehrende Spende in R$",
          paypaltitle: "Kreditkarte",
          international: "International in US$"
        }
      }
    }
  }
};

export { messages };
