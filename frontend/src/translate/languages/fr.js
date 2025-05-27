const messages = {
  fr: {
    translations: {
      common: {
        search: "Rechercher",
        edit: "Éditer",
        delete: "Supprimer",
        cancel: "Annuler",
        save: "Enregistrer",
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
        contact: "Contact"
      },
      signup: {
        title: "S'inscrire",
        toasts: {
          success: "Utilisateur créé avec succès ! Connectez-vous !!!",
          fail: "Erreur lors de la création de l'utilisateur. Vérifiez les informations fournies.",
        },
        form: {
          name: "Nom",
          email: "Email",
          password: "Mot de passe",
        },
        buttons: {
          submit: "S'inscrire",
          login: "Vous avez déjà un compte ? Connectez-vous !",
        },
      },
      login: {
        title: "Connexion",
        form: {
          email: "Email",
          password: "Mot de passe",
        },
        buttons: {
          submit: "Se connecter",
          register: "Vous n'avez pas de compte ? Inscrivez-vous !",
        },
      },
      companies: {
        title: "Enregistrer une entreprise",
        form: {
          name: "Nom de l'entreprise",
          plan: "Plan",
          token: "Jeton",
          submit: "Enregistrer",
          success: "Entreprise créée avec succès !",
        },
      },
      auth: {
        toasts: {
          success: "Connexion réussie !",
        },
        token: "Jeton",
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Interventions aujourd'hui : ",
          },
        },
      },
      connections: {
        title: "Connexions",
        toasts: {
          deleted: "Connexion avec WhatsApp supprimée avec succès !",
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Êtes-vous sûr ? Cette action est irréversible.",
          disconnectTitle: "Déconnecter",
          disconnectMessage:
            "Êtes-vous sûr ? Vous devrez scanner à nouveau le QR Code.",
        },
        buttons: {
          add: "Ajouter WhatsApp",
          disconnect: "Déconnecter",
          tryAgain: "Réessayer",
          qrcode: "QR CODE",
          newQr: "Nouveau QR CODE",
          connecting: "Connexion en cours",
        },
        toolTips: {
          disconnected: {
            title: "Échec de la connexion à WhatsApp",
            content:
              "Assurez-vous que votre téléphone est connecté à Internet et réessayez, ou demandez un nouveau QR Code",
          },
          qrcode: {
            title: "En attente de la lecture du QR Code",
            content:
              "Cliquez sur le bouton 'QR CODE' et scannez le QR Code avec votre téléphone pour démarrer la session",
          },
          connected: {
            title: "Connexion établie !",
          },
          timeout: {
            title: "Connexion avec le téléphone perdue",
            content:
              "Assurez-vous que votre téléphone est connecté à Internet et que WhatsApp est ouvert, ou cliquez sur le bouton 'Déconnecter' pour obtenir un nouveau QR Code",
          },
        },
        table: {
          name: "Nom",
          status: "Statut",
          lastUpdate: "Dernière mise à jour",
          default: "Par défaut",
          actions: "Actions",
          session: "Session",
        },
      },
      internalChat: {
        title: "Chat Interne",
      },
      whatsappModal: {
        title: {
          add: "Ajouter WhatsApp",
          edit: "Modifier WhatsApp",
        },
        form: {
          name: "Nom",
          default: "Par défaut",
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
        },
        success: "WhatsApp enregistré avec succès.",
      },
      qrCode: {
        message: "Scannez le QR Code pour démarrer la session",
      },
      contacts: {
        title: "Contacts",
        toasts: {
          deleted: "Contact supprimé avec succès !",
        },
        searchPlaceholder: "Rechercher...",
        confirmationModal: {
          deleteTitle: "Supprimer",
          importTitlte: "Importer des contacts",
          deleteMessage:
            "Êtes-vous sûr de vouloir supprimer ce contact ? Toutes les interventions associées seront perdues.",
          importMessage: "Voulez-vous importer tous les contacts du téléphone ?",
        },
        buttons: {
          import: "Importer des Contacts",
          add: "Ajouter un Contact",
        },
        table: {
          name: "Nom",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions",
        },
      },
      contactModal: {
        title: {
          add: "Ajouter un contact",
          edit: "Modifier le contact",
        },
        form: {
          mainInfo: "Informations du contact",
          extraInfo: "Informations supplémentaires",
          name: "Nom",
          number: "Numéro WhatsApp",
          email: "Email",
          extraName: "Nom du champ",
          extraValue: "Valeur",
          disableBot: "Désactiver le chatbot",
        },
        buttons: {
          addExtraInfo: "Ajouter une information",
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
        },
        success: "Contact enregistré avec succès.",
      },
      queueModal: {
        title: {
          add: "Ajouter une file d'attente",
          edit: "Modifier la file d'attente",
        },
        form: {
          name: "Nom",
          color: "Couleur",
          greetingMessage: "Message de bienvenue",
          complationMessage: "Message de fin",
          outOfHoursMessage: "Message hors des heures d'ouverture",
          ratingMessage: "Message d'évaluation",
          transferMessage: "Message de transfert",
          token: "Jeton",
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
          attach: "Joindre un fichier",
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
          sunday: "Dimanche",
        },
      },
      userModal: {
        title: {
          add: "Ajouter un utilisateur",
          edit: "Modifier l'utilisateur",
        },
        form: {
          name: "Nom",
          email: "Email",
          password: "Mot de passe",
          profile: "Profil",
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
        },
        success: "Utilisateur enregistré avec succès.",
      },
      scheduleModal: {
        title: {
          add: "Nouveau Planification",
          edit: "Modifier Planification",
        },
        form: {
          body: "Message",
          contact: "Contact",
          sendAt: "Date de Planification",
          sentAt: "Date d'Envoi",
          saveMessage: "Enregistrer le Message dans le Ticket",
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
        },
        success: "Planification enregistrée avec succès.",
      },
      tagModal: {
        title: {
          add: "Nouvelle Étiquette",
          edit: "Modifier Étiquette",
          addKanban: "Nouvelle Lane",
          editKanban: "Modifier Lane",
        },
        form: {
          name: "Nom",
          color: "Couleur",
          kanban: "Kanban",
        },
        buttons: {
          okAdd: "Ajouter",
          okEdit: "Enregistrer",
          cancel: "Annuler",
        },
        success: "Étiquette enregistrée avec succès.",
        successKanban: "Lane enregistrée avec succès.",
      },
      chat: {
        noTicketMessage: "Sélectionnez un ticket pour commencer à discuter.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "GLISSEZ ET DÉPOSEZ LES FICHIERS DANS LE CHAMP CI-DESSOUS",
          titleFileList: "Liste des fichiers",
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nouveau",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Files d'attente",
      },
      tickets: {
        toasts: {
          deleted: "L'intervention que vous gérez a été supprimée.",
        },
        notification: {
          message: "Message de",
        },
        tabs: {
          open: { title: "Ouverts" },
          closed: { title: "Résolus" },
          groups: { title: "Groupes" },
          search: { title: "Recherche" },
        },
        search: {
          placeholder: "Rechercher des interventions et des messages",
        },
        buttons: {
          showAll: "Tous",
        },
      },
      transferTicketModal: {
        title: "Transférer le Ticket",
        fieldLabel: "Tapez pour rechercher des utilisateurs",
        fieldQueueLabel: "Transférer à la file d'attente",
        fieldQueuePlaceholder: "Sélectionnez une file d'attente",
        noOptions: "Aucun utilisateur trouvé avec ce nom",
        buttons: {
          ok: "Transférer",
          cancel: "Annuler",
        },
      },
      ticketsList: {
        pendingHeader: "En attente",
        assignedHeader: "En cours",
        noTicketsTitle: "Rien ici !",
        noTicketsMessage:
          "Aucune intervention trouvée avec ce statut ou ce terme de recherche",
        buttons: {
          accept: "Accepter",
        },
      },
      newTicketModal: {
        title: "Créer un Ticket",
        fieldLabel: "Tapez pour rechercher le contact",
        add: "Ajouter",
        buttons: {
          ok: "Enregistrer",
          cancel: "Annuler",
        },
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
          messagesAPI: "API",
          schedules: "Planifications",
          campaigns: "Campagnes",
          annoucements: "Annonces",
          chats: "Chat Interne",
          financeiro: "Financier",
          logout: "Déconnexion",
          management: "Gestion",
          kanban: "Kanban",
        },
        appBar: {
          i18n: {
            language: "Français",
            language_short: "FR",
          },
          user: {
            profile: "Profil",
            darkmode: "Mode sombre",
            lightmode: "Mode clair",
            language: "Sélectionner la langue",
            about: "À propos",
            logout: "Déconnexion",
          },
        },
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Numéro",
          body: "Message",
          token: "Jeton enregistré",
        },
        mediaMessage: {
          number: "Numéro",
          body: "Nom du fichier",
          media: "Fichier",
          token: "Jeton enregistré",
        },
      },
      notifications: {
        noTickets: "Aucune notification.",
      },
      quickMessages: {
        title: "Réponses Rapides",
        buttons: {
          add: "Nouvelle Réponse",
        },
        dialog: {
          shortcode: "Raccourci",
          message: "Réponse",
        },
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Recherche",
        subMenus: {
          list: "Tableau",
          tags: "Lanes",
        },
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Ouvert",
        confirmationModal: {
          deleteTitle: "Êtes-vous sûr de vouloir supprimer cette Lane ?",
          deleteMessage: "Cette action est irréversible.",
        },
        table: {
          name: "Nom",
          color: "Couleur",
          tickets: "Tickets",
          actions: "Actions",
        },
        buttons: {
          add: "Nouvelle Lane",
        },
        toasts: {
          deleted: "Lane supprimée avec succès.",
        },
      },
      contactLists: {
        title: "Listes de Contacts",
        table: {
          name: "Nom",
          contacts: "Contacts",
          actions: "Actions",
        },
        buttons: {
          add: "Nouvelle Liste",
        },
        dialog: {
          name: "Nom",
          company: "Entreprise",
          okEdit: "Modifier",
          okAdd: "Ajouter",
          add: "Ajouter",
          edit: "Modifier",
          cancel: "Annuler",
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible.",
        },
        toasts: {
          deleted: "Enregistrement supprimé",
          created: "Enregistrement créé",
        },
      },
      contactListItems: {
        title: "Contacts",
        searchPlaceholder: "Recherche",
        buttons: {
          add: "Nouveau",
          lists: "Listes",
          import: "Importer",
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
          cancel: "Annuler",
        },
        table: {
          name: "Nom",
          number: "Numéro",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Actions",
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible.",
          importMessage: "Voulez-vous importer les contacts de cette feuille ?",
          importTitlte: "Importer",
        },
        toasts: {
          deleted: "Enregistrement supprimé",
        },
      },
      campaigns: {
        title: "Campagnes",
        searchPlaceholder: "Recherche",
        buttons: {
          add: "Nouvelle Campagne",
          contactLists: "Listes de Contacts",
        },
        table: {
          name: "Nom",
          whatsapp: "Connexion",
          contactList: "Liste de Contacts",
          status: "Statut",
          scheduledAt: "Planification",
          completedAt: "Complétée",
          confirmation: "Confirmation",
          actions: "Actions",
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
            contactList: "Liste de Contacts",
          },
          buttons: {
            add: "Ajouter",
            edit: "Mettre à jour",
            okadd: "Ok",
            cancel: "Annuler les Envois",
            restart: "Redémarrer les Envois",
            close: "Fermer",
            attach: "Joindre un Fichier",
          },
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible.",
        },
        toasts: {
          success: "Opération réussie",
          cancel: "Campagne annulée",
          restart: "Campagne redémarrée",
          deleted: "Enregistrement supprimé",
        },
      },
      announcements: {
        title: "Annonces",
        searchPlaceholder: "Recherche",
        buttons: {
          add: "Nouvelle Annonce",
          contactLists: "Listes d'Annonces",
        },
        table: {
          priority: "Priorité",
          title: "Titre",
          text: "Texte",
          mediaName: "Fichier",
          status: "Statut",
          actions: "Actions",
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
            status: "Statut",
          },
          buttons: {
            add: "Ajouter",
            edit: "Mettre à jour",
            okadd: "Ok",
            cancel: "Annuler",
            close: "Fermer",
            attach: "Joindre un Fichier",
          },
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage: "Cette action est irréversible.",
        },
        toasts: {
          success: "Opération réussie",
          deleted: "Enregistrement supprimé",
        },
      },
      campaignsConfig: {
        title: "Configurations des Campagnes",
      },
      queues: {
        title: "Files d'attente & Chatbot",
        table: {
          name: "Nom",
          color: "Couleur",
          greeting: "Message de bienvenue",
          actions: "Actions",
        },
        buttons: {
          add: "Ajouter une file d'attente",
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage:
            "Êtes-vous sûr ? Cette action est irréversible ! Les interventions de cette file d'attente continueront d'exister, mais n'auront plus de file d'attente attribuée.",
        },
      },
      queueSelect: {
        inputLabel: "Files d'attente",
      },
      users: {
        title: "Utilisateurs",
        table: {
          name: "Nom",
          email: "Email",
          profile: "Profil",
          actions: "Actions",
        },
        buttons: {
          add: "Ajouter un utilisateur",
        },
        toasts: {
          deleted: "Utilisateur supprimé avec succès.",
        },
        confirmationModal: {
          deleteTitle: "Supprimer",
          deleteMessage:
            "Toutes les données de l'utilisateur seront perdues. Les interventions ouvertes de cet utilisateur seront déplacées vers la file d'attente.",
        },
      },
      helps: {
        title: "Centre d'Aide",
      },
      about: {
        aboutthe: "À propos de",
        copyright: "© 2024 - Fonctionne avec ticketz",
        buttonclose: "Fermer",
        title: "À propos de ticketz",
        abouttitle: "Origine et améliorations",
        aboutdetail: "Le ticketz est dérivé indirectement du projet Whaticket avec des améliorations partagées par les développeurs du système EquipeChat via la chaîne VemFazer sur YouTube, puis améliorées par Claudemir Todo Bom",
        aboutauthorsite: "Site de l'auteur",
        aboutwhaticketsite: "Site de la communauté Whaticket sur Github",
        aboutvemfazersite: "Site de la chaîne Vem Fazer sur Github",
        licenseheading: "Licence Open Source",
        licensedetail: "Le ticketz est sous licence GNU Affero General Public License version 3, ce qui signifie que tout utilisateur ayant accès à cette application a le droit d'accéder au code source. Plus d'informations dans les liens ci-dessous :",
        licensefulltext: "Texte complet de la licence",
        licensesourcecode: "Code source de ticketz",
      },
      schedules: {
        title: "Planifications",
        confirmationModal: {
          deleteTitle: "Êtes-vous sûr de vouloir supprimer cette Planification ?",
          deleteMessage: "Cette action est irréversible.",
        },
        table: {
          contact: "Contact",
          body: "Message",
          sendAt: "Date de Planification",
          sentAt: "Date d'Envoi",
          status: "Statut",
          actions: "Actions",
        },
        buttons: {
          add: "Nouvelle Planification",
        },
        toasts: {
          deleted: "Planification supprimée avec succès.",
        },
      },
      tags: {
        title: "Étiquettes",
        confirmationModal: {
          deleteTitle: "Êtes-vous sûr de vouloir supprimer cette Étiquette ?",
          deleteMessage: "Cette action est irréversible.",
        },
        table: {
          name: "Nom",
          color: "Couleur",
          tickets: "Enregistrements",
          actions: "Actions",
          id: "Id",
          kanban: "Kanban",
        },
        buttons: {
          add: "Nouvelle Étiquette",
        },
        toasts: {
          deleted: "Étiquette supprimée avec succès.",
        },
      },
      settings: {
        group: {
          general: "Général",
          timeouts: "Temps d'attente",
          officeHours: "Heures de bureau",
          groups: "Groupes",
          confidenciality: "Confidentialité",
          api: "API",
          serveradmin: "Administration du serveur",
        },
        success: "Paramètres enregistrés avec succès.",
        title: "Paramètres",
        settings: {
          userCreation: {
            name: "Création d'utilisateur",
            options: {
              enabled: "Activé",
              disabled: "Désactivé",
            },
          },
        },
        validations: {
          title: "Évaluations",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        OfficeManagement: {
          title: "Gestion des Heures de Bureau",
          options: {
            disabled: "Désactivé",
            ManagementByDepartment: "Gestion par File d'attente",
            ManagementByCompany: "Gestion par Entreprise",
          },
        },
        outOfHoursAction: {
          title: "Action hors des heures de bureau",
          options: {
            pending: "Laisser en attente",
            closed: "Fermer le ticket",
          },
        },
        IgnoreGroupMessages: {
          title: "Ignorer les Messages de Groupe",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        soundGroupNotifications: {
          title: "Notifications sonores de groupe",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        groupsTab: {
          title: "Onglet Groupes",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        VoiceAndVideoCalls: {
          title: "Appels Vocaux et Vidéo",
          options: {
            enabled: "Ignorer",
            disabled: "Informer de l'indisponibilité",
          },
        },
        AutomaticChatbotOutput: {
          title: "Sortie automatique du chatbot",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        ShowNumericEmoticons: {
          title: "Afficher les émojis numériques dans la file d'attente",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        QuickMessages: {
          title: "Messages Rapides",
          options: {
            enabled: "Par entreprise",
            disabled: "Par Utilisateur",
          },
        },
        AllowRegistration: {
          title: "Autoriser l'inscription",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        FileDownloadLimit: {
          title: "Limite de Téléchargement de fichiers (MB)",
        },
        messageVisibility: {
          title: "Visibilité du message",
          options: {
            respectMessageQueue: "Respecter la file d'attente du message",
            respectTicketQueue: "Respecter la file d'attente du ticket",
          },
        },
        keepQueueAndUser: {
          title: "Maintenir la file d'attente et l'utilisateur dans le ticket fermé",
          options: {
            enabled: "Activé",
            disabled: "Désactivé",
          },
        },
        WelcomeGreeting: {
          greetings: "Bonjour",
          welcome: "Bienvenue à",
          expirationTime: "Actif jusqu'à",
        },
        Options: {
          title: "Options",
        },
        Companies: {
          title: "Entreprises",
        },
        schedules: {
          title: "Horaires",
        },
        Plans: {
          title: "Plans",
        },
        Help: {
          title: "Aide",
        },
        Whitelabel: {
          title: "Marque blanche",
        },
        PaymentGateways: {
          title: "Passerelles de paiement",
        },
      },
      messagesList: {
        header: {
          assignedTo: "Attribué à :",
          buttons: {
            return: "Retourner",
            resolve: "Résoudre",
            reopen: "Rouvrir",
            accept: "Accepter",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Tapez un message",
        placeholderClosed:
          "Rouvrez ou acceptez ce ticket pour envoyer un message.",
        signMessage: "Signer",
        replying: "Répondre",
        editing: "Modifier",
      },
      message: {
        edited: "Modifié",
      },
      contactDrawer: {
        header: "Informations du contact",
        buttons: {
          edit: "Modifier le contact",
        },
        extraInfo: "Autres informations",
      },
      ticketOptionsMenu: {
        schedule: "Planification",
        delete: "Supprimer",
        transfer: "Transférer",
        registerAppointment: "Observations du Contact",
        appointmentsModal: {
          title: "Observations du Contact",
          textarea: "Observation",
          placeholder: "Insérez ici les informations que vous souhaitez enregistrer",
        },
        confirmationModal: {
          title: "Supprimer le ticket du contact",
          message:
            "Attention ! Tous les messages liés au ticket seront perdus.",
        },
        buttons: {
          delete: "Supprimer",
          cancel: "Annuler",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Annuler",
        },
      },
      messageOptionsMenu: {
        delete: "Supprimer",
        edit: "Modifier",
        history: "Historique",
        reply: "Répondre",
        confirmationModal: {
          title: "Supprimer le message ?",
          message: "Cette action est irréversible.",
        },
      },
      messageHistoryModal: {
        close: "Fermer",
        title: "Historique des modifications du message",
      },
      presence: {
        unavailable: "Indisponible",
        available: "Disponible",
        composing: "En train de taper...",
        recording: "En train d'enregistrer...",
        paused: "En pause",
      },
      privacyModal: {
        title: "Modifier la Confidentialité de WhatsApp",
        buttons: {
          cancel: "Annuler",
          okEdit: "Enregistrer",
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
            dias90: "90 Jours",
          },
          readreceipts: "Pour mettre à jour la confidentialité des accusés de lecture",
          profile: "Pour mettre à jour la confidentialité de la photo de profil",
          status: "Pour mettre à jour la confidentialité des statuts",
          online: "Pour mettre à jour la confidentialité en ligne",
          last: "Pour mettre à jour la confidentialité du Dernier Vu",
          groupadd: "Pour mettre à jour la confidentialité de l'ajout aux groupes",
          calladd: "Pour mettre à jour la confidentialité de l'ajout aux appels",
          disappearing: "Pour mettre à jour le Mode Disparition par Défaut",
        },
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP: "Il doit y avoir au moins un WhatsApp par défaut.",
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
        ERR_SESSION_EXPIRED: "Session expirée. Veuillez vous reconnecter.",
        ERR_USER_CREATION_DISABLED:
          "La création d'utilisateur a été désactivée par l'administrateur.",
        ERR_NO_PERMISSION: "Vous n'avez pas la permission d'accéder à cette fonctionnalité.",
        ERR_DUPLICATED_CONTACT: "Il existe déjà un contact avec ce numéro.",
        ERR_NO_SETTING_FOUND: "Aucun paramètre trouvé avec cet ID.",
        ERR_NO_CONTACT_FOUND: "Aucun contact trouvé avec cet ID.",
        ERR_NO_TICKET_FOUND: "Aucun ticket trouvé avec cet ID.",
        ERR_NO_USER_FOUND: "Aucun utilisateur trouvé avec cet ID.",
        ERR_NO_WAPP_FOUND: "Aucun WhatsApp trouvé avec cet ID.",
        ERR_CREATING_MESSAGE: "Erreur lors de la création du message dans la base de données.",
        ERR_CREATING_TICKET: "Erreur lors de la création du ticket dans la base de données.",
        ERR_FETCH_WAPP_MSG:
          "Erreur lors de la récupération du message sur WhatsApp, il est peut-être trop ancien.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Cette couleur est déjà utilisée, choisissez-en une autre.",
        ERR_WAPP_GREETING_REQUIRED:
          "Le message de bienvenue est obligatoire lorsqu'il y a plus d'une file d'attente.",
      },
      ticketz: {
        registration: {
          header: "Inscrivez-vous à la base d'utilisateurs de Ticketz",
          description: "Remplissez les champs ci-dessous pour vous inscrire à la base d'utilisateurs de Ticketz et recevoir des nouvelles sur le projet.",
          name: "Nom",
          country: "Pays",
          phoneNumber: "Numéro WhatsApp",
          submit: "S'inscrire",
        },
        support: {
          title: "Soutenez le projet Ticketz Open Source",
          mercadopagotitle: "Carte de Crédit",
          recurringbrl: "Don récurrent en R$",
          paypaltitle: "Carte de Crédit",
          international: "International en US$",
        },
      },
    },
  },
};

export { messages };
