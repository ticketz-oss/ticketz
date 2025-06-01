const messages = {
  de: {
    translations: {
      common: {
        search: "Suchen",
        edit: "Bearbeiten",
        delete: "Löschen",
        cancel: "Abbrechen",
        save: "Speichern",
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
        noqueue: "Ohne Warteschlange",
        contact: "Kontakt",
        user: "Benutzer",
        whatsappNumber: "WhatsApp-Nummer",
        dueDate: "Fälligkeitsdatum",
        copy: "Kopieren",
        paste: "Einfügen",
        proceed: "Fortfahren",
        enabled: "Aktiviert",
        disabled: "Deaktiviert",
        rating: "Bewertung",
        transferTo: "Weiterleiten an",
        chat: "Chat",
        plan: "Plan",
        status: "Status",
        clear: "Löschen",
        accessAs: "Zugriff als",
        createdAt: "Erstellt am",
        price: "Preis",
      },
      signup: {
        title: "Registrieren",
        toasts: {
          success: "Benutzer erfolgreich erstellt! Bitte einloggen!!!",
          fail: "Fehler beim Erstellen des Benutzers. Überprüfen Sie die angegebenen Daten.",
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Passwort",
          phone: "Telefonnummer mit Ländercode (+49)",
          atendentes: "Kundenservice",
          whatsApp: "Anzahl der WhatsApp-Nummern",
          queue: "Anzahl der Warteschlangen",
          currency: "€ ",
        },
        buttons: {
          submit: "Registrieren",
          login: "Haben Sie bereits ein Konto? Einloggen!",
        },
      },
      login: {
        title: "Anmelden",
        form: {
          email: "Email",
          password: "Passwort",
        },
        buttons: {
          submit: "Einloggen",
          register: "Noch kein Konto? Registrieren!",
        },
      },
      companies: {
        title: "Unternehmen registrieren",
        campaigns: "Kampagnen",
        recurrence: {
          title: "Häufigkeit",
          monthly: "Monatlich",
          bimonthly: "Zweimonatlich",
          quarterly: "Vierteljährlich",
          semiannual: "Halbjährlich",
          annual: "Jährlich",
        },
        form: {
          name: "Name des Unternehmens",
          plan: "Plan",
          token: "Token",
          submit: "Registrieren",
          success: "Unternehmen erfolgreich erstellt!",
        },
        options: {
          enabled: "Aktiviert",
          disabled: "Deaktiviert",
        },
        modal: {
          titleDeleted: "Datenlöschung",
          titleaccessAs: "Zugriff als",
          deletedNote: "Möchten Sie diese Daten wirklich löschen?",
          accessAsNote: "Möchten Sie das System als dieses Unternehmen aufrufen?",
        },
      },
      auth: {
        toasts: {
          success: "Erfolgreich eingeloggt!",
        },
        token: "Token",
      },
      dashboard: {
        usersOnline: "Benutzer online",
        ticketsWaiting: "Wartende Tickets",
        ticketsOpen: "Offene Tickets",
        ticketsDone: "Erledigte Tickets",
        totalTickets: "Tickets insgesamt",
        newContacts: "Neue Kontakte",
        avgServiceTime: "Durchschnittliche Bearbeitungszeit",
        avgWaitTime: "Durchschnittliche Wartezeit",
        ticketsOnPeriod: "Tickets im Zeitraum",
        userCurrentStatus: "Aktueller Status",
        filter: {
          period: "Zeitraum",
          custom: "Benutzerdefiniert",
          last3days: "Letzte 3 Tage",
          last7days: "Letzte 7 Tage",
          last14days: "Letzte 14 Tage",
          last30days: "Letzte 30 Tage",
          last90days: "Letzte 90 Tage"
        },
        date: {
          start: "Startdatum",
          end: "Enddatum",
        },
        ticketCountersLabels: {
          created: "Erstellt",
          closed: "Geschlossen",        
        },
        ticketzPro: {
          title: "Ticketz PRO",
          features1: "Offizielles Whatsapp - Instagram - Messenger und andere",
          features2: "Exklusive Funktionen - Premium-Support - Einfache Migration",
          price: "Abonnieren für R$ 199/Monat",
          note: "direkt im System",
          upgrade: "Klicken Sie für Upgrade-Anleitung",
          visit: "Klicken Sie, um die Website zu besuchen!",
          upgradeInstructions: {
            title: "Upgrade-Anleitung",
            paragraph1: "Wenn Sie die vom Projekt bereitgestellten Images auf einem Server oder VPS mit den vereinfachten Anweisungen installiert haben, müssen Sie nur auf Ihren Server zugreifen und folgenden Befehl eingeben:",
            command: "curl -sSL update.ticke.tz | sudo bash -s pro",
            paragraph2: "Innerhalb kürzester Zeit wird Ticketz PRO mit all Ihren Daten installiert. Gehen Sie nun einfach zum Benutzermenü, klicken Sie auf 'Ticketz PRO-Abonnement' und schließen Sie Ihr Abonnement ab.",
            paragraph3: "Wenn Ihre Installation anders ist oder Sie Hilfe bei der Installation von Ticketz Pro benötigen, ",
            paragraph4: "kontaktieren Sie uns und wir helfen Ihnen!",
          },
        },
      },
      connections: {
        title: "Verbindungen",
        toasts: {
          deleted: "Verbindung mit WhatsApp erfolgreich gelöscht!",
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.",
          disconnectTitle: "Trennen",
          disconnectMessage: "Sind Sie sicher? Sie müssen den QR-Code erneut scannen.",
        },
        buttons: {
          add: "WhatsApp hinzufügen",
          disconnect: "Trennen",
          tryAgain: "Erneut versuchen",
          qrcode: "QR CODE",
          newQr: "Neuer QR CODE",
          connecting: "Verbinden",
        },
        toolTips: {
          disconnected: {
            title: "Fehler beim Starten der WhatsApp-Sitzung",
            content: "Stellen Sie sicher, dass Ihr Telefon mit dem Internet verbunden ist, und versuchen Sie es erneut, oder fordern Sie einen neuen QR-Code an",
          },
          qrcode: {
            title: "Warten auf QR-Code-Scan",
            content: "Klicken Sie auf die Schaltfläche 'QR CODE' und scannen Sie den QR-Code mit Ihrem Telefon, um die Sitzung zu starten",
          },
          connected: {
            title: "Verbindung hergestellt!",
          },
          timeout: {
            title: "Verbindung zum Telefon verloren",
            content: "Stellen Sie sicher, dass Ihr Telefon mit dem Internet verbunden ist und WhatsApp geöffnet ist, oder klicken Sie auf die Schaltfläche 'Trennen', um einen neuen QR-Code zu erhalten",
          },
          refresh: "Aktualisieren",
          disconnect: "Trennen",
          scan: "Scannen",
          newQr: "Neuer QR-Code",
          retry: "Erneut versuchen",
        },
        table: {
          name: "Name",
          status: "Status",
          lastUpdate: "Letztes Update",
          default: "Standard",
          actions: "Aktionen",
          session: "Sitzung",
        },
      },
      internalChat: {
        title: "Interner Chat",
        alertChatTitle: "Bitte geben Sie einen Chat-Titel ein.",
        alertChatUser: "Bitte wählen Sie mindestens einen Benutzer aus.",
        labelTitle: "Titel",
        labelPlaceholder: "Titel eingeben",
      },
      whatsappModal: {
        title: {
          add: "WhatsApp hinzufügen",
          edit: "WhatsApp bearbeiten",
        },
        form: {
          name: "Name",
          default: "Standard",
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen",
        },
        success: "WhatsApp erfolgreich gespeichert.",
      },
      qrCode: {
        message: "Scannen Sie den QR-Code, um die Sitzung zu starten",
      },
      contacts: {
        title: "Kontakte",
        toasts: {
          deleted: "Kontakt erfolgreich gelöscht!",
        },
        searchPlaceholder: "Suchen...",
        confirmationModal: {
          deleteTitle: "Löschen",
          importTitlte: "Kontakte importieren",
          deleteMessage: "Sind Sie sicher, dass Sie diesen Kontakt löschen möchten? Alle zugehörigen Interaktionen gehen verloren.",
          importMessage: "Möchten Sie alle Kontakte vom Telefon importieren?",
        },
        buttons: {
          import: "Kontakte importieren",
          add: "Kontakt hinzufügen",
        },
        table: {
          name: "Name",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Aktionen",
        },
      },
      contactModal: {
        title: {
          add: "Kontakt hinzufügen",
          edit: "Kontakt bearbeiten",
        },
        form: {
          mainInfo: "Kontaktdaten",
          extraInfo: "Zusätzliche Informationen",
          name: "Name",
          number: "WhatsApp-Nummer",
          email: "Email",
          extraName: "Feldname",
          extraValue: "Wert",
          disableBot: "Chatbot deaktivieren",
        },
        buttons: {
          addExtraInfo: "Information hinzufügen",
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen",
        },
        success: "Kontakt erfolgreich gespeichert.",
      },
      queueModal: {
    title: {
      titleNotDefined: "Titel nicht definiert",
      titleTabsQueue: "Warteschlangendaten",
      titleTabsHours: "Servicezeiten",
      optionText: "Textoption eingeben",
      optionTitle: "Optionsüberschrift",
    },
    toasts: {

    },
    confirmationModal: {
      notificationAdd: "Warteschlangendaten erfolgreich gespeichert",
      notificationEdit: "Warteschlangendaten erfolgreich geändert",
      notificationDeleted: "Warteschlangendaten erfolgreich gelöscht",
      notificationHours: "Klicken Sie auf Speichern, um Änderungen zu übernehmen",
    },
  },
        form: {
          noutOfHoursAction: {
    title: "Aktion außerhalb der Öffnungszeiten",
    options: {
      pending: "In Warteschlange belassen",
      closed: "Ticket schließen",
    },
  },
  buttons: {
    okAdd: "Hinzufügen",
    okEdit: "Speichern",
    cancel: "Abbrechen",
    attach: "Datei anhängen",
    add: "Warteschlange hinzufügen",
    edit: "Warteschlange bearbeiten",
    addSub: "Unterwarteschlange erstellen",
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
          sunday: "Sonntag",
          dontEnableHours: "Servicezeiten für diese Warteschlange nicht aktivieren",
        },
      },
      userModal: {
        title: {
          add: "Benutzer hinzufügen",
          edit: "Benutzer bearbeiten",
        },
        form: {
          name: "Name",
          email: "Email",
          password: "Passwort",
          profile: "Profil",
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen",
        },
        success: "Benutzer erfolgreich gespeichert.",
      },
      scheduleModal: {
        title: {
          add: "Neue Planung",
          edit: "Planung bearbeiten",
        },
        form: {
          body: "Nachricht",
          contact: "Kontakt",
          sendAt: "Planungsdatum",
          sentAt: "Sendedatum",
          saveMessage: "Nachricht im Ticket speichern",
        },
        errorMessages: {
          tooShort: "Nachricht zu kurz",
          required: "Erforderlich",
          sendError: "Fehler beim Senden",
          default: "Nachricht",
          unidentifedWhatsapp: "WhatsApp nicht identifiziert",
          scheduleCheckError: "Fehler bei der Terminprüfung: ",
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen",
        },
        schedules: {
          scheduledDispatch: "Geplante Sendung für: ",
          messageSent: "Geplante Nachricht gesendet an: ",
        },
        completionMessages: {
          default: "Service abgeschlossen",
        },
        success: "Planung erfolgreich gespeichert.",
      },
      tagModal: {
        title: {
          add: "Neues Tag",
          edit: "Tag bearbeiten",
          addKanban: "Neue Lane",
          editKanban: "Lane bearbeiten",
        },
        form: {
          name: "Name",
          color: "Farbe",
          kanban: "Kanban",
        },
        buttons: {
          okAdd: "Hinzufügen",
          okEdit: "Speichern",
          cancel: "Abbrechen",
        },
        success: "Tag erfolgreich gespeichert.",
        successKanban: "Lane erfolgreich gespeichert.",
      },
      chat: {
        noTicketMessage: "Wählen Sie ein Ticket, um zu chatten.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "DATEIEN HIERHIN ZIEHEN UND ABLEGEN",
          titleFileList: "Dateiliste",
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Neu",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Warteschlangen",
      },
      tickets: {
        toasts: {
          deleted: "Das von Ihnen verwaltete Ticket wurde gelöscht.",
        },
        notification: {
          message: "Nachricht von",
        },
        tabs: {
          open: { 
            title: "Offen" ,
          },
          closed: { 
            title: "Gelöst",
            close: "Fertig",
          },
          groups: { 
            title: "Gruppen" 
          },
          search: { 
            title: "Suche" 
          },
        },
        search: {
          placeholder: "Tickets und Nachrichten suchen",
          filterTags: "Nach Tags filtern",
          filterUsers: "Nach Benutzer filtern",
        },
        buttons: {
          showAll: "Alle",
        },
      },
      task: {
        title: "Aufgabe",
        newTask: "Neue Aufgabe",
      },
      transferTicketModal: {
        title: "Ticket übertragen",
        fieldLabel: "Benutzer suchen",
        fieldQueueLabel: "In Warteschlange übertragen",
        fieldQueuePlaceholder: "Wählen Sie eine Warteschlange",
        noOptions: "Kein Benutzer mit diesem Namen gefunden",
        buttons: {
          ok: "Übertragen",
          cancel: "Abbrechen",
        },
      },
      ticketsList: {
        pendingHeader: "Wartend",
        assignedHeader: "In Bearbeitung",
        noTicketsTitle: "Nichts hier!",
        noTicketsMessage: "Keine Tickets mit diesem Status oder Suchbegriff gefunden",
        buttons: {
          accept: "Akzeptieren",
        },
      },
      newTicketModal: {
        title: "Ticket erstellen",
        fieldLabel: "Kontakt suchen",
        add: "Hinzufügen",
        buttons: {
          ok: "Speichern",
          cancel: "Abbrechen",
        },
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
          messagesAPI: "API",
          schedules: "Planungen",
          campaigns: "Kampagnen",
          listing: "Kampagnenliste",
          contactList: "Kontaktliste",
          annoucements: "Ankündigungen",
          chats: "Interner Chat",
          financeiro: "Finanzen",
          logout: "Abmelden",
          management: "Management",
          kanban: "Kanban",
        },
        appBar: {
          i18n: {
            language: "Deutsch",
            language_short: "DE",
          },
          user: {
            profile: "Profil",
            darkmode: "Dunkelmodus",
            lightmode: "Hellmodus",
            language: "Sprache auswählen",
            about: "Über",
            logout: "Abmelden",
          },
        },
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Nummer",
          body: "Nachricht",
          token: "Registrierter Token",
        },
        mediaMessage: {
          number: "Nummer",
          body: "Dateiname",
          media: "Datei",
          token: "Registrierter Token",
        },
      },
      notifications: {
        noTickets: "Keine Benachrichtigungen.",
      },
      quickMessages: {
        title: "Schnellantworten",
        buttons: {
          add: "Neue Antwort",
        },
        dialog: {
          shortcode: "Verknüpfung",
          message: "Nachricht",
          action: "Aktion",
          deleteRecord: "Schnellnachricht löschen",
          questionAnswer: "Möchten Sie diese Nachricht wirklich löschen?",
          notificationAdd: "Nachricht erfolgreich hinzugefügt.",
          notificationDelete: "Nachricht erfolgreich gelöscht.",
          notificationUpdate: "Nachricht aktualisiert.",
        },
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Suche",
        subMenus: {
          list: "Tafel",
          tags: "Lanes",
        },
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Offen",
        confirmationModal: {
          deleteTitle: "Sind Sie sicher, dass Sie diese Lane löschen möchten?",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
        table: {
          name: "Name",
          color: "Farbe",
          tickets: "Tickets",
          actions: "Aktionen",
        },
        buttons: {
          add: "Neue Lane",
        },
        toasts: {
          deleted: "Lane erfolgreich gelöscht.",
        },
      },
      contactLists: {
        title: "Kontaktlisten",
        table: {
          name: "Name",
          contacts: "Kontakte",
          actions: "Aktionen",
        },
        buttons: {
          add: "Neue Liste",
        },
        dialog: {
          name: "Name",
          company: "Unternehmen",
          okEdit: "Bearbeiten",
          okAdd: "Hinzufügen",
          add: "Hinzufügen",
          edit: "Bearbeiten",
          cancel: "Abbrechen",
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
        toasts: {
          deleted: "Eintrag gelöscht",
          created: "Eintrag erstellt",
        },
      },
      contactListItems: {
        title: "Kontakte",
        searchPlaceholder: "Suche",
        buttons: {
          add: "Neu",
          lists: "Listen",
          import: "Importieren",
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
          cancel: "Abbrechen",
        },
        table: {
          name: "Name",
          number: "Nummer",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Aktionen",
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
          importMessage: "Möchten Sie die Kontakte aus dieser Tabelle importieren?",
          importTitlte: "Importieren",
        },
        toasts: {
          deleted: "Eintrag gelöscht",
        },
      },
      campaigns: {
        title: "Kampagnen",
        searchPlaceholder: "Suche",
        buttons: {
          add: "Neue Kampagne",
          contactLists: "Kontaktlisten",
          addVariable: "Variable hinzufügen",
          saveSetting: "Einstellungen speichern",
        },
        table: {
          name: "Name",
          whatsapp: "Verbindung",
          contactList: "Kontaktliste",
          status: "Status",
          scheduledAt: "Planung",
          completedAt: "Abgeschlossen",
          confirmation: "Bestätigung",
          actions: "Aktionen",
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
            contactList: "Kontaktliste",
          },
          buttons: {
            add: "Hinzufügen",
            edit: "Aktualisieren",
            okadd: "Ok",
            cancel: "Sendungen abbrechen",
            restart: "Sendungen neu starten",
            close: "Schließen",
            attach: "Datei anhängen",
          },
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
        toasts: {
          title: "Intervall",
          success: "Operation erfolgreich abgeschlossen",
          cancel: "Kampagne abgebrochen",
          restart: "Kampagne neu gestartet",
          deleted: "Daten erfolgreich gelöscht",
          seconds: "Sekunden",
          messages: "Nachrichten",
          noInterval: "Ohne Intervall",
          greaterInterval: "Versand verzögert",
          longerIntervalAfter: "Versand verzögern nach",
          notDefined: "Ohne Verzögerung",
          messageInterval: "Nachrichtenintervall",
          hotKey: "Verknüpfung",
          
        },
      },
      announcements: {
        title: "Ankündigungen",
        searchPlaceholder: "Suche",
        buttons: {
          add: "Neue Ankündigung",
          contactLists: "Ankündigungslisten",
        },
        table: {
          priority: "Priorität",
          title: "Titel",
          text: "Text",
          mediaName: "Datei",
          status: "Status",
          actions: "Aktionen",
        },
        dialog: {
          edit: "Ankündigung bearbeiten",
          add: "Neue Ankündigung",
          update: "Ankündigung aktualisieren",
          readonly: "Nur Lesen",
          form: {
            priority: {
              title: "Priorität",
              high: "Hoch",
              medium: "Mittel",
              low: "Niedrig",
            },
            title: "Titel",
            text: "Text",
            mediaPath: "Datei",
            attach: "Kein Anhang",
            status: {
              title: "Status",
              active: "Aktiv",
              inactive: "Inaktiv",
            },
          },
          buttons: {
            add: "Hinzufügen",
            edit: "Aktualisieren",
            okadd: "Ok",
            cancel: "Abbrechen",
            close: "Schließen",
            attach: "Datei anhängen",
          },
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
        toasts: {
          success: "Operation erfolgreich",
          deleted: "Eintrag gelöscht",
        },
      },
      campaignsConfig: {
        title: "Kampagnenkonfigurationen",
      },
      queues: {
        title: "Warteschlangen & Chatbot",
        table: {
          name: "Name",
          color: "Farbe",
          greeting: "Begrüßungsnachricht",
          actions: "Aktionen",
        },
        buttons: {
          add: "Warteschlange hinzufügen",
        },
        dialog: {
          name: "Name",
          company: "Unternehmen",
          okEdit: "Bearbeiten",
          okAdd: "Hinzufügen",
          add: "Hinzufügen",
          edit: "Bearbeiten",
          cancel: "Abbrechen",
        },
        toasts: {
          deleted: "Daten erfolgreich gelöscht",
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden! Die Interaktionen dieser Warteschlange bleiben bestehen, haben jedoch keine zugewiesene Warteschlange mehr.",
        },
      },
      queueSelect: {
        inputLabel: "Warteschlangen",
      },
      users: {
        title: "Benutzer",
        table: {
          name: "Name",
          email: "Email",
          profile: "Profil",
          actions: "Aktionen",
        },
        buttons: {
          add: "Benutzer hinzufügen",
        },
        toasts: {
          deleted: "Benutzer erfolgreich gelöscht.",
        },
        confirmationModal: {
          deleteTitle: "Löschen",
          deleteMessage: "Alle Benutzerdaten gehen verloren. Die offenen Tickets dieses Benutzers werden in die Warteschlange verschoben.",
        },
      },
      helps: {
        title: "Hilfezentrum",
      },
      about: {
        aboutthe: "Über",
        copyright: "© 2024 - Betrieben mit ticketz",
        buttonclose: "Schließen",
        title: "Über ticketz",
        abouttitle: "Ursprung und Verbesserungen",
        aboutdetail: "Ticketz ist indirekt vom Whaticket-Projekt abgeleitet, mit Verbesserungen, die von den Entwicklern des EquipeChat-Systems über den YouTube-Kanal VemFazer geteilt wurden, und später von Claudemir Todo Bom verbessert wurden",
        aboutauthorsite: "Website des Autors",
        aboutwhaticketsite: "Website der Whaticket-Community auf Github",
        aboutvemfazersite: "Website des Vem Fazer-Kanals auf Github",
        licenseheading: "Open-Source-Lizenz",
        licensedetail: "Ticketz ist unter der GNU Affero General Public License Version 3 lizenziert, was bedeutet, dass jeder Benutzer, der Zugriff auf diese Anwendung hat, das Recht hat, auf den Quellcode zuzugreifen. Weitere Informationen finden Sie in den folgenden Links:",
        licensefulltext: "Vollständiger Lizenztext",
        licensesourcecode: "Quellcode von ticketz",
      },
      schedules: {
        title: "Planungen",
        confirmationModal: {
          deleteTitle: "Sind Sie sicher, dass Sie diese Planung löschen möchten?",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
        table: {
          contact: "Kontakt",
          body: "Nachricht",
          sendAt: "Planungsdatum",
          sentAt: "Sendedatum",
          status: "Status",
          actions: "Aktionen",
        },
        buttons: {
          add: "Neue Planung",
        },
        toasts: {
          deleted: "Planung erfolgreich gelöscht.",
        },
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Sind Sie sicher, dass Sie dieses Tag löschen möchten?",
          deleteMessage: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
        table: {
          name: "Name",
          color: "Farbe",
          tickets: "Einträge",
          actions: "Aktionen",
          id: "Id",
          kanban: "Kanban",
        },
        buttons: {
          add: "Neues Tag",
        },
        toasts: {
          deleted: "Tag erfolgreich gelöscht.",
        },
      },
      whitelabel: {
        primaryColorLight: "Primäre helle Farbe",
        primaryColorDark: "Primäre dunkle Farbe",
        lightLogo: "Helles App-Logo",
        darkLogo: "Dunkles App-Logo",
        favicon: "App-Favicon",
        appname: "App-Name",
        logoHint: "Bevorzugt SVG-Format mit 28:10 Seitenverhältnis",
        faviconHint: "Bevorzugt quadratisches SVG oder 512x512 PNG",
      },
      settings: {
        group: {
          general: {
            title: "Allgemeine Einstellungen",
            VoiceAndVideoCalls: {
              title: "Sprach- und Videoanrufe",
              options: {
                enabled: "Ignorieren",
                disabled: "Nichtverfügbarkeit melden",
              },
            },
            AutomaticChatbotOutput: {
              title: "Automatische Chatbot-Ausgabe",
              options: {
                enabled: "Aktiviert",
                disabled: "Deaktiviert",
              },
            },
            autoReopenTimeout: "Automatische Wiederöffnungszeit (Minuten)",
          },
          rating: {
            title: "Bewertungseinstellungen",
            label: "Bewertung",
            timeout: "Bewertungswartezeit (Minuten)",
          },
          noQueue: {
            title: "Einstellungen für warteschlangenlose Tickets",
            label: "Timeout für warteschlangenlose Tickets (Minuten)",
            action: "Aktion für warteschlangenlose Tickets",
            options: {
              close: "Ticket schließen",
              transferTo: "Weiterleiten an",
            },
          },
          ticketInProgress: {
            title: "Einstellungen für in Bearbeitung befindliche Tickets",
            label: "Timeout für in Bearbeitung befindliche Tickets (Minuten)",
            action: "Aktion für offene Tickets",
            options: {
              returnToQueue: "Zurück zur Warteschlange",
              closeService: "Service schließen",
            },
          },
          timeouts: {
            title: "Wartezeiten",
            actionforUnassignedTicketTimeout: "Aktion für warteschlangenlose Tickets",
            actionforOpenTicketTimeout: "Aktion für offene Tickets",
            transferTo: "Weiterleiten an",
            timeoutforTicketInProgress: "Timeout für in Bearbeitung befindliche Tickets (Minuten)",
            timeoutforUnassignedTicket: "Timeout für warteschlangenlose Tickets (Minuten)",
            returnToQueue: "Zurück zur Warteschlange",
            closeService: "Service schließen",
          },
          officeHours: "Bürozeiten",
          groups: "Gruppen",
          confidenciality: "Vertraulichkeit",
          api: "API",
          externalServices: "Externe Dienste",
          serveradmin: "Serververwaltung",
          helps: {
            title: "Titel",
            videoLink: "Video-Link",
            description: "Beschreibung",
            notification: {
              loadListError: "Liste der Notizen konnte nicht geladen werden",
              operationSuccess: "Daten erfolgreich gespeichert!",
              operationDeletedSuccess: "Daten erfolgreich gelöscht!",
              operationError: "Operation konnte nicht durchgeführt werden. Überprüfen Sie, ob der Name bereits existiert oder ob die Felder korrekt ausgefüllt sind",
              genericError: "Operation konnte nicht durchgeführt werden",
            },
            deleteRecord: {
              title: "Datenlöschung",
              confirmationMessage: "Möchten Sie diese Daten wirklich löschen?"
            },
          },
        },
        success: "Einstellungen erfolgreich gespeichert.",
        title: "Einstellungen",
        settings: {
          userCreation: {
            name: "Benutzererstellung",
            options: {
              enabled: "Aktiviert",
              disabled: "Deaktiviert",
            },
          },
        },
        validations: {
          title: "Bewertungen",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        OfficeManagement: {
          title: "Bürozeitenverwaltung",
          options: {
            disabled: "Deaktiviert",
            ManagementByDepartment: "Verwaltung nach Warteschlange",
            ManagementByCompany: "Verwaltung nach Unternehmen",
          },
        },
        outOfHoursAction: {
          title: "Aktion außerhalb der Bürozeiten",
          options: {
            pending: "Als ausstehend belassen",
            closed: "Ticket schließen",
          },
        },
        IgnoreGroupMessages: {
          title: "Gruppennachrichten ignorieren",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        soundGroupNotifications: {
          title: "Gruppentonbenachrichtigungen",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        groupsTab: {
          title: "Gruppen-Tab",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        VoiceAndVideoCalls: {
          title: "Sprach- und Videoanrufe",
          options: {
            enabled: "Ignorieren",
            disabled: "Verfügbarkeit melden",
          },
        },
        AutomaticChatbotOutput: {
          title: "Automatische Chatbot-Ausgabe",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        ShowNumericEmoticons: {
          title: "Numerische Emojis in der Warteschlange anzeigen",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        QuickMessages: {
          title: "Schnellnachrichten",
          options: {
            enabled: "Nach Unternehmen",
            disabled: "Nach Benutzer",
          },
        },
        AllowRegistration: {
          title: "Registrierung erlauben",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        FileUploadLimit: {
          title: "Datei-Upload-Limit (MB)",
        },
        FileDownloadLimit: {
          title: "Dateidownload-Limit (MB)",
        },
        GracePeriod: {
          title: "Schonfrist",
        },
        messageVisibility: {
          title: "Nachrichtensichtbarkeit",
          options: {
            respectMessageQueue: "Nachrichtenwarteschlange respektieren",
            respectTicketQueue: "Ticketwarteschlange respektieren",
          },
        },
        keepQueueAndUser: {
          title: "Warteschlange und Benutzer im geschlossenen Ticket beibehalten",
          options: {
            enabled: "Aktiviert",
            disabled: "Deaktiviert",
          },
        },
        WelcomeGreeting: {
          greetings: "Hallo",
          earlyMorning: "Guten Morgen früh,",
          morning: "Guten Morgen,",
          afternoon: "Guten Tag,",
          evening: "Guten Abend,",
          welcome: "Willkommen bei",
          expirationTime: "Aktiv bis",
        },
        Options: {
          title: "Optionen",
        },
        Companies: {
          title: "Unternehmen",
        },
        schedules: {
          title: "Zeitpläne",
        },
        Plans: {
          title: "Pläne",
        },
        Help: {
          title: "Hilfe",
        },
        Whitelabel: {
          title: "Whitelabel",
        },
        PaymentGateways: {
          title: "Zahlungsgateways",
        },
        AIProvider: {
          title: "KI-Dienst",
        },
        AudioTranscriptions: {
          title: "Audio-Transkription",
        },
        TagsMode: {
          title: "Tag-Modus",
          options: {
            ticket: "Ticket",
            contact: "Kontakt",
            both: "Ticket und Kontakt"
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Zugewiesen an:",
          buttons: {
            return: "Zurückkehren",
            resolve: "Lösen",
            reopen: "Wieder öffnen",
            accept: "Akzeptieren",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Nachricht eingeben",
        placeholderClosed: "Öffnen oder akzeptieren Sie dieses Ticket, um eine Nachricht zu senden.",
        signMessage: "Signieren",
        replying: "Antworten",
        editing: "Bearbeiten",
      },
      message: {
        edited: "Bearbeitet",
        forwarded: "Weitergeleitet",
      },

      contactDrawer: {
        header: "Kontaktdaten",
        buttons: {
          edit: "Kontakt bearbeiten",
        },
        extraInfo: "Weitere Informationen",
      },
      ticketOptionsMenu: {
        schedule: "Planung",
        delete: "Löschen",
        transfer: "Übertragen",
        registerAppointment: "Kontaktbeobachtungen",
        appointmentsModal: {
          title: "Kontaktbeobachtungen",
          textarea: "Beobachtung",
          placeholder: "Geben Sie hier die Informationen ein, die Sie registrieren möchten",
        },
        confirmationModal: {
          title: "Ticket des Kontakts löschen",
          message: "Achtung! Alle Nachrichten im Zusammenhang mit dem Ticket gehen verloren.",
        },
        buttons: {
          delete: "Löschen",
          cancel: "Abbrechen",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Abbrechen",
        },
      },
      messageOptionsMenu: {
        delete: "Löschen",
        edit: "Bearbeiten",
        history: "Verlauf",
        reply: "Antworten",
        confirmationModal: {
          title: "Nachricht löschen?",
          message: "Diese Aktion kann nicht rückgängig gemacht werden.",
        },
      },
      messageHistoryModal: {
        close: "Schließen",
        title: "Nachrichtenbearbeitungsverlauf",
      },
      presence: {
        unavailable: "Nicht verfügbar",
        available: "Verfügbar",
        composing: "Schreibt...",
        recording: "Nimmt auf...",
        paused: "Pausiert",
      },
      privacyModal: {
        title: "WhatsApp-Datenschutz bearbeiten",
        buttons: {
          cancel: "Abbrechen",
          okEdit: "Speichern",
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
            dias90: "90 Tage",
          },
          readreceipts: "Um den Datenschutz der Lesebestätigungen zu aktualisieren",
          profile: "Um den Datenschutz des Profilbilds zu aktualisieren",
          status: "Um den Datenschutz der Statusmeldungen zu aktualisieren",
          online: "Um den Online-Datenschutz zu aktualisieren",
          last: "Um den Datenschutz des Zuletzt gesehen zu aktualisieren",
          groupadd: "Um den Datenschutz der Gruppenhinzufügung zu aktualisieren",
          calladd: "Um den Datenschutz der Anrufhinzufügung zu aktualisieren",
          disappearing: "Um den Standardmodus für verschwindende Nachrichten zu aktualisieren",
        },
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP: "Es muss mindestens ein Standard-WhatsApp geben.",
        ERR_FORBIDDEN: "Zugriff verweigert. Überprüfen Sie Ihre Berechtigungen.",
        ERR_CHECK_NUMBER: "Diese Nummer ist bei WhatsApp nicht registriert.",
        ERR_NO_OTHER_WHATSAPP: "Es muss mindestens ein Standard-WhatsApp vorhanden sein.",
        ERR_NO_DEF_WAPP_FOUND: "Kein Standard-WhatsApp gefunden. Überprüfen Sie die Verbindungsseite.",
        ERR_WAPP_NOT_INITIALIZED: "Diese WhatsApp-Sitzung wurde nicht initialisiert. Überprüfen Sie die Verbindungsseite.",
        ERR_WAPP_CHECK_CONTACT: "WhatsApp-Kontakt konnte nicht überprüft werden. Überprüfen Sie die Verbindungsseite",
        ERR_WAPP_INVALID_CONTACT: "Dies ist keine gültige WhatsApp-Nummer.",
        ERR_WAPP_DOWNLOAD_MEDIA: "Medien von WhatsApp konnten nicht heruntergeladen werden. Überprüfen Sie die Verbindungsseite.",
        ERR_INVALID_CREDENTIALS: "Authentifizierungsfehler. Bitte versuchen Sie es erneut.",
        ERR_SENDING_WAPP_MSG: "Fehler beim Senden der WhatsApp-Nachricht. Überprüfen Sie die Verbindungsseite.",
        ERR_DELETE_WAPP_MSG: "WhatsApp-Nachricht konnte nicht gelöscht werden.",
        ERR_EDITING_WAPP_MSG: "WhatsApp-Nachricht konnte nicht bearbeitet werden.",
        ERR_OTHER_OPEN_TICKET: "Es gibt bereits ein offenes Ticket für diesen Kontakt.",
        ERR_SESSION_EXPIRED: "Sitzung abgelaufen. Bitte erneut einloggen.",
        ERR_USER_CREATION_DISABLED: "Die Benutzererstellung wurde vom Administrator deaktiviert.",
        ERR_NO_PERMISSION: "Sie haben keine Berechtigung, auf diese Funktion zuzugreifen.",
        ERR_DUPLICATED_CONTACT: "Es gibt bereits einen Kontakt mit dieser Nummer.",
        ERR_NO_SETTING_FOUND: "Keine Einstellung mit dieser ID gefunden.",
        ERR_NO_CONTACT_FOUND: "Kein Kontakt mit dieser ID gefunden.",
        ERR_NO_TICKET_FOUND: "Kein Ticket mit dieser ID gefunden.",
        ERR_NO_USER_FOUND: "Kein Benutzer mit dieser ID gefunden.",
        ERR_NO_WAPP_FOUND: "Kein WhatsApp mit dieser ID gefunden.",
        ERR_CREATING_MESSAGE: "Fehler beim Erstellen der Nachricht in der Datenbank.",
        ERR_CREATING_TICKET: "Fehler beim Erstellen des Tickets in der Datenbank.",
        ERR_FETCH_WAPP_MSG: "Fehler beim Abrufen der Nachricht auf WhatsApp, möglicherweise ist sie zu alt.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS: "Diese Farbe wird bereits verwendet, wählen Sie eine andere.",
        ERR_WAPP_GREETING_REQUIRED: "Die Begrüßungsnachricht ist erforderlich, wenn es mehr als eine Warteschlange gibt.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Abonnementprüfung fehlgeschlagen.",
        ERR_WAPP_NOT_FOUND: "Verbindung nicht verfügbar.",
        ERR_SUBSCRIPTION_EXPIRED: "Ihr Abonnement ist abgelaufen.",
        ERR_UNKOWN: "Unbekannter Fehler.",
      },
      ticketz: {
        registration: {
          header: "Registrieren Sie sich in der Ticketz-Benutzerdatenbank",
          description: "Füllen Sie die folgenden Felder aus, um sich in der Ticketz-Benutzerdatenbank zu registrieren und Neuigkeiten über das Projekt zu erhalten.",
          name: "Name",
          country: "Land",
          phoneNumber: "WhatsApp-Nummer",
          submit: "Registrieren",
        },
        support: {
          title: "Unterstützen Sie das Ticketz Open Source-Projekt",
          mercadopagotitle: "Kreditkarte",
          recurringbrl: "Wiederkehrende Spende in R$",
          paypaltitle: "Kreditkarte",
          international: "International in US$",
        },
      },
      owenAd: {
        title: "Owen Payments unterstützt Ticketz",
        description1: "Das Startup Owen Payments bietet PIX-Zahlungen zu einem Festpreis von R$ 0,99 pro Transaktion an.",
        description2: "Ein Teil jedes Transaktionswerts wird an das Ticketz-Projekt weitergeleitet. Durch die Nutzung dieser Zahlungsmethode unterstützen Sie also auch das Projekt.",
        description3: 'Wählen Sie das Zahlungsgateway "Owen Payments 💎" und beantragen Sie die Eröffnung Ihres Kontos, ohne Ticketz verlassen zu müssen!'
      },
    },
  },
};

export { 
  messages 
};