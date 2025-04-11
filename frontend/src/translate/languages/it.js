const messages = {
  it: {
    translations: {
      common: {
        search: "Cerca",
        edit: "Modifica",
        delete: "Elimina",
        cancel: "Annulla",
        save: "Salva",
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
        contact: "Contatto"
      },
      signup: {
        title: "Registrati",
        toasts: {
          success: "Utente creato con successo! Effettua il login!!!",
          fail: "Errore nella creazione dell'utente. Verifica i dati inseriti.",
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Password",
        },
        buttons: {
          submit: "Registrati",
          login: "Hai già un account? Accedi!",
        },
      },
      login: {
        title: "Accesso",
        form: {
          email: "Email",
          password: "Password",
        },
        buttons: {
          submit: "Accedi",
          register: "Non hai un account? Registrati!",
        },
      },
      companies: {
        title: "Registra Azienda",
        form: {
          name: "Nome dell'Azienda",
          plan: "Piano",
          token: "Token",
          submit: "Registrati",
          success: "Azienda creata con successo!",
        },
      },
      auth: {
        toasts: {
          success: "Accesso effettuato con successo!",
        },
        token: "Token",
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Interazioni di oggi: ",
          },
        },
      },
      connections: {
        title: "Connessioni",
        toasts: {
          deleted: "Connessione con WhatsApp eliminata con successo!",
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Sei sicuro? Questa azione non può essere annullata.",
          disconnectTitle: "Disconnetti",
          disconnectMessage:
            "Sei sicuro? Dovrai scansionare nuovamente il QR Code.",
        },
        buttons: {
          add: "Aggiungi WhatsApp",
          disconnect: "Disconnetti",
          tryAgain: "Riprova",
          qrcode: "QR CODE",
          newQr: "Nuovo QR CODE",
          connecting: "Connessione in corso",
        },
        toolTips: {
          disconnected: {
            title: "Errore nell'avvio della sessione di WhatsApp",
            content:
              "Assicurati che il tuo telefono sia connesso a Internet e riprova, oppure richiedi un nuovo QR Code",
          },
          qrcode: {
            title: "In attesa della scansione del QR Code",
            content:
              "Clicca sul pulsante 'QR CODE' e scansiona il QR Code con il tuo telefono per avviare la sessione",
          },
          connected: {
            title: "Connessione stabilita!",
          },
          timeout: {
            title: "Connessione con il telefono persa",
            content:
              "Assicurati che il tuo telefono sia connesso a Internet e che WhatsApp sia aperto, oppure clicca sul pulsante 'Disconnetti' per ottenere un nuovo QR Code",
          },
        },
        table: {
          name: "Nome",
          status: "Stato",
          lastUpdate: "Ultimo aggiornamento",
          default: "Predefinito",
          actions: "Azioni",
          session: "Sessione",
        },
      },
      internalChat: {
        title: "Chat Interno",

      },
      whatsappModal: {
        title: {
          add: "Aggiungi WhatsApp",
          edit: "Modifica WhatsApp",
        },
        form: {
          name: "Nome",
          default: "Predefinito",
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
        },
        success: "WhatsApp salvato con successo.",
      },
      qrCode: {
        message: "Scansiona il QR Code per avviare la sessione",
      },
      contacts: {
        title: "Contatti",
        toasts: {
          deleted: "Contatto eliminato con successo!",
        },
        searchPlaceholder: "Cerca...",
        confirmationModal: {
          deleteTitle: "Elimina",
          importTitlte: "Importa contatti",
          deleteMessage:
            "Sei sicuro di voler eliminare questo contatto? Tutte le interazioni correlate saranno perse.",
          importMessage: "Vuoi importare tutti i contatti dal telefono?",
        },
        buttons: {
          import: "Importa Contatti",
          add: "Aggiungi Contatto",
        },
        table: {
          name: "Nome",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Azioni",
        },
      },
      contactModal: {
        title: {
          add: "Aggiungi contatto",
          edit: "Modifica contatto",
        },
        form: {
          mainInfo: "Dati del contatto",
          extraInfo: "Informazioni aggiuntive",
          name: "Nome",
          number: "Numero di WhatsApp",
          email: "Email",
          extraName: "Nome del campo",
          extraValue: "Valore",
          disableBot: "Disabilita chatbot",
        },
        buttons: {
          addExtraInfo: "Aggiungi informazione",
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
        },
        success: "Contatto salvato con successo.",
      },
      queueModal: {
        title: {
          add: "Aggiungi coda",
          edit: "Modifica coda",
        },
        form: {
          name: "Nome",
          color: "Colore",
          greetingMessage: "Messaggio di benvenuto",
          complationMessage: "Messaggio di completamento",
          outOfHoursMessage: "Messaggio fuori orario",
          ratingMessage: "Messaggio di valutazione",
          transferMessage: "Messaggio di trasferimento",
          token: "Token",
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
          attach: "Allega File",
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
          sunday: "Domenica",
        },
      },
      userModal: {
        title: {
          add: "Aggiungi utente",
          edit: "Modifica utente",
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Password",
          profile: "Profilo",
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
        },
        success: "Utente salvato con successo.",
      },
      scheduleModal: {
        title: {
          add: "Nuova Pianificazione",
          edit: "Modifica Pianificazione",
        },
        form: {
          body: "Messaggio",
          contact: "Contatto",
          sendAt: "Data di Pianificazione",
          sentAt: "Data di Invio",
          saveMessage: "Salva Messaggio nel Ticket",
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
        },
        success: "Pianificazione salvata con successo.",
      },
      tagModal: {
        title: {
          add: "Nuova Tag",
          edit: "Modifica Tag",
          addKanban: "Nuova Lane",
          editKanban: "Modifica Lane",
        },
        form: {
          name: "Nome",
          color: "Colore",
          kanban: "Kanban",
        },
        buttons: {
          okAdd: "Aggiungi",
          okEdit: "Salva",
          cancel: "Annulla",
        },
        success: "Tag salvata con successo.",
        successKanban: "Lane salvata con successo.",
      },
      chat: {
        noTicketMessage: "Seleziona un ticket per iniziare a conversare.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "TRASCINA E RILASCIA I FILE NEL CAMPO SOTTO",
          titleFileList: "Lista dei file",
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuovo",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Code",
      },
      tickets: {
        toasts: {
          deleted: "Il ticket che stavi gestendo è stato eliminato.",
        },
        notification: {
          message: "Messaggio da",
        },
        tabs: {
          open: { title: "Aperti" },
          closed: { title: "Risolti" },
          groups: { title: "Gruppi" },
          search: { title: "Cerca" },
        },
        search: {
          placeholder: "Cerca ticket e messaggi",
        },
        buttons: {
          showAll: "Tutti",
        },
      },
      transferTicketModal: {
        title: "Trasferisci Ticket",
        fieldLabel: "Digita per cercare utenti",
        fieldQueueLabel: "Trasferisci alla coda",
        fieldQueuePlaceholder: "Seleziona una coda",
        noOptions: "Nessun utente trovato con questo nome",
        buttons: {
          ok: "Trasferisci",
          cancel: "Annulla",
        },
      },
      ticketsList: {
        pendingHeader: "In attesa",
        assignedHeader: "In gestione",
        noTicketsTitle: "Niente qui!",
        noTicketsMessage:
          "Nessun ticket trovato con questo stato o termine di ricerca",
        buttons: {
          accept: "Accetta",
        },
      },
      newTicketModal: {
        title: "Crea Ticket",
        fieldLabel: "Digita per cercare il contatto",
        add: "Aggiungi",
        buttons: {
          ok: "Salva",
          cancel: "Annulla",
        },
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
          messagesAPI: "API",
          schedules: "Pianificazioni",
          campaigns: "Campagne",
          annoucements: "Informazioni",
          chats: "Chat Interna",
          financeiro: "Finanziario",
          logout: "Esci",
          management: "Gestione",
          kanban: "Kanban",
        },
        appBar: {
          i18n: {
            language: "Italiano",
            language_short: "IT",
          },
          user: {
            profile: "Profilo",
            darkmode: "Modalità scura",
            lightmode: "Modalità chiara",
            language: "Seleziona lingua",
            about: "Informazioni",
            logout: "Esci",
          },
        },
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Numero",
          body: "Messaggio",
          token: "Token registrato",
        },
        mediaMessage: {
          number: "Numero",
          body: "Nome del file",
          media: "File",
          token: "Token registrato",
        },
      },
      notifications: {
        noTickets: "Nessuna notifica.",
      },
      quickMessages: {
        title: "Risposte Rapide",
        buttons: {
          add: "Nuova Risposta",
        },
        dialog: {
          shortcode: "Scorciatoia",
          message: "Risposta",
        },
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Cerca",
        subMenus: {
          list: "Pannello",
          tags: "Lanes",
        },
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Aperto",
        confirmationModal: {
          deleteTitle: "Sei sicuro di voler eliminare questa Lane?",
          deleteMessage: "Questa azione non può essere annullata.",
        },
        table: {
          name: "Nome",
          color: "Colore",
          tickets: "Tickets",
          actions: "Azioni",
        },
        buttons: {
          add: "Nuova Lane",
        },
        toasts: {
          deleted: "Lane eliminata con successo.",
        },
      },
      contactLists: {
        title: "Liste di Contatti",
        table: {
          name: "Nome",
          contacts: "Contatti",
          actions: "Azioni",
        },
        buttons: {
          add: "Nuova Lista",
        },
        dialog: {
          name: "Nome",
          company: "Azienda",
          okEdit: "Modifica",
          okAdd: "Aggiungi",
          add: "Aggiungi",
          edit: "Modifica",
          cancel: "Annulla",
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata.",
        },
        toasts: {
          deleted: "Registro eliminato",
          created: "Registro creato",
        },
      },
      contactListItems: {
        title: "Contatti",
        searchPlaceholder: "Cerca",
        buttons: {
          add: "Nuovo",
          lists: "Liste",
          import: "Importa",
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
          cancel: "Annulla",
        },
        table: {
          name: "Nome",
          number: "Numero",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Azioni",
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata.",
          importMessage: "Vuoi importare i contatti da questo foglio?",
          importTitlte: "Importa",
        },
        toasts: {
          deleted: "Registro eliminato",
        },
      },
      campaigns: {
        title: "Campagne",
        searchPlaceholder: "Cerca",
        buttons: {
          add: "Nuova Campagna",
          contactLists: "Liste di Contatti",
        },
        table: {
          name: "Nome",
          whatsapp: "Connessione",
          contactList: "Lista di Contatti",
          status: "Stato",
          scheduledAt: "Pianificazione",
          completedAt: "Completata",
          confirmation: "Conferma",
          actions: "Azioni",
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
            contactList: "Lista di Contatti",
          },
          buttons: {
            add: "Aggiungi",
            edit: "Aggiorna",
            okadd: "Ok",
            cancel: "Annulla Invii",
            restart: "Riavvia Invii",
            close: "Chiudi",
            attach: "Allega File",
          },
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata.",
        },
        toasts: {
          success: "Operazione completata con successo",
          cancel: "Campagna annullata",
          restart: "Campagna riavviata",
          deleted: "Registro eliminato",
        },
      },
      announcements: {
        title: "Informazioni",
        searchPlaceholder: "Cerca",
        buttons: {
          add: "Nuova Informazione",
          contactLists: "Liste di Informazioni",
        },
        table: {
          priority: "Priorità",
          title: "Titolo",
          text: "Testo",
          mediaName: "File",
          status: "Stato",
          actions: "Azioni",
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
            status: "Stato",
          },
          buttons: {
            add: "Aggiungi",
            edit: "Aggiorna",
            okadd: "Ok",
            cancel: "Annulla",
            close: "Chiudi",
            attach: "Allega File",
          },
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage: "Questa azione non può essere annullata.",
        },
        toasts: {
          success: "Operazione completata con successo",
          deleted: "Registro eliminato",
        },
      },
      campaignsConfig: {
        title: "Configurazioni Campagne",
      },
      queues: {
        title: "Code & Chatbot",
        table: {
          name: "Nome",
          color: "Colore",
          greeting: "Messaggio di benvenuto",
          actions: "Azioni",
        },
        buttons: {
          add: "Aggiungi coda",
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage:
            "Sei sicuro? Questa azione non può essere annullata! Le interazioni di questa coda continueranno ad esistere, ma non avranno più nessuna coda assegnata.",
        },
      },
      queueSelect: {
        inputLabel: "Code",
      },
      users: {
        title: "Utenti",
        table: {
          name: "Nome",
          email: "Email",
          profile: "Profilo",
          actions: "Azioni",
        },
        buttons: {
          add: "Aggiungi utente",
        },
        toasts: {
          deleted: "Utente eliminato con successo.",
        },
        confirmationModal: {
          deleteTitle: "Elimina",
          deleteMessage:
            "Tutti i dati dell'utente saranno persi. Le interazioni aperte di questo utente saranno spostate nella coda.",
        },
      },
      helps: {
        title: "Centro di Aiuto",
      },
      about: {
        aboutthe: "Informazioni su",
        copyright: "© 2024 - Funzionante con ticketz",
        buttonclose: "Chiudi",
        title: "Informazioni su ticketz",
        abouttitle: "Origine e miglioramenti",
        aboutdetail: "Il ticketz è derivato indirettamente dal progetto Whaticket con miglioramenti condivisi dagli sviluppatori del sistema EquipeChat attraverso il canale VemFazer su YouTube, successivamente migliorati da Claudemir Todo Bom",
        aboutauthorsite: "Sito dell'autore",
        aboutwhaticketsite: "Sito della comunità Whaticket su Github",
        aboutvemfazersite: "Sito del canale Vem Fazer su Github",
        licenseheading: "Licenza Open Source",
        licensedetail: "Il ticketz è concesso in licenza sotto la GNU Affero General Public License versione 3, il che significa che qualsiasi utente che ha accesso a questa applicazione ha il diritto di ottenere l'accesso al codice sorgente. Maggiori informazioni nei link sottostanti:",
        licensefulltext: "Testo completo della licenza",
        licensesourcecode: "Codice sorgente di ticketz",
      },
      schedules: {
        title: "Pianificazioni",
        confirmationModal: {
          deleteTitle: "Sei sicuro di voler eliminare questa Pianificazione?",
          deleteMessage: "Questa azione non può essere annullata.",
        },
        table: {
          contact: "Contatto",
          body: "Messaggio",
          sendAt: "Data di Pianificazione",
          sentAt: "Data di Invio",
          status: "Stato",
          actions: "Azioni",
        },
        buttons: {
          add: "Nuova Pianificazione",
        },
        toasts: {
          deleted: "Pianificazione eliminata con successo.",
        },
      },
      tags: {
        title: "Tag",
        confirmationModal: {
          deleteTitle: "Sei sicuro di voler eliminare questa Tag?",
          deleteMessage: "Questa azione non può essere annullata.",
        },
        table: {
          name: "Nome",
          color: "Colore",
          tickets: "Registrazioni",
          actions: "Azioni",
          id: "Id",
          kanban: "Kanban",
        },
        buttons: {
          add: "Nuova Tag",
        },
        toasts: {
          deleted: "Tag eliminata con successo.",
        },
      },
      settings: {
        group: {
          general: "Generale",
          timeouts: "Tempi di attesa",
          officeHours: "Orario di lavoro",
          groups: "Gruppi",
          confidenciality: "Riservatezza",
          api: "API",
          serveradmin: "Amministrazione del server",
        },
        success: "Impostazioni salvate con successo.",
        title: "Impostazioni",
        settings: {
          userCreation: {
            name: "Creazione utente",
            options: {
              enabled: "Attivato",
              disabled: "Disattivato",
            },
          },
        },
        validations: {
          title: "Valutazioni",
          options: {
            enabled: "Abilitato",
            disabled: "Disabilitato",
          },
        },
        OfficeManagement: {
          title: "Gestione dell'orario di lavoro",
          options: {
            disabled: "Disabilitato",
            ManagementByDepartment: "Gestione per coda",
            ManagementByCompany: "Gestione per azienda",
          },
        },
        outOfHoursAction: {
          title: "Azione fuori orario",
          options: {
            pending: "Lascia come pendente",
            closed: "Chiudi ticket",
          },
        },
        IgnoreGroupMessages: {
          title: "Ignora messaggi di gruppo",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato",
          },
        },
        soundGroupNotifications: {
          title: "Notifiche sonore di gruppo",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato",
          },
        },
        groupsTab: {
          title: "Scheda Gruppi",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato",
          },
        },
        VoiceAndVideoCalls: {
          title: "Chiamate vocali e video",
          options: {
            enabled: "Ignora",
            disabled: "informa indisponibilità",
          },
        },
        AutomaticChatbotOutput: {
          title: "Uscita automatica del chatbot",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato",
          },
        },
        QuickMessages: {
          title: "Messaggi Rapidi",
          options: {
            enabled: "Per azienda",
            disabled: "Per utente",
          },
        },
        AllowRegistration: {
          title: "Permetti registrazione",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato",
          },
        },
        FileDownloadLimit: {
          title: "Limite di download dei file (MB)",
        },
        messageVisibility: {
          title: "Visibilità del messaggio",
          options: {
            respectMessageQueue: "Rispetta coda del messaggio",
            respectTicketQueue: "Rispetta coda del ticket",
          },
        },
        keepUserAndQueue: {
          title: "Mantieni coda e utente nel ticket chiuso",
          options: {
            enabled: "Attivato",
            disabled: "Disattivato",
          },
        },
        WelcomeGreeting: {
          greetings: "Ciao",
          welcome: "Benvenuto a",
          expirationTime: "Attivo fino a",
        },
        Options: {
          title: "Opzioni",
        },
        Companies: {
          title: "Aziende",
        },
        schedules: {
          title: "Orari",
        },
        Plans: {
          title: "Piani",
        },
        Help: {
          title: "Aiuto",
        },
        Whitelabel: {
          title: "Whitelabel",
        },
        PaymentGateways: {
          title: "Gateway di pagamento",
        },
      },
      messagesList: {
        header: {
          assignedTo: "Assegnato a:",
          buttons: {
            return: "Ritorna",
            resolve: "Risolvi",
            reopen: "Riapri",
            accept: "Accetta",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Digita un messaggio",
        placeholderClosed:
          "Riapri o accetta questo ticket per inviare un messaggio.",
        signMessage: "Firma",
        replying: "Rispondendo",
        editing: "Modificando",
      },
      message: {
        edited: "Modificata",
      },
      contactDrawer: {
        header: "Dati del contatto",
        buttons: {
          edit: "Modifica contatto",
        },
        extraInfo: "Altre informazioni",
      },
      ticketOptionsMenu: {
        schedule: "Pianificazione",
        delete: "Elimina",
        transfer: "Trasferisci",
        registerAppointment: "Osservazioni del Contatto",
        appointmentsModal: {
          title: "Osservazioni del Contatto",
          textarea: "Osservazione",
          placeholder: "Inserisci qui le informazioni che desideri registrare",
        },
        confirmationModal: {
          title: "Elimina il ticket del contatto",
          message:
            "Attenzione! Tutti i messaggi relativi al ticket saranno persi.",
        },
        buttons: {
          delete: "Elimina",
          cancel: "Annulla",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Annulla",
        },
      },
      messageOptionsMenu: {
        delete: "Elimina",
        edit: "Modifica",
        history: "Cronologia",
        reply: "Rispondi",
        confirmationModal: {
          title: "Eliminare il messaggio?",
          message: "Questa azione non può essere annullata.",
        },
      },
      messageHistoryModal: {
        close: "Chiudi",
        title: "Cronologia delle modifiche del messaggio",
      },
      presence: {
        unavailable: "Non disponibile",
        available: "Disponibile",
        composing: "Sta scrivendo...",
        recording: "Sta registrando...",
        paused: "In pausa",
      },
      privacyModal: {
        title: "Modifica Privacy di WhatsApp",
        buttons: {
          cancel: "Annulla",
          okEdit: "Salva",
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
            dias90: "90 Giorni",
          },
          readreceipts: "Per aggiornare la privacy delle ricevute di lettura",
          profile: "Per aggiornare la privacy della foto del profilo",
          status: "Per aggiornare la privacy degli stati",
          online: "Per aggiornare la privacy online",
          last: "Per aggiornare la privacy dell'Ultimo Visto",
          groupadd: "Per aggiornare la privacy di Aggiunta ai gruppi",
          calladd: "Per aggiornare la privacy di Aggiunta alle chiamate",
          disappearing: "Per aggiornare la Modalità di Scomparsa Predefinita",
        },
      },
      backendErrors: {
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
        ERR_EDITING_WAPP_MSG: "Impossibile modificare il messaggio di WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Esiste già un ticket aperto per questo contatto.",
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
        ERR_CREATING_MESSAGE: "Errore nella creazione del messaggio nel database.",
        ERR_CREATING_TICKET: "Errore nella creazione del ticket nel database.",
        ERR_FETCH_WAPP_MSG:
          "Errore nel recupero del messaggio su WhatsApp, potrebbe essere troppo vecchio.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Questo colore è già in uso, scegline un altro.",
        ERR_WAPP_GREETING_REQUIRED:
          "Il messaggio di benvenuto è obbligatorio quando ci sono più code.",
      },
      ticketz: {
        registration: {
          header: "Registrati nella base utenti di Ticketz",
          description: "Compila i campi sottostanti per registrarti nella base utenti di Ticketz e ricevere aggiornamenti sul progetto.",
          name: "Nome",
          country: "Paese",
          phoneNumber: "Numero di WhatsApp",
          submit: "Registrati",
        },
        support: {
          title: "Supporta il progetto Ticketz Open Source",
          mercadopagotitle: "Carta di Credito",
          recurringbrl: "Donazione ricorrente in R$",
          paypaltitle: "Carta di Credito",
          international: "Internazionale in US$",
        },
      },
    },
  },
};

export { messages };
