const messages = {
  es: {
    translations: {
      visual: {
        visualizar: "Ver",
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
          "Fin del flujo. La atención queda disponible para el equipo humano.",
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
        settingsTab: "Llamadas experimentales",
        companySwitch: "Llamadas experimentales",
        enabled: "Habilitadas",
        disabled: "Deshabilitadas",
        experimentalTitle: "Integración experimental de llamadas",
        warning:
          "Integración no oficial con WhatsApp. Existe riesgo de desconexión, suspensión o bloqueo. Úsala solo en el tenant de pruebas.",
        serviceUnavailable:
          "El servicio de llamadas no está disponible en este momento.",
        riskConsent:
          "Comprendo el riesgo y quiero vincular un segundo dispositivo mediante código QR.",
        status: "Estado",
        disconnect: "Apagar y desvincular",
        pair: "Vincular con código QR",
        noConnections:
          "Crea primero una conexión de WhatsApp para configurar llamadas.",
        qrInstruction:
          "En WhatsApp, abre Dispositivos vinculados y escanea este segundo código QR.",
        disconnectedSuccess: "Integración de llamadas desvinculada.",
        incoming: "Llamada entrante",
        incomingHint: "El primer agente que acepte atenderá la llamada.",
        reject: "Rechazar",
        accept: "Contestar",
        active: "Llamada en curso",
        mute: "Silenciar micrófono",
        transcribe: "Transcribir llamada",
        record: "Grabar llamada",
        end: "Finalizar",
        states: {
          disconnected: "Desconectada",
          pairing: "Esperando código QR",
          connecting: "Conectando",
          open: "Conectada",
          logged_out: "Desvinculada"
        },
        errors: {
          load: "No se pudieron cargar las llamadas experimentales.",
          pair: "No se pudo generar el código QR de llamadas.",
          action: "No se pudo completar la acción de llamada.",
          transcriptionConfig:
            "Configure GROQ_API_KEY en el entorno para activar la transcripción.",
          microphone: "Se denegó el micrófono. La llamada fue finalizada."
        }
      },
      date: {
        yesterday: "Ayer"
      },
      common: {
        search: "Buscar",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Guardar",
        you: "Tú",
        confirm: "Confirmar",
        confirmation: "Confirmación",
        areyousure: "¿Estás seguro?",
        close: "Cerrar",
        closed: "Cerrado",
        error: "Error",
        success: "Éxito",
        actions: "Acciones",
        add: "Añadir",
        name: "Nombre",
        email: "Correo electrónico",
        phone: "Teléfono",
        language: "Idioma",
        company: "Empresa",
        user: "Usuario",
        users: "Usuarios",
        connection: "Conexión",
        connections: "Conexiones",
        queue: "Cola",
        queues: "Colas",
        contact: "Contacto",
        messages: "Mensajes",
        whatsappNumber: "Número de WhatsApp",
        dueDate: "Fecha de vencimiento",
        copy: "Copiar",
        paste: "Pegar",
        proceed: "Proceder",
        enabled: "Activado",
        disabled: "Desactivado",
        undefined: "Indefinido",
        yes: "Sí",
        no: "No",
        noqueue: "Sin cola",
        rating: "Calificación",
        transferTo: "Transferir a",
        key: "Clave",
        value: "Valor",
        validations: {
          required: "Este campo es obligatorio",
          short: "Valor demasiado corto",
          long: "Valor demasiado largo",
          invalid: "Valor inválido",
          invalidEmail: "Correo electrónico inválido",
          invalidPhone: "Número de teléfono inválido"
        },
        serverTime: "Hora del servidor:",
        clientTime: "Hora del cliente:",
        differenceMinutes: "Diferencia: {{count}} minuto(s)"
      },
      signup: {
        title: "Registrarse",
        toasts: {
          success: "Usuario creado con éxito. ¡Inicia sesión ahora!",
          fail: "Error al crear usuario. Verifica los datos proporcionados."
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña"
        },
        buttons: {
          submit: "Registrarse",
          login: "¿Ya tienes una cuenta? ¡Inicia sesión!"
        }
      },
      login: {
        title: "Iniciar sesión",
        form: {
          email: "Correo electrónico",
          password: "Contraseña",
          newPassword: "Nueva contraseña",
          confirmPassword: "Confirmar contraseña",
          passwordStrength:
            "Use al menos 8 caracteres, con mayúscula, minúscula y un número."
        },
        buttons: {
          submit: "Entrar",
          continue: "Continuar",
          createPassword: "Crear contraseña y entrar",
          changeEmail: "Cambiar correo",
          backToLogin: "Volver al inicio de sesión",
          register: "¿No tienes una cuenta? ¡Regístrate!"
        },
        errors: {
          emailNotFound: "No encontramos este correo electrónico.",
          passwordMismatch: "Las contraseñas no coinciden.",
          passwordStrength:
            "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y un número.",
          activationInvalid:
            "Este enlace de activación no es válido o ha caducado."
        },
        activation: {
          title: "Crea tu contraseña",
          account: "Activando la cuenta {{email}}"
        }
      },
      companies: {
        title: "Registrar Empresa",
        form: {
          name: "Nombre de la Empresa",
          plan: "Plan",
          token: "Token",
          submit: "Registrar",
          success: "Empresa creada con éxito"
        }
      },
      auth: {
        toasts: {
          success: "Inicio de sesión exitoso"
        },
        token: "Token"
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
          end: "Fecha de fin"
        },
        ticketCountersLabels: {
          created: "Creado",
          closed: "Cerrado"
        },
        blog: {
          title: "El blog de Espaço Whats",
          loading: "Cargando publicaciones...",
          error: "No se pudieron cargar las publicaciones del blog.",
          empty: "No se encontraron publicaciones.",
          showAll: "Mostrar todas las publicaciones",
          showLess: "Mostrar menos",
          openPost: "Leer publicacion",
          previous: "Publicacion anterior",
          next: "Siguiente publicacion"
        }
      },
      connections: {
        title: "Conexiones",
        toasts: {
          deleted: "Conexión con WhatsApp eliminada con éxito"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? Esta acción no se puede deshacer.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "¿Estás seguro? Tendrás que escanear el código QR nuevamente.",
          closeTickets: "Cerrar todas las atenciones de esta conexión"
        },
        buttons: {
          add: "Agregar WhatsApp",
          disconnect: "Desconectar",
          tryAgain: "Intentar nuevamente",
          qrcode: "CÓDIGO QR",
          newQr: "Nuevo CÓDIGO QR",
          connecting: "Conectando"
        },
        toolTips: {
          disconnected: {
            title: "Error al iniciar sesión en WhatsApp",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y vuelve a intentarlo o solicita un nuevo código QR."
          },
          qrcode: {
            title: "Esperando lectura del código QR",
            content:
              "Haz clic en el botón 'CÓDIGO QR' y escanea el código QR con tu teléfono para iniciar la sesión."
          },
          connected: {
            title: "Conexión establecida"
          },
          timeout: {
            title: "Se perdió la conexión con el teléfono",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y WhatsApp esté abierto, o haz clic en 'Desconectar' para obtener un nuevo código QR."
          },
          passkey: {
            title: "Se requiere autenticación por passkey",
            content:
              "Haz clic en el botón de passkey y usa la extensión del navegador para capturar la sesión autenticada de WhatsApp Web."
          },
          refresh: "Actualizar",
          disconnect: "Desconectar",
          scan: "Escanear",
          newQr: "Nuevo Código QR",
          retry: "Intentar nuevamente",
          resetPasskey: "Restablecer sesión passkey"
        },
        table: {
          contact: "Contacto",
          name: "Nombre",
          status: "Estado",
          lastUpdate: "Última actualización",
          default: "Predeterminado",
          actions: "Acciones",
          session: "Sesión"
        }
      },
      internalChat: {
        title: "Chat Interno"
      },
      whatsappGroups: {
        configure: "Configurar grupo",
        mode: "Modo del grupo",
        conversation: "Conversación",
        attendance: "Atención",
        allowedQueues: "Filas autorizadas",
        serviceQueue: "Fila de atención",
        cancel: "Cancelar",
        save: "Guardar",
        confirmConversation:
          "¿Quitar este grupo del flujo de atención? La atención activa finalizará sin evaluación."
      },
      whatsappModal: {
        title: {
          add: "Agregar WhatsApp",
          edit: "Editar WhatsApp"
        },
        form: {
          name: "Nombre",
          default: "Predeterminado"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "WhatsApp guardado con éxito."
      },
      qrCode: {
        message: "Lee el código QR para iniciar la sesión",
        extensionHint: "Autenticar a través de WhatsApp Web",
        startCapture: "Capturar sesión de WhatsApp Web",
        installExtension: "Instalar Extensión de Captura"
      },
      passkeyModal: {
        title: "Extensión de Captura de WhatsApp Web",
        instructions:
          "Usa la extensión del navegador para capturar la sesión autenticada de WhatsApp Web y enviarla al servidor.",
        connectorNotFound:
          "Extensión no detectada. Instala la extensión de captura passkey y recarga la página.",
        connectorReady:
          "Extensión detectada. Haz clic abajo para autenticarte a través de WhatsApp Web.",
        startCapture: "Iniciar Captura",
        waitingForCapture: "Esperando la captura de la sesión de WhatsApp Web…",
        existingSession: "WhatsApp Web ya tiene una sesión para {{number}}.",
        captureExisting: "Capturar esta sesión",
        clearAndContinue: "Borrar sesión local y continuar",
        importSent: "Sesión capturada y enviada con éxito.",
        importError: "Error en la captura: {{reason}}.",
        missingToken: "Falta el token de captura. Recarga la página.",
        downloadExtension: "Descargar extensión de captura",
        installInstructions: "Cómo instalar",
        hideInstructions: "Ocultar instrucciones",
        instructionsIntro:
          "Siga los pasos a continuación para instalar la extensión:",
        installStep1: "Descargue el archivo ZIP de la extensión.",
        installStep2:
          "Extraiga el archivo ZIP en una carpeta de su computadora.",
        installStep3: "Abra Google Chrome y vaya a chrome://extensions/.",
        installStep4:
          "Active el Modo de desarrollador con el interruptor de la esquina superior derecha.",
        installStep5: 'Haga clic en "Cargar descomprimida".',
        installStep6:
          "Seleccione la carpeta extraída que contiene los archivos de la extensión.",
        installStep7: "La extensión está instalada y lista para usar.",
        installStep8:
          "Actualice esta página con F5 e intente conectarse de nuevo."
      },
      contacts: {
        title: "Contactos",
        toasts: {
          deleted: "Contacto eliminado con éxito"
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Eliminar ",
          importTitlte: "Importar contactos",
          deleteMessage:
            "¿Estás seguro de que deseas eliminar este contacto? Se perderán todas las conversaciones relacionadas.",
          importMessage: "¿Quieres importar todos los contactos del teléfono?"
        },
        buttons: {
          import: "Importar Contactos",
          add: "Agregar Contacto"
        },
        table: {
          name: "Nombre",
          whatsapp: "WhatsApp",
          email: "Correo electrónico",
          actions: "Acciones"
        }
      },
      contactModal: {
        title: {
          add: "Agregar contacto",
          edit: "Editar contacto"
        },
        form: {
          mainInfo: "Datos del contacto",
          extraInfo: "Información adicional",
          name: "Nombre",
          number: "Número de WhatsApp",
          email: "Correo electrónico",
          extraName: "Nombre del campo",
          extraValue: "Valor",
          disableBot: "Desativar bot de conversa"
        },
        buttons: {
          addExtraInfo: "Agregar información",
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Contacto guardado con éxito."
      },
      queueModal: {
        title: {
          add: "Agregar fila",
          edit: "Editar fila"
        },
        form: {
          name: "Nombre",
          color: "Color",
          greetingMessage: "Mensaje de bienvenida",
          complationMessage: "Mensaje de conclusión",
          outOfHoursMessage: "Mensaje fuera del horario",
          ratingMessage: "Mensaje de calificación",
          transferMessage: "Mensaje de transferencia",
          connections: "Conexiones de WhatsApp",
          connectionsHelp:
            "La cola y el chatbot solo se ofrecerán en estas conexiones.",
          token: "Token"
        },
        validation: {
          connectionRequired: "Selecciona al menos una conexión para la cola."
        },
        toasts: {
          saved: "Cola guardada exitosamente"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar",
          attach: "Adjuntar archivo"
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
          sunday: "Domingo"
        }
      },
      userModal: {
        title: {
          add: "Agregar usuario",
          edit: "Editar usuario"
        },
        listItems: {
          adminProfile: "Administrador",
          userProfile: "Usuario"
        },
        form: {
          name: "Nombre",
          email: "Correo electrónico",
          password: "Contraseña",
          profile: "Perfil"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Usuario guardado con éxito."
      },
      scheduleModal: {
        title: {
          add: "Nuevo Agendamiento",
          edit: "Editar Agendamiento"
        },
        form: {
          body: "Mensaje",
          contact: "Contacto",
          sendAt: "Fecha de Agendamiento",
          sentAt: "Fecha de Envío",
          saveMessage: "Guardar mensaje en el ticket"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Agendamiento guardado con éxito."
      },
      tagModal: {
        title: {
          add: "Nueva Etiqueta",
          edit: "Editar Etiqueta",
          addKanban: "Nueva Columna",
          editKanban: "Editar Columna"
        },
        form: {
          name: "Nombre",
          color: "Color",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Agregar",
          okEdit: "Guardar",
          cancel: "Cancelar"
        },
        success: "Etiqueta guardada con éxito.",
        successKanban: "Columna guardada con éxito."
      },
      chat: {
        noTicketMessage: "Selecciona un ticket para empezar a conversar."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop:
            "ARRASTRA Y SUELTA ARCHIVOS EN EL CAMPO ABAJO",
          titleFileList: "Lista de archivo(s)"
        }
      },
      billing: {
        trialDays: "Días de prueba gratis",
        trialDaysHelp: "0 significa sin prueba gratis",
        dueDay: "Día de vencimiento",
        dueDayHelp: "Mensual; meses más cortos usan el último día",
        prorata: "Prorrata",
        trialEndsIn: "Tu prueba termina en {{days}} días.",
        noActiveTrial: "Sin prueba activa",
        period: "Período: {{start}} a {{end}}"
      },
      todolist: {
        title: "Tablero de tareas",
        loading: "Cargando el tablero...",
        loadError: "No se pudo cargar el tablero.",
        emptyColumn: "Arrastra una tarea a esta columna",
        dragTask: "Mover tarea",
        dragTaskLabel: "Mover tarea {{title}}",
        completedAt: "Completada el {{date}}",
        editTaskTitle: "Editar tarea",
        newTaskTitle: "Nueva tarea",
        targets: { global: "Global", user: "Usuario", queue: "Cola" },
        deadline: {
          ok: "A tiempo",
          warning: "Plazo próximo",
          overdue: "Atrasada"
        },
        details: {
          noDescription: "Sin descripción",
          state: "Estado",
          createdBy: "Creada por",
          target: "Destino",
          createdAt: "Creada",
          dueAt: "Plazo",
          completedAt: "Completada",
          history: "Historial"
        },
        events: {
          CREATED: "Creada",
          EDITED: "Editada",
          MOVED: "Movida",
          COMPLETED: "Completada",
          REOPENED: "Reabierta"
        },
        form: {
          name: "Nombre de la tarea",
          columnName: "Nombre de la columna",
          description: "Descripción",
          targetType: "Destino",
          assignee: "Usuario responsable",
          queue: "Cola responsable",
          dueAt: "Plazo"
        },
        buttons: {
          add: "Añadir",
          newTask: "Nueva tarea",
          save: "Guardar",
          configure: "Configurar columnas",
          clearFilter: "Limpiar filtro",
          tryAgain: "Intentar de nuevo",
          editTask: "Editar tarea",
          deleteTask: "Eliminar tarea",
          addColumn: "Añadir columna"
        },
        filters: {
          from: "Completadas desde",
          to: "Completadas hasta",
          invalidDate: "Fecha no válida"
        },
        settings: {
          title: "Configurar columnas",
          description:
            "Personaliza el orden, los nombres y los colores. Solo una columna representa tareas completadas.",
          markDone: "Marcar {{title}} como columna completada",
          doneColumn: "Columna de tareas completadas",
          regularColumn: "Columna de trabajo en curso",
          moveLeft: "Mover a la izquierda",
          moveRight: "Mover a la derecha",
          editColumn: "Editar columna",
          newColumn: "Nueva columna",
          chooseColor: "Elegir color",
          useBrandColor: "Usar color de la empresa"
        },
        confirm: {
          deleteTaskTitle: "Eliminar tarea",
          deleteTask: "¿Eliminar la tarea “{{title}}”?",
          deleteColumnTitle: "Eliminar columna",
          deleteColumn: "¿Eliminar la columna “{{title}}”?"
        },
        toasts: {
          taskCreated: "Tarea creada.",
          taskSaved: "Tarea actualizada.",
          taskDeleted: "Tarea eliminada.",
          columnSaved: "Columna guardada.",
          columnDeleted: "Columna eliminada.",
          doneColumnChanged: "Columna completada actualizada."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuevo"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Colas"
      },
      tickets: {
        toasts: {
          deleted: "La atención que estabas siguiendo fue eliminada."
        },
        notification: {
          message: "Mensaje de",
          nomessages: "Ningún mensaje"
        },
        tabs: {
          open: { title: "Abiertas" },
          closed: { title: "Resueltos" },
          groups: {
            title: "Grupos",
            conversations: "Conversaciones",
            attendances: "Atenciones",
            pending: "Pendientes",
            open: "En atención",
            closed: "Finalizadas"
          },
          search: { title: "Búsqueda" }
        },
        search: {
          placeholder: "Buscar atención y mensajes"
        },
        buttons: {
          showAll: "Todos"
        }
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Escribe para buscar usuarios",
        fieldConnectionLabel: "Transferir mediante conexión",
        fieldConnectionPlaceholder: "Selecciona una conexión",
        connectionHelp:
          "Después de elegir la conexión, selecciona una cola disponible.",
        connectionUnavailable: "desconectada",
        fieldQueueLabel: "Transferir a cola",
        fieldQueuePlaceholder: "Selecciona una cola",
        noOptions: "Ningún usuario encontrado con ese nombre",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar"
        }
      },
      ticketsList: {
        pendingHeader: "Esperando",
        assignedHeader: "Atendiendo",
        noTicketsTitle: "¡Nada aquí!",
        noTicketsMessage:
          "No se encontraron atenciones con ese estado o término de búsqueda",
        buttons: {
          accept: "Aceptar"
        }
      },
      newTicketModal: {
        title: "Crear Ticket",
        fieldLabel: "Escribe para buscar el contacto",
        add: "Agregar",
        buttons: {
          ok: "Guardar",
          cancel: "Cancelar"
        }
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
          chatgpt: "ChatGPT",
          schedules: "Agendamientos",
          campaigns: "Campañas",
          annoucements: "Anuncios",
          chats: "Chat Interno",
          financeiro: "Financiero",
          cobranca: "Cobranza",
          prospeccao: "Prospección",
          logout: "Cerrar sesión",
          management: "Gerencia",
          kanban: "Kanban",
          tasks: "Tareas"
        },
        appBar: {
          i18n: {
            language: "Español",
            language_short: "ES"
          },
          user: {
            profile: "Perfil",
            subscriptionValidUntilLabel: "Suscripción válida hasta",
            darkmode: "Modo oscuro",
            lightmode: "Modo claro",
            language: "Seleccionar idioma",
            logout: "Cerrar sesión"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Piloto habilitado",
        disabled: "Piloto deshabilitado",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Recomendado",
          description:
            "La forma más sencilla de usar sus atenciones dentro de ChatGPT.",
          details:
            "Instale el plugin, conecte su cuenta de Espaço Whats con OAuth y úselo desde el menú de plugins o mencionando @EspaçoWhats.",
          open: "Abrir plugin en ChatGPT",
          steps: {
            title: "Cómo instalar y conectar",
            open: "Abra el plugin Espaço Whats en ChatGPT",
            install: "Haga clic en Instalar plugin",
            connect: "Seleccione Conectar",
            login: "Ingrese tenant, correo y contraseña de administrador",
            use: "Use el menú de plugins o mencione @EspaçoWhats"
          },
          marketplace: {
            title: "Instalación para workspaces desde GitHub",
            description:
              "Un administrador también puede importar el marketplace oficial en Configuración del workspace → Plugins → Añadir → Importar marketplace.",
            repository: "Repositorio",
            path: "Ruta",
            pathValue: "Déjelo en blanco",
            branch: "Branch",
            copy: "Copiar repositorio"
          }
        },
        warningTitle: "Datos personales y clínicos",
        warning:
          "Al conectar, conversaciones identificables y posibles datos clínicos podrán enviarse a ChatGPT según sus preguntas. Úselo solo después de la aprobación legal y administrativa.",
        copy: "Copiar URL",
        connection: {
          title: "URL del servidor MCP",
          description:
            "Espaço Whats no usa una clave de OpenAI. La inteligencia y los límites pertenecen al plan ChatGPT del usuario."
        },
        steps: {
          title: "Cómo conectar",
          open: "Abra Developer Mode en ChatGPT",
          create: "Cree una integración MCP Draft",
          url: "Pegue la URL MCP",
          oauth: "Elija OAuth",
          login: "Ingrese tenant, correo y contraseña de administrador"
        },
        connections: {
          title: "Conexiones activas",
          empty: "No hay conexiones de ChatGPT.",
          client: "Cliente",
          admin: "Administrador",
          created: "Creada",
          lastUse: "Último uso",
          revoke: "Revocar",
          revokeAll: "Revocar todas"
        },
        revoke: {
          title: "Revocar conexión",
          one: "Esta conexión perderá el acceso inmediatamente.",
          all: "Todas las conexiones del tenant perderán el acceso inmediatamente."
        },
        toasts: {
          copied: "URL MCP copiada.",
          repositoryCopied: "Repositorio del plugin copiado.",
          revoked: "Conexión revocada."
        }
      },
      notifications: {
        noTickets: "Ninguna notificación."
      },
      quickMessages: {
        title: "Respuestas Rápidas",
        buttons: {
          add: "Nueva Respuesta"
        },
        dialog: {
          shortcode: "Atajo",
          message: "Respuesta"
        }
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Búsqueda",
        subMenus: {
          list: "Panel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "En abierto",
        confirmationModal: {
          deleteTitle: "¿Estás seguro de que quieres eliminar esta Lane?",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Tickets",
          actions: "Acciones"
        },
        buttons: {
          add: "Nueva Lane"
        },
        toasts: {
          deleted: "Lane eliminada con éxito."
        }
      },
      contactLists: {
        title: "Listas de Contactos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acciones"
        },
        buttons: {
          add: "Nueva Lista"
        },
        dialog: {
          name: "Nombre",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Agregar",
          add: "Agregar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        toasts: {
          deleted: "Registro eliminado",
          created: "Registro creado"
        }
      },
      contactListItems: {
        title: "Contactos",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo",
          lists: "Listas",
          import: "Importar"
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
          cancel: "Cancelar"
        },
        table: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "Correo electrónico",
          actions: "Acciones"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
          importMessage:
            "¿Desea importar los contactos de esta hoja de cálculo?",
          importTitlte: "Importar"
        },
        toasts: {
          deleted: "Registro eliminado"
        }
      },
      campaigns: {
        title: "Campañas",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nueva Campaña",
          contactLists: "Listas de Contactos"
        },
        table: {
          name: "Nombre",
          whatsapp: "Conexión",
          contactList: "Lista de Contactos",
          status: "Estado",
          scheduledAt: "Agendamiento",
          completedAt: "Completada",
          confirmation: "Confirmación",
          actions: "Acciones"
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
            contactList: "Lista de Contacto"
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Cerrar",
            attach: "Adjuntar Archivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        toasts: {
          success: "Operación realizada con éxito",
          cancel: "Campaña cancelada",
          restart: "Campaña reiniciada",
          deleted: "Registro eliminado"
        }
      },
      announcements: {
        title: "Anuncios",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo Anuncio",
          contactLists: "Listas de Anuncios"
        },
        table: {
          priority: "Prioridad",
          title: "Título",
          text: "Texto",
          mediaName: "Archivo",
          status: "Estado",
          actions: "Acciones"
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
            status: "Estado"
          },
          buttons: {
            add: "Agregar",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Cerrar",
            attach: "Adjuntar Archivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        toasts: {
          success: "Operación realizada con éxito",
          deleted: "Registro eliminado"
        }
      },
      campaignsConfig: {
        title: "Configuraciones de Campañas",
        intervals: "Intervalos",
        messageInterval: "Intervalo entre mensajes (segundos)",
        longerIntervalAfter: "Intervalo mayor después de (mensajes)",
        longerInterval: "Intervalo mayor (segundos)",
        addVariable: "Agregar variable"
      },
      queues: {
        title: "Colas y Chatbot",
        table: {
          name: "Nombre",
          color: "Color",
          greeting: "Mensaje de bienvenida",
          actions: "Acciones"
        },
        toasts: {
          deleted: "Cola eliminada exitosamente"
        },
        buttons: {
          add: "Agregar cola"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "¿Estás seguro? ¡Esta acción no se puede deshacer! Las atenciones de esta cola seguirán existiendo, pero ya no tendrán ninguna cola asignada."
        }
      },
      queueSelect: {
        inputLabel: "Colas"
      },
      users: {
        title: "Usuarios",
        empty: "No se encontraron usuarios.",
        filters: {
          queue: "Cola",
          allQueues: "Todas las colas"
        },
        profiles: {
          admin: "Administrador",
          user: "Usuario"
        },
        groups: {
          admin: "Administradores",
          user: "Usuarios"
        },
        table: {
          name: "Nombre",
          email: "Correo electrónico",
          profile: "Perfil",
          queues: "Colas",
          noQueues: "Sin colas",
          actions: "Acciones"
        },
        buttons: {
          add: "Agregar usuario"
        },
        toasts: {
          deleted: "Usuario eliminado con éxito."
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Todos los datos del usuario se perderán. Las atenciones abiertas de este usuario se moverán a la cola."
        }
      },
      helps: {
        title: "Centro de Ayuda",
        adminOnly: "Solo administradores",
        groupModal: {
          adminOnlyHelper:
            "Esta tarjeta y todo su contenido quedan ocultos para los usuarios comunes."
        },
        contentModal: {
          adminOnly: "Visible solo para administradores"
        }
      },
      about: {
        aboutthe: "Acerca de",
        copyright: "© 2024 - Funcionando com Espaço Whats",
        buttonclose: "Cerrar",
        title: "Acerca de Espaço Whats",
        abouttitle: "Origen y Mejoras",
        aboutdetail:
          "El Espaço Whats es derivado indirecto del proyecto Whaticket con mejoras compartidas por los desarrolladores del sistema EquipeChat a través del canal VemFazer en YouTube, posteriormente mejorado por Claudemir Todo Bom.",
        aboutauthorsite: "Sitio del autor",
        aboutwhaticketsite: "Sitio de la Comunidad Whaticket en Github",
        aboutvemfazersite: "Sitio del canal Vem Fazer en Github",
        licenseheading: "Licencia de Código Abierto",
        licensedetail:
          "El Espaço Whats está licenciado bajo la Licencia Pública General Affero de GNU versión 3, lo que significa que cualquier usuario que tenga acceso a esta aplicación tiene derecho a obtener acceso al código fuente. Más información en los siguientes enlaces:",
        licensefulltext: "Texto completo de la licencia",
        licensesourcecode: "Código fuente de Espaço Whats"
      },
      schedules: {
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "¿Está seguro de que desea eliminar esta programación?",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        table: {
          contact: "Contacto",
          body: "Mensaje",
          sendAt: "Fecha de Programación",
          sentAt: "Fecha de Envío",
          status: "Estado",
          actions: "Acciones"
        },
        buttons: {
          add: "Nuevo Agendamiento"
        },
        toasts: {
          deleted: "Agendamiento eliminado con éxito."
        }
      },
      tags: {
        title: "Etiquetas",
        confirmationModal: {
          deleteTitle: "¿Está seguro de que quiere eliminar esta etiqueta?",
          deleteMessage: "Esta acción no se puede deshacer."
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Atenciones",
          contacts: "Contactos",
          actions: "Acciones",
          id: "ID",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nueva Etiqueta"
        },
        toasts: {
          deleted: "Etiqueta eliminada con éxito."
        }
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
        loginLinks: "Enlaces del login",
        loginLinksHint:
          "Agregue pares de título y URL para mostrarlos debajo de la caja de login en escritorio y móvil.",
        linkTitle: "Título del enlace",
        linkUrl: "URL del enlace",
        removeLink: "Eliminar enlace",
        sidePanelImage: "Imagen lateral del login",
        sidePanelImageHint:
          "Se muestra en el panel lateral del login en pantallas de escritorio.",
        backgroundContent: "Contenido de fondo del login",
        backgroundContentHint:
          "Acepta imágenes, archivos SVG y videos MP4 para el fondo de la pantalla de login.",
        noFileSelected: "Todavía no hay archivo seleccionado.",
        buildExtension: "Construir extensión WA Session Capture",
        buildingExtension: "Construyendo extensión…",
        downloadExtension: "Descargar extensión",
        extensionHint:
          "Construye una extensión Chrome personalizada. El ZIP descargado ya contiene los archivos de la extensión: extraiga y cargue la carpeta extraída como extensión desempaquetada.",
        extensionBuildStarted:
          "Construcción de la extensión iniciada. Se le notificará cuando esté lista.",
        extensionBuildFailed:
          "No se pudo iniciar la construcción de la extensión.",
        extensionBuilt: "Extensión construida con éxito.",
        extensionBuildUnknownError: "Error de construcción desconocido."
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
          serveradmin: "Administración del servidor"
        },
        success: "Configuraciones guardadas exitosamente.",
        copiedToClipboard: "Copiado al portapapeles",
        title: "Configuraciones",
        chatbotTicketTimeout:
          "Tiempo de espera del ticket del chatbot (minutos)",
        chatbotTicketTimeoutAction: "Acción después del tiempo de espera",
        settings: {
          userCreation: {
            name: "Creación de usuario",
            options: {
              enabled: "Habilitado",
              disabled: "Deshabilitado"
            }
          }
        },
        validations: {
          title: "Validaciones",
          options: {
            enabled: "Habilitado",
            disabled: "Deshabilitado"
          }
        },
        OfficeManagement: {
          title: "Gestión de despachos",
          options: {
            disabled: "Deshabilitado",
            ManagementByDepartment: "Gestión por departamento",
            ManagementByCompany: "Gestión por empresa"
          }
        },
        outOfHoursAction: {
          title: "Acción fuera del horario",
          options: {
            pending: "Dejar pendiente",
            closed: "Cerrar ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignorar mensajes de grupo",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        soundGroupNotifications: {
          title: "Notificaciones de sonido de grupo",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        groupsTab: {
          title: "Pestaña de grupos",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        VoiceAndVideoCalls: {
          title: "Llamadas de voz y vídeo",
          options: {
            enabled: "Ignorar",
            disabled: "informe de indisponibilidad"
          }
        },
        AutomaticChatbotOutput: {
          title: "Salida automática del chatbot",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        ShowNumericEmoticons: {
          title: "Mostrar emojis numéricos en la cola",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        QuickMessages: {
          title: "Respuestas rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Usuario"
          }
        },
        AllowRegistration: {
          title: "Permitir el registro",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        FileUploadLimit: {
          title: "Límite de carga de archivos (MB)"
        },
        FileDownloadLimit: {
          title: "Límite de descarga de archivos (MB)"
        },
        messageVisibility: {
          title: "Visibilidad del mensaje",
          options: {
            respectMessageQueue: "Respetar fila de mensajes",
            respectTicketQueue: "Respetar fila de tickets"
          }
        },
        removeQueueAndUser: {
          title: "Mantener fila y usuario en ticket cerrado",
          options: {
            enabled: "Activado",
            disabled: "Desactivado"
          }
        },
        GracePeriod: {
          title: "Período de gracia después del vencimiento (días)"
        },
        ticketAcceptedMessage: {
          title: "Mensaje de ticket aceptado",
          placeholder: "Ingrese su mensaje de ticket aceptado aquí"
        },
        transferMessage: {
          title: "Mensaje de transferencia",
          placeholder: "Ingrese su mensaje de transferencia aquí"
        },
        mustacheVariables: {
          title: "Variables disponibles:"
        },
        WelcomeGreeting: {
          greetings: "hola",
          welcome: "bienvenido a",
          expirationTime: "Activo hasta"
        },
        Options: {
          title: "Opciones"
        },
        Companies: {
          title: "Empresas"
        },
        schedules: {
          title: "horarios",
          updateToNewFormat: "Actualizar al nuevo formato"
        },
        Plans: {
          title: "Planes",
          public: "Público",
          private: "Privado",
          usersLimit: "Límite de usuarios",
          connectionsLimit: "Límite de conexiones",
          queuesLimit: "Límite de colas",
          currencyCode: "Código de moneda (ISO 4217)"
        },
        Help: {
          title: "Ayuda"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Payment gateways"
        },
        i18nSettings: {
          title: "Traducciones"
        },
        AIProvider: {
          title: "Proveedor de IA"
        },
        AudioTranscriptions: {
          title: "Transcripciones de audio"
        },
        TagsMode: {
          title: "Modo de etiquetas",
          options: {
            ticket: "Ticket",
            contact: "Contacto",
            both: "Ticket y contacto"
          }
        }
      },
      messagesList: {
        header: {
          assignedTo: "Asignado a:",
          buttons: {
            return: "Regresar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceptar",
            call: "Llamar",
            endCall: "Cortar"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Ingrese un mensaje",
        placeholderClosed:
          "Reabra o acepte este ticket para enviar un mensaje.",
        signMessage: "Firmar",
        replying: "Respondiendo",
        editing: "Editando"
      },
      message: {
        edited: "Editada",
        forwarded: "Reenviado"
      },
      contactDrawer: {
        header: "Datos de contacto",
        groupHeader: "Datos del grupo",
        buttons: {
          edit: "Editar contacto"
        },
        extraInfo: "Otra información",
        participants: "Participantes",
        participantsUnavailable: "No se pudieron cargar los participantes",
        you: "tú",
        admin: "Admin",
        owner: "Creador"
      },
      ticketOptionsMenu: {
        schedule: "Agendamiento",
        delete: "Eliminar",
        transfer: "Transferir",
        appointmentsModal: {
          title: "Observaciones del Ticket",
          textarea: "Observación",
          placeholder: "Ingrese aquí la información que desea registrar"
        },
        confirmationModal: {
          title: "Eliminar el ticket del contacto",
          message:
            "¡Atención! Todas las mensajes relacionados con el ticket se perderán."
        },
        buttons: {
          delete: "Eliminar",
          cancel: "Cancelar"
        }
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancelar"
        }
      },
      messageOptionsMenu: {
        delete: "Eliminar",
        edit: "Editar",
        forward: "Reenviar",
        history: "Historial",
        reply: "Responder",
        confirmationModal: {
          title: "¿Borrar mensaje?",
          message: "Esta acción no se puede deshacer."
        }
      },
      messageHistoryModal: {
        close: "Cerrar",
        title: "Historial de edición del mensaje"
      },
      presence: {
        unavailable: "Indisponible",
        available: "Disponible",
        composing: "Escribiendo",
        recording: "Grabando",
        paused: "Pausado"
      },
      privacyModal: {
        title: "Editar privacidad de Whatsapp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Ahorrar"
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
            dias90: "90 Días"
          },
          readreceipts:
            "Para actualizar la privacidad de Confirmaciones de lectura",
          profile: "Para actualizar la privacidad de la foto de perfil",
          status: "Para actualizar la privacidad del mensajes",
          online: "Para actualizar la privacidad en línea",
          last: "Para actualizar la privacidad de Última visita",
          groupadd: "Para actualizar la privacidad de Agregar grupos",
          calladd: "Para actualizar la privacidad de Agregar llamada",
          disappearing: "Para actualizar el modo de desaparición predeterminado"
        }
      },
      phoneNumberInput: {
        country: "País",
        phoneNumber: "Número de teléfono",
        localNumber: "Número de teléfono"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR:
          "Error de configuración. Por favor, contacte al soporte.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Reloj fuera de sincronización. Por favor, verifique la configuración de fecha y hora de su dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inalcanzable. Por favor, intente nuevamente más tarde.",
        ERR_BACKEND_NOT_READY:
          "El backend se está iniciando y aún no está listo. Reintentando automáticamente."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "No hay conexión de WhatsApp disponible para abrir la conversación.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO: "Ese lead ya no está en tu base.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Ese lead no tiene teléfono para abrir conversación.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "La prospección aún no está configurada en este servidor.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "La clave de acceso a la prospección fue rechazada. Avisa al soporte.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "El servicio de prospección no respondió. Inténtalo de nuevo en unos minutos.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "El servicio de prospección rechazó esta búsqueda. Revisa el nicho y la ciudad.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Esta búsqueda ya no existe en el servicio de prospección.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Indica el nicho y la ciudad para buscar leads.",
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
          "Los días de prueba deben ser un entero entre 0 y 3650.",
        ERR_INVALID_DUE_DAY:
          "El día de vencimiento debe ser un entero entre 1 y 31.",
        ERR_TRIAL_ALREADY_STARTED:
          "La prueba gratis no puede cambiarse después del inicio de la facturación.",
        ERR_TASK_BOARD_INVALID_TITLE: "Introduce un título válido.",
        ERR_TASK_BOARD_INVALID_COLOR: "Introduce un color hexadecimal válido.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Columna no encontrada.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Tarea no encontrada.",
        ERR_TASK_BOARD_INVALID_DATE: "Introduce una fecha válida.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE:
          "El intervalo de fechas no es válido.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "El tablero debe tener una columna de tareas completadas.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER:
          "El orden de columnas no es válido.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Elige otra columna completada antes de eliminar esta.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Mueve las tareas de esta columna antes de eliminarla.",
        ERR_EMAIL_NOT_FOUND: "No encontramos este correo electrónico.",
        ERR_COMPANY_SUSPENDED:
          "Esta cuenta está suspendida. Contacte al responsable de su suscripción.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Esta cuenta ya tiene contraseña. Vuelva al inicio de sesión.",
        ERR_ACTIVATION_INVALID:
          "Este enlace de activación no es válido o ha caducado.",
        ERR_PASSWORD_CONFIRMATION: "Las contraseñas no coinciden.",
        ERR_PASSWORD_TOO_WEAK:
          "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y un número.",
        ERR_FORBIDDEN: "No tienes permisos para acceder a este recurso.",
        ERR_CHECK_NUMBER: "No se pudo verificar el número de WhatsApp.",
        ERR_NO_OTHER_WHATSAPP:
          "Debe haber al menos un WhatsApp predeterminado.",
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
        ERR_QUEUE_INVALID_CONNECTION:
          "Una de las conexiones seleccionadas no pertenece a esta empresa.",
        ERR_WAPP_INVALID_QUEUE:
          "Una de las colas seleccionadas no pertenece a esta empresa.",
        ERR_TICKET_INVALID_CONNECTION:
          "La conexión seleccionada no es compatible con este ticket.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "No se puede cambiar la conexión de un ticket de grupo.",
        ERR_INVALID_GROUP_MODE: "El modo de grupo seleccionado no es válido.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Seleccione al menos una fila autorizada para el grupo.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED:
          "Seleccione una fila de atención autorizada.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "Este grupo está en modo conversación y no admite acciones de atención.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED:
          "La conexión de destino debe estar conectada.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Selecciona una cola al cambiar la conexión.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "Esta cola no está vinculada a la conexión seleccionada.",
        ERR_SESSION_EXPIRED: "Sesión expirada. Por favor, inicie sesión.",
        ERR_USER_CREATION_DISABLED:
          "La creación de usuarios está deshabilitada por el administrador.",
        ERR_NO_PERMISSION: "No tiene permisos para acceder a este recurso.",
        ERR_DUPLICATED_CONTACT: "Ya existe un contacto con este número.",
        ERR_NO_SETTING_FOUND:
          "No se encontró ninguna configuración con este ID.",
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
          "El mensaje de saludo es obligatorio cuando hay más de una cola."
      },
      phoneCall: {
        hangup: "Cortar"
      },
      wavoipModal: {
        title: "Ingrese el token de su conexión en Wavoip",
        instructions:
          "Accediendo a la siguiente dirección puede crear una cuenta con 50 llamadas gratuitas para prueba",
        coupon:
          "Consulte las condiciones de descuento al contratar el servicio."
      },
      openHours: {
        title: "Horarios de Atención",
        timezone: {
          placeholder: "Seleccione la zona horaria",
          searchPlaceholder: "Escribe para buscar...",
          selected: "Zona horaria seleccionada"
        },
        tabs: {
          weekly: "Horarios Semanales",
          overrides: "Excepciones y Feriados"
        },
        weekly: {
          title: "Horarios de Atención Semanales",
          description:
            "Configure los horarios regulares de atención para cada día de la semana.",
          rule: "Regla",
          days: "Días de la Semana",
          hours: "Horarios",
          closedMessage: "Cerrado (sin horarios definidos)",
          addHour: "Añadir Horario",
          addRule: "Añadir Nueva Regla Semanal",
          from: "Desde",
          to: "Hasta",
          until: "hasta"
        },
        overrides: {
          title: "Excepciones y Feriados",
          description:
            "Configure fechas específicas con horarios especiales o cierres (feriados, eventos, etc.).",
          exception: "Excepción",
          date: "Fecha",
          label: "Descripción",
          labelPlaceholder: "Ej: Navidad, Carnaval...",
          repeat: "Repetición",
          repeatNone: "No repetir",
          repeatYearly: "Anual",
          closedDay: "Cerrado en este día",
          specialHours: "Horarios Especiales",
          addHour: "Añadir Horario",
          addException: "Añadir Excepción o Feriado",
          from: "Desde",
          to: "Hasta",
          until: "hasta"
        },
        days: {
          mon: "Lunes",
          tue: "Martes",
          wed: "Miércoles",
          thu: "Jueves",
          fri: "Viernes",
          sat: "Sábado",
          sun: "Domingo"
        }
      },
      ticketz: {
        registration: {
          header: "Regístrate en la base de usuarios de Espaço Whats",
          description:
            "Complete los campos a continuación para registrarse en la base de usuarios de Espaço Whats y recibir noticias sobre el proyecto.",
          name: "Nombre",
          country: "País",
          phoneNumber: "Whatsapp Teléfono",
          submit: "Registrar"
        },
        proAd: {
          imageAlt: "Captura de pantalla de Espaço Whats PRO",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "WhatsApp Oficial - Instagram - Messenger y otros",
            exclusiveFeatures: "Funciones exclusivas",
            advancedSupport: "Soporte avanzado",
            easyMigration: "Migración sencilla"
          },
          subscribePrice: "Suscríbete por {{monthlyPrice}}/mes",
          subscribeSubtitle: "directamente dentro del sistema",
          ctaUpgrade: "Haz clic para ver las instrucciones de actualización",
          ctaVisitSite: "Haz clic para visitar el sitio web",
          instructions: {
            title: "Instrucciones de actualización",
            stepIntro:
              "Si instalaste las imágenes proporcionadas por el proyecto en un servidor o VPS usando las instrucciones simplificadas, solo necesitas acceder a tu servidor y ejecutar el siguiente comando:",
            stepInstall:
              'En unos instantes Espaço Whats PRO estará instalado con todos tus datos; luego solo tienes que ir al menú de usuario, hacer clic en "Suscripción de Espaço Whats PRO" y completar tu suscripción.',
            helpPrefix:
              "Si tu instalación es diferente o crees que necesitas ayuda para instalar Espaço Whats PRO, ",
            helpLink: "contáctanos",
            helpSuffix: " y te ayudaremos."
          }
        },
        support: {
          title: "Apoyar el proyecto Espaço Whats",
          mercadopagotitle: "Tarjeta de crédito",
          recurringbrl: "Donaciones recurrentes en BRL",
          paypaltitle: "Tarjeta de crédito",
          international: "Donaciones en USD"
        }
      }
    }
  }
};

export { messages };
