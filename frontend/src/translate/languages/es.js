const messages = {
  es: {
    translations: {
      common: {
        search: "Buscar",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Guardar",
        confirm: "Confirmar",
        close: "Cerrar",
        error: "Error",
        success: "Éxito",
        actions: "Acciones",
        add: "Añadir",
        name: "Nombre",
        email: "Correo electrónico",
        phone: "Teléfono",
        company: "Empresa",
        user: "Usuario",
        connection: "Conexión",
        queue: "Cola",
        contact: "Contacto",
        whatsappNumber: "Número de WhatsApp",
        dueDate: "Fecha de vencimiento",
        copy: "Copiar",
        paste: "Pegar",
        proceed: "Proceder",
        enabled: "Activado",
        disabled: "Desactivado",
        noqueue: "Sin cola",
        rating: "Calificación",
        transferTo: "Transferir a",
      },
      signup: {
        title: "Registrarse",
        toasts: {
          success: "Usuario creado con éxito. ¡Inicia sesión ahora!",
          fail: "Error al crear usuario. Verifica los datos proporcionados.",
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
        },
        buttons: {
          submit: "Registrarse",
          login: "¿Ya tienes una cuenta? ¡Inicia sesión!",
        },
      },
      login: {
        title: "Iniciar sesión",
        form: {
          email: "Correo electrónico",
          password: "Contraseña",
        },
        buttons: {
          submit: "Entrar",
          register: "¿No tienes una cuenta? ¡Regístrate!",
        },
      },
      companies: {
        title: "Registrar Empresa",
        form: {
          name: "Nombre de la Empresa",
          plan: "Plan",
          token: "Token",
          submit: "Registrar",
          success: "Empresa creada con éxito",
        },
      },
      auth: {
        toasts: {
          success: "Inicio de sesión exitoso",
        },
        token: "Token",
      },
      dashboard: {
        usersOnline: "Usuarios en línea",
        ticketsOpen: "Atenciones abiertas",
        ticketsDone: "Atenciones resueltas",
        totalTickets: "Total de atenciones",
        newContacts: "Nuevos contactos",
        avgServiceTime: "Tiempo promedio de atención",
        avgWaitTime: "Tiempo promedio de espera",
        ticketsOnPeriod: "Atenciones en el período",
        userCurrentStatus: "Estado (Actual)",
        filter: {
          period: "Período",
          custom: "Personalizado",
          last3days: "Últimos 3 días",
          last7days: "Últimos 7 días",
          last14days: "Últimos 14 días",
          last30days: "Últimos 30 días",
          last90days: "Últimos 90 días"
        },
        date: {
          start: "Fecha de inicio",
          end: "Fecha de fin",
        },
        ticketCountersLabels: {
          created: "Creado",
          closed: "Cerrado",
        },
        ticketzPro: {
          title: "Ticketz PRO",
          features1: "Whatsapp Oficial - Instagram - Messenger y otros",
          features2: "Características exclusivas - Soporte Avanzado - Migración Facilitada",
          price: "Suscríbete por R$ 199/mes",
          note: "directamente en el sistema",
          upgrade: "Haz clic para instrucciones de Upgrade",
          visit: "¡Haz clic para visitar el sitio!",
          upgradeInstructions: {
            title: "Instrucciones de Actualización",
            paragraph1: "Si instalaste las imágenes proporcionadas por el proyecto en un servidor o VPS usando las instrucciones simplificadas, todo lo que necesitas hacer es acceder a tu servidor y escribir el siguiente comando:",
            command: "curl -sSL update.ticke.tz | sudo bash -s pro",
            paragraph2: "En unos momentos, Ticketz PRO estará instalado con todos tus datos. Ahora solo ve al menú de usuario, haz clic en 'Suscripción Ticketz PRO' y completa tu suscripción.",
            paragraph3: "Si tu instalación es diferente o necesitas ayuda para instalar Ticketz Pro, ",
            paragraph4: "contáctanos y te ayudaremos.",
          },
        },
      },
      connections: {
        title: "Conexiones",
        toasts: {
          deleted: "Conexión con WhatsApp eliminada con éxito",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? Esta acción no se puede deshacer.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "¿Estás seguro? Tendrás que escanear el código QR nuevamente.",
        },
        buttons: {
          add: "Agregar WhatsApp",
          disconnect: "Desconectar",
          tryAgain: "Intentar nuevamente",
          qrcode: "CÓDIGO QR",
          newQr: "Nuevo CÓDIGO QR",
          connecting: "Conectando",
        },
        toolTips: {
          disconnected: {
            title: "Error al iniciar sesión en WhatsApp",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y vuelve a intentarlo o solicita un nuevo código QR.",
          },
          qrcode: {
            title: "Esperando lectura del código QR",
            content:
              "Haz clic en el botón 'CÓDIGO QR' y escanea el código QR con tu teléfono para iniciar la sesión.",
          },
          connected: {
            title: "Conexión establecida",
          },
          timeout: {
            title: "Se perdió la conexión con el teléfono",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y WhatsApp esté abierto, o haz clic en 'Desconectar' para obtener un nuevo código QR.",
          },
          refresh: "Actualizar",
          disconnect: "Desconectar",
          scan: "Escanear",
          newQr: "Nuevo Código QR",
          retry: "Intentar nuevamente",
        },
        table: {
          name: "Nombre",
          status: "Estado",
          lastUpdate: "Última actualización",
          default: "Predeterminado",
          actions: "Acciones",
          session: "Sesión",
        },
      },
      internalChat: {
        title: "Chat Interno",
      },
      whatsappModal: {
        title: {
          add: "Agregar WhatsApp",
          edit: "Editar WhatsApp",
        },
        form: {
          name: "Nombre",
          default: "Predeterminado",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "WhatsApp guardado con éxito.",
      },
      qrCode: {
        message: "Lee el código QR para iniciar la sesión",
      },
      contacts: {
        title: "Contactos",
        toasts: {
          deleted: "Contacto eliminado con éxito",
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Eliminar ",
          importTitlte: "Importar contactos",
          deleteMessage:
            "¿Estás seguro de que deseas eliminar este contacto? Se perderán todas las conversaciones relacionadas.",
          importMessage: "¿Quieres importar todos los contactos del teléfono?",
        },
        buttons: {
          import: "Importar Contactos",
          add: "Agregar Contacto",
        },
        table: {
          name: "Nombre",
          whatsapp: "WhatsApp",
          email: "Correo electrónico",
          actions: "Acciones",
        },
      },
      contactModal: {
        title: {
          add: "Agregar contacto",
          edit: "Editar contacto",
        },
        form: {
          mainInfo: "Datos del contacto",
          extraInfo: "Información adicional",
          name: "Nombre",
          number: "Número de WhatsApp",
          email: "Correo electrónico",
          extraName: "Nombre del campo",
          extraValue: "Valor",
          disableBot: "Desativar bot de conversa",
        },
        buttons: {
          addExtraInfo: "Agregar información",
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Contacto guardado con éxito.",
      },
      queueModal: {
        title: {
          add: "Agregar fila",
          edit: "Editar fila",
        },
        form: {
          name: "Nombre",
          color: "Color",
          greetingMessage: "Mensaje de bienvenida",
          complationMessage: "Mensaje de conclusión",
          outOfHoursMessage: "Mensaje fuera del horario",
          ratingMessage: "Mensaje de calificación",
          transferMessage: "Mensaje de transferencia",
          token: "Token",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
          attach: "Adjuntar archivo",
        },
        serviceHours: {
          dayWeek: "Día de la semana",
          startTimeA: "Hora de inicio - Turno A",
          endTimeA: "Hora de finalización - Turno A",
          startTimeB: "Hora de inicio - Turno B",
          endTimeB: "Hora de finalización - Turno B",
          monday: "Lunes",
          tuesday: "Martes",
          wednesday: "Miércoles",
          thursday: "Jueves",
          friday: "Viernes",
          saturday: "Sábado",
          sunday: "Domingo",
        },
      },
      userModal: {
        title: {
          add: "Agregar usuario",
          edit: "Editar usuario",
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
          profile: "Perfil",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Usuario guardado con éxito.",
      },
      scheduleModal: {
        title: {
          add: "Nuevo Agendamiento",
          edit: "Editar Agendamiento",
        },
        form: {
          body: "Mensaje",
          contact: "Contacto",
          sendAt: "Fecha de Agendamiento",
          sentAt: "Fecha de Envío",
          saveMessage: "Guardar mensaje en el ticket",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Agendamiento guardado con éxito.",
      },
      tagModal: {
        title: {
          add: "Nueva Etiqueta",
          edit: "Editar Etiqueta",
          addKanban: "Nueva Columna",
          editKanban: "Editar Columna",
        },
        form: {
          name: "Nombre",
          color: "Color",
          kanban: "Kanban",
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Etiqueta guardada con éxito.",
        successKanban: "Columna guardada con éxito.",
      },
      chat: {
        noTicketMessage: "Selecciona un ticket para empezar a conversar.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTRA Y SUELTA ARCHIVOS EN EL CAMPO ABAJO",
          titleFileList: "Lista de archivo(s)"
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuevo",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Colas",
      },
      tickets: {
        toasts: {
          deleted: "La atención que estabas siguiendo fue eliminada.",
        },
        notification: {
          message: "Mensaje de",
        },
        tabs: {
          open: { title: "Abiertas" },
          closed: { title: "Resueltos" },
          groups: { title: "Grupos" },
          search: { title: "Búsqueda" },
        },
        search: {
          placeholder: "Buscar atención y mensajes",
        },
        buttons: {
          showAll: "Todos",
        },
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Escribe para buscar usuarios",
        fieldQueueLabel: "Transferir a cola",
        fieldQueuePlaceholder: "Selecciona una cola",
        noOptions: "Ningún usuario encontrado con ese nombre",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar",
        },
      },
      ticketsList: {
        pendingHeader: "Esperando",
        assignedHeader: "Atendiendo",
        noTicketsTitle: "¡Nada aquí!",
        noTicketsMessage:
          "No se encontraron atenciones con ese estado o término de búsqueda",
        buttons: {
          accept: "Aceptar",
        },
      },
      newTicketModal: {
        title: "Crear Ticket",
        fieldLabel: "Escribe para buscar el contacto",
        add: "Agregar",
        buttons: {
          ok: "Guardar",
          cancel: "Cancelar",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Tablero",
          connections: "Conexiones",
          tickets: "Atenciones",
          quickMessages: "Respuestas Rápidas",
          contacts: "Contactos",
          queues: "Filas y Chatbot",
          tags: "Etiquetas",
          administration: "Administración",
          service: "Atención",
          users: "Usuarios",
          settings: "Configuraciones",
          helps: "Ayuda",
          messagesAPI: "API",
          schedules: "Agendamientos",
          campaigns: "Campañas",
          annoucements: "Anuncios",
          chats: "Chat Interno",
          financeiro: "Financiero",
          logout: "Cerrar sesión",
          management: "Gerencia",
          kanban: "Kanban",
        },
        appBar: {
          i18n: {
            language: "Español",
            language_short: "ES"
          },
          user: {
            profile: "Perfil",
            darkmode: "Modo oscuro",
            lightmode: "Modo claro",
            language: "Seleccionar idioma",
            logout: "Cerrar sesión",
          },
        },
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensaje",
          token: "Token registrado",
        },
        mediaMessage: {
          number: "Número",
          body: "Nombre del archivo",
          media: "Archivo",
          token: "Token registrado",
        },
      },
      notifications: {
        noTickets: "Ninguna notificación.",
      },
      quickMessages: {
        title: "Respuestas Rápidas",
        buttons: {
          add: "Nueva Respuesta",
        },
        dialog: {
          shortcode: "Atajo",
          message: "Respuesta",
        },
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Búsqueda",
        subMenus: {
          list: "Panel",
          tags: "Lanes",
        },
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "En abierto",
        confirmationModal: {
          deleteTitle: "¿Estás seguro de que quieres eliminar esta Lane?",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Tickets",
          actions: "Acciones",
        },
        buttons: {
          add: "Nueva Lane",
        },
        toasts: {
          deleted: "Lane eliminada con éxito.",
        },
      },
      contactLists: {
        title: "Listas de Contactos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acciones",
        },
        buttons: {
          add: "Nueva Lista",
        },
        dialog: {
          name: "Nombre",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        toasts: {
          deleted: "Registro eliminado",
          created: "Registro creado",
        },
      },
      contactListItems: {
        title: "Contactos",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo",
          lists: "Listas",
          import: "Importar",
        },
        dialog: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        table: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          actions: "Acciones",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
          importMessage: "¿Desea importar los contactos de esta hoja de cálculo?",
          importTitlte: "Importar",
        },
        toasts: {
          deleted: "Registro eliminado",
        },
      },
      campaigns: {
        title: "Campañas",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nueva Campaña",
          contactLists: "Listas de Contactos",
        },
        table: {
          name: "Nombre",
          whatsapp: "Conexión",
          contactList: "Lista de Contactos",
          status: "Estado",
          scheduledAt: "Agendamiento",
          completedAt: "Completada",
          confirmation: "Confirmación",
          actions: "Acciones",
        },
        dialog: {
          new: "Nueva Campaña",
          update: "Editar Campaña",
          readonly: "Solo Lectura",
          form: {
            name: "Nombre",
            message1: "Mensaje 1",
            message2: "Mensaje 2",
            message3: "Mensaje 3",
            message4: "Mensaje 4",
            message5: "Mensaje 5",
            confirmationMessage1: "Mensaje de Confirmación 1",
            confirmationMessage2: "Mensaje de Confirmación 2",
            confirmationMessage3: "Mensaje de Confirmación 3",
            confirmationMessage4: "Mensaje de Confirmación 4",
            confirmationMessage5: "Mensaje de Confirmación 5",
            messagePlaceholder: "Contenido del mensaje",
            whatsapp: "Conexión",
            status: "Estado",
            scheduledAt: "Agendamiento",
            confirmation: "Confirmación",
            contactList: "Lista de Contacto",
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Cerrar",
            attach: "Adjuntar Archivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        toasts: {
          success: "Operación realizada con éxito",
          cancel: "Campaña cancelada",
          restart: "Campaña reiniciada",
          deleted: "Registro eliminado",
        },
      },
      announcements: {
        title: "Anuncios",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo Anuncio",
          contactLists: "Listas de Anuncios",
        },
        table: {
          priority: "Prioridad",
          title: "Título",
          text: "Texto",
          mediaName: "Archivo",
          status: "Estado",
          actions: "Acciones",
        },
        dialog: {
          edit: "Edición de Anuncio",
          add: "Nuevo Anuncio",
          update: "Editar Anuncio",
          readonly: "Solo Lectura",
          form: {
            priority: "Prioridad",
            title: "Título",
            text: "Texto",
            mediaPath: "Archivo",
            status: "Estado",
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Cerrar",
            attach: "Adjuntar Archivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        toasts: {
          success: "Operación realizada con éxito",
          deleted: "Registro eliminado",
        },
      },
      campaignsConfig: {
        title: "Configuraciones de Campañas",
      },
      queues: {
        title: "Colas y Chatbot",
        table: {
          name: "Nombre",
          color: "Color",
          greeting: "Mensaje de bienvenida",
          actions: "Acciones",
        },
        buttons: {
          add: "Agregar cola",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "¿Estás seguro? ¡Esta acción no se puede deshacer! Las atenciones de esta cola seguirán existiendo, pero ya no tendrán ninguna cola asignada.",
        },
      },
      queueSelect: {
        inputLabel: "Colas",
      },
      users: {
        title: "Usuarios",
        table: {
          name: "Nombre",
          email: "Correo electrónico",
          profile: "Perfil",
          actions: "Acciones",
        },
        buttons: {
          add: "Agregar usuario",
        },
        toasts: {
          deleted: "Usuario eliminado con éxito.",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Todos los datos del usuario se perderán. Las atenciones abiertas de este usuario se moverán a la cola.",
        },
      },
      helps: {
        title: "Centro de Ayuda",
      },
      about: {
        aboutthe: "Acerca de",
        copyright: "© 2024 - Funcionando com ticketz",
        buttonclose: "Cerrar",
        title: "Acerca de ticketz",
        abouttitle: "Origen y Mejoras",
        aboutdetail: "El ticketz es derivado indirecto del proyecto Whaticket con mejoras compartidas por los desarrolladores del sistema EquipeChat a través del canal VemFazer en YouTube, posteriormente mejorado por Claudemir Todo Bom.",
        aboutauthorsite: "Sitio del autor",
        aboutwhaticketsite: "Sitio de la Comunidad Whaticket en Github",
        aboutvemfazersite: "Sitio del canal Vem Fazer en Github",
        licenseheading: "Licencia de Código Abierto",
        licensedetail: "El ticketz está licenciado bajo la Licencia Pública General Affero de GNU versión 3, lo que significa que cualquier usuario que tenga acceso a esta aplicación tiene derecho a obtener acceso al código fuente. Más información en los siguientes enlaces:",
        licensefulltext: "Texto completo de la licencia",
        licensesourcecode: "Código fuente de ticketz"
      },
      schedules: {
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "¿Está seguro de que desea eliminar esta programación?",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        table: {
          contact: "Contacto",
          body: "Mensaje",
          sendAt: "Fecha de Programación",
          sentAt: "Fecha de Envío",
          status: "Estado",
          actions: "Acciones",
        },
        buttons: {
          add: "Nuevo Agendamiento",
        },
        toasts: {
          deleted: "Agendamiento eliminado con éxito.",
        },
      },
      tags: {
        title: "Etiquetas",
        confirmationModal: {
          deleteTitle: "¿Está seguro de que quiere eliminar esta etiqueta?",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Registros",
          actions: "Acciones",
          id: "ID",
          kanban: "Kanban",
        },
        buttons: {
          add: "Nueva Etiqueta",
        },
        toasts: {
          deleted: "Etiqueta eliminada con éxito.",
        },
      },
      whitelabel: {
        primaryColorLight: "Color primario claro",
        primaryColorDark: "Color primario oscuro",
        lightLogo: "Logo de la aplicación claro",
        darkLogo: "Logo de la aplicación oscuro",
        favicon: "Favicon de la aplicación",
        appname: "Nombre de la aplicación",
        logoHint: "Prefiera SVG y aspecto de 28:10",
        faviconHint: "Prefiera imagen SVG cuadrada o PNG de 512x512",
      },
      settings: {
        group: {
          general: "General",
          timeouts: "Tiempos de espera",
          officeHours: "Horas de oficina",
          groups: "Grupos",
          confidenciality: "Confidencialidad",
          api: "API",
          externalServices: "Servicios externos",
          serveradmin: "Administración del servidor",
        },
        success: "Configuraciones guardadas exitosamente.",
        copiedToClipboard: "Copiado al portapapeles",
        title: "Configuraciones",
        chatbotTicketTimeout: "Tiempo de espera del ticket del chatbot (minutos)",
        chatbotTicketTimeoutAction: "Acción después del tiempo de espera",
        settings: {
          userCreation: {
            name: "Creación de usuario",
            options: {
              enabled: "Habilitado",
              disabled: "Deshabilitado",
            },
          },
        },
        validations: {
          title: "Validaciones",
          options: {
            enabled: "Habilitado",
            disabled: "Deshabilitado",
          },
        },
        OfficeManagement: {
          title: "Gestión de despachos",
          options: {
            disabled: "Deshabilitado",
            ManagementByDepartment: "Gestión por departamento",
            ManagementByCompany: "Gestión por empresa",
          },
        },
        outOfHoursAction: {
          title: "Acción fuera del horario",
          options: {
            pending: "Dejar pendiente",
            closed: "Cerrar ticket",
          },
        },
        IgnoreGroupMessages: {
          title: "Ignorar mensajes de grupo",
          options: {
            enabled: "Activado",
            disabled: "Desactivado",
          },
        },
        soundGroupNotifications: {
          title: "Notificaciones de sonido de grupo",
          options: {
            enabled: "Activado",
            disabled: "Desactivado",
          },
        },
        groupsTab: {
          title: "Pestaña de grupos",
          options: {
            enabled: "Activado",
            disabled: "Desactivado",
          },
        },
        VoiceAndVideoCalls: {
          title: "Llamadas de voz y vídeo",
          options: {
            enabled: "Ignorar",
            disabled: "informe de indisponibilidad",
          },
        },
        AutomaticChatbotOutput: {
          title: "Salida automática del chatbot",
          options: {
            enabled: "Activado",
            disabled: "Desactivado",
          },
        },
        ShowNumericEmoticons: {
          title: "Mostrar emojis numéricos en la cola",
          options: {
            enabled: "Activado",
            disabled: "Desactivado",
          },
        },
        QuickMessages: {
          title: "Respuestas rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Usuario",
          },
        },
        AllowRegistration: {
          title: "Permitir el registro",
          options: {
            enabled: "Activado",
            disabled: "Desactivado",
          },
        },
        FileUploadLimit: {
          title: "Límite de carga de archivos (MB)",
        },
        FileDownloadLimit: {
          title: "Límite de descarga de archivos (MB)",
        },
        "messageVisibility": {
          "title": "Visibilidad del mensaje",
          "options": {
            "respectMessageQueue": "Respetar fila de mensajes",
            "respectTicketQueue": "Respetar fila de tickets"
          }
        },
        "removeQueueAndUser": {
          "title": "Mantener fila y usuario en ticket cerrado",
          "options": {
            enabled: "Activado",
            disabled: "Desactivado",
          }
        },
        WelcomeGreeting: {
          greetings: "hola",
          welcome: "bienvenido a",
          expirationTime: "Activo hasta",
        },
        Options: {
          title: "Opciones",
        },
        Companies: {
          title: "Empresas",
        },
        schedules: {
          title: "horarios",
        },
        Plans: {
          title: "Planes",
        },
        Help: {
          title: "Ayuda",
        },
        Whitelabel: {
          title: "Whitelabel",
        },
        PaymentGateways: {
          title: "Payment gateways",
        },
        AIProvider: {
          title: "Proveedor de IA",
        },
        AudioTranscriptions: {
          title: "Transcripciones de audio",
        },
        TagsMode: {
          title: "Modo de etiquetas",
          options: {
            ticket: "Ticket",
            contact: "Contacto",
            both: "Ticket y contacto",
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Asignado a:",
          buttons: {
            return: "Regresar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceptar",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Ingrese un mensaje",
        placeholderClosed:
          "Reabra o acepte este ticket para enviar un mensaje.",
        signMessage: "Firmar",
        replying: "Respondiendo",
        editing: "Editando",
      },
      message: {
        edited: "Editada",
        forwarded: "Reenviado",
      },
      contactDrawer: {
        header: "Datos de contacto",
        buttons: {
          edit: "Editar contacto",
        },
        extraInfo: "Otra información",
      },
      ticketOptionsMenu: {
        schedule: "Agendamiento",
        delete: "Eliminar",
        transfer: "Transferir",
        registerAppointment: "Observaciones del Contacto",
        appointmentsModal: {
          title: "Observaciones del Contacto",
          textarea: "Observación",
          placeholder: "Ingrese aquí la información que desea registrar",
        },
        confirmationModal: {
          title: "Eliminar el ticket del contacto",
          message:
            "¡Atención! Todas las mensajes relacionados con el ticket se perderán.",
        },
        buttons: {
          delete: "Eliminar",
          cancel: "Cancelar",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancelar",
        },
      },
      messageOptionsMenu: {
        delete: "Eliminar",
        edit: "Editar",
        forward: "Reenviar",
        history: "Historial",
        reply: "Responder",
        confirmationModal: {
          title: "¿Borrar mensaje?",
          message: "Esta acción no se puede deshacer.",
        },
      },
      messageHistoryModal: {
        close: "Cerrar",
        title: "Historial de edición del mensaje"
      },
      presence: {
        unavailable: "Indisponible",
        available: "Disponible",
        composing: "Componiendo",
        recording: "Grabando",
        paused: "Pausado",
      },
      privacyModal: {
        title: "Editar privacidad de Whatsapp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Ahorrar",
        },
        form: {
          menu: {
            all: "Todo",
            none: "Nadie",
            contacts: "Mis contactos",
            contact_blacklist: "Contactos seleccionados",
            match_last_seen: "Partido visto por última vez",
            known: "Conocido",
            disable: "Desactivado",
            hrs24: "24 Horas",
            dias7: "7 Días",
            dias90: "90 Días",
          },
          readreceipts:
            "Para actualizar la privacidad de Confirmaciones de lectura",
          profile: "Para actualizar la privacidad de la foto de perfil",
          status: "Para actualizar la privacidad del mensajes",
          online: "Para actualizar la privacidad en línea",
          last: "Para actualizar la privacidad de Última visita",
          groupadd: "Para actualizar la privacidad de Agregar grupos",
          calladd: "Para actualizar la privacidad de Agregar llamada",
          disappearing:
            "Para actualizar el modo de desaparición predeterminado",
        },
      },
      backendErrors: {
        ERR_FORBIDDEN: "No tienes permisos para acceder a este recurso.",
        ERR_CHECK_NUMBER: "No se pudo verificar el número de WhatsApp.",
        ERR_NO_OTHER_WHATSAPP: "Debe haber al menos un WhatsApp predeterminado.",
        ERR_NO_DEF_WAPP_FOUND:
          "No se encontró ningún WhatsApp predeterminado. Verifique la página de conexiones.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sesión de WhatsApp no se ha inicializado. Verifique la página de conexiones.",
        ERR_WAPP_CHECK_CONTACT:
          "No se pudo verificar el contacto de WhatsApp. Verifique la página de conexiones",
        ERR_WAPP_INVALID_CONTACT: "Este no es un número de WhatsApp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "No se pudo descargar medios de WhatsApp. Verifique la página de conexiones.",
        ERR_INVALID_CREDENTIALS:
          "Error de autenticación. Por favor, inténtelo de nuevo.",
        ERR_SENDING_WAPP_MSG:
          "Error al enviar mensaje de WhatsApp. Verifique la página de conexiones.",
        ERR_DELETE_WAPP_MSG: "No se pudo eliminar el mensaje de WhatsApp.",
        ERR_EDITING_WAPP_MSG: "No se pudo editar el mensaje de WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Ya hay un ticket abierto para este contacto.",
        ERR_SESSION_EXPIRED: "Sesión expirada. Por favor, inicie sesión.",
        ERR_USER_CREATION_DISABLED:
          "La creación de usuarios está deshabilitada por el administrador.",
        ERR_NO_PERMISSION: "No tiene permisos para acceder a este recurso.",
        ERR_DUPLICATED_CONTACT: "Ya existe un contacto con este número.",
        ERR_NO_SETTING_FOUND: "No se encontró ninguna configuración con este ID.",
        ERR_NO_CONTACT_FOUND: "No se encontró ningún contacto con este ID.",
        ERR_NO_TICKET_FOUND: "No se encontró ningún ticket con este ID.",
        ERR_NO_USER_FOUND: "No se encontró ningún usuario con este ID.",
        ERR_NO_WAPP_FOUND: "No se encontró ningún WhatsApp con este ID.",
        ERR_CREATING_MESSAGE: "Error al crear el mensaje en la base de datos.",
        ERR_CREATING_TICKET: "Error al crear el ticket en la base de datos.",
        ERR_FETCH_WAPP_MSG:
          "Error al recuperar el mensaje de WhatsApp, tal vez sea muy antiguo.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Este color ya está en uso, elija otro.",
        ERR_WAPP_GREETING_REQUIRED:
          "El mensaje de saludo es obligatorio cuando hay más de una cola.",
      },
      ticketz: {
        registration: {
          header: "Regístrate en la base de usuarios de Ticketz",
          description: "Complete los campos a continuación para registrarse en la base de usuarios de Ticketz y recibir noticias sobre el proyecto.",
          name: "Nombre",
          country: "País",
          phoneNumber: "Whatsapp Teléfono",
          submit: "Registrar",
        },
        support: {
          title: "Apoyar el proyecto Ticketz",
          mercadopagotitle: "Tarjeta de crédito",
          recurringbrl: "Donaciones recurrentes en BRL",
          paypaltitle: "Tarjeta de crédito",
          international: "Donaciones en USD",
        }
      },
      owenAd: {
        title: "Owen Payments apoya a Ticketz",
        description1: "La startup Owen Payments ofrece pagos PIX a un costo fijo de R$ 0,99 por transacción.",
        description2: "Una parte del valor de cada transacción se destina al proyecto Ticketz, por lo que al utilizar este método de pago también estarás apoyando el proyecto.",
        description3: '¡Selecciona la pasarela de pago "Owen Payments 💎" y solicita la apertura de tu cuenta sin salir de Ticketz!'
      },
    },
  },
};

export { messages };
