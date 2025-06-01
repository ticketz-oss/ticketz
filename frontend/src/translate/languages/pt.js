const messages = {
  pt: {
    translations: {
      common: {
        search: "Buscar",
        edit: "Editar",
        delete: "Excluir",
        cancel: "Cancelar",
        save: "Salvar",
        confirm: "Confirmar",
        close: "Fechar",
        error: "Erro",
        success: "Sucesso",
        actions: "Ações",
        add: "Adicionar",
        name: "Nome",
        email: "Email",
        phone: "Telefone",
        company: "Empresa",
        connection: "Conexão",
        queue: "Fila",
        noqueue: "Sem fila",
        contact: "Contato",
        user: "Usuário",
        whatsappNumber: "Número do Whatsapp",
        dueDate: "Data de vencimento",
        copy: "Copiar",
        paste: "Colar",
        proceed: "Prosseguir",
        enabled: "Ativado",
        disabled: "Desativado",
        rating: "Avaliação",
        transferTo: "Transferir para",
        chat: "Conversa",
        plan: "Plano",
        status: "Status",
        clear: "Limpar",
        accessAs: "Acessar como",
        createdAt: "Criado em",
        price: "Preço",
      },
      signup: {
        title: "Cadastre-se",
        toasts: {
          success: "Usuário criado com sucesso! Faça seu login!!!.",
          fail: "Erro ao criar usuário. Verifique os dados informados.",
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Senha",
          phone: "Número de telefone com código do país (+55)",
          plan: "Plano",
          atendentes: "Atendentes",
          whatsApp: "Número de contas WA",
          queue: "Número de filas",
          currency: "R$ ",
        },
        buttons: {
          submit: "Cadastrar",
          login: "Já tem uma conta? Entre!",
        },
      },
      login: {
        title: "Login",
        form: {
          email: "Email",
          password: "Senha",
        },
        buttons: {
          submit: "Entrar",
          register: "Não tem um conta? Cadastre-se!",
        },
      },
      companies: {
        title: "Cadastrar Empresa",
        campaigns: "Campanhas",
        recurrence: {
          title: "Recorrência",
          monthly: "Mensal",
          bimonthly: "Bimestral",
          quarterly: "Trimestral",
          semiannual: "Semestral",
          annual: "Anual",
        },
        form: {
          name: "Nome da Empresa",
          plan: "Plano",
          token: "Token",
          submit: "Cadastrar",
          success: "Empresa criada com sucesso!",
        },
        options: {
          enabled: "Ativo",
          disabled: "Inativo",
        },
        modal:{
          titleDeleted: "Exclusão de dados",
          titleaccessAs: "Acessar como",
          deletedNote: "Tem certeza que deseja excluir este dado?",
          accessAsNote: "Deseja acessar o sistema como esta empresa?",
        },
      },
      auth: {
        toasts: {
          success: "Login efetuado com sucesso!",
        },
        token: "Token",
      },
      dashboard: {
        usersOnline: "Usuários online",
        ticketsWaiting: "Atendimentos aguardando",
        ticketsOpen: "Atendimentos abertos",
        ticketsDone: "Atendimentos resolvidos",
        totalTickets: "Total de atendimentos",
        newContacts: "Novos contatos",
        avgServiceTime: "Tempo médio de atendimento",
        avgWaitTime: "Tempo médio de espera",
        ticketsOnPeriod: "Atendimentos no período",
        userCurrentStatus: "Status (Atual)",
        filter: {
          period: "Período",
          custom: "Personalizado",
          last3days: "Últimos 3 dias",
          last7days: "Últimos 7 dias",
          last14days: "Últimos 14 dias",
          last30days: "Últimos 30 dias",
          last90days: "Últimos 90 dias"
        },
        date: {
          start: "Data inicial",
          end: "Data final",
        },
        ticketCountersLabels: {
          created: "Criado",
          closed: "Fechado",
        },
        ticketzPro: {
          title: "Ticketz PRO",
          features1: "Whatsapp Oficial - Instagram - Messenger e outros",
          features2: "Recursos exclusivos - Suporte Avançado - Migração Facilitada",
          price: "Assine por R$ 199/mês",
          note: "direto dentro do sistema",
          upgrade: "Clique para instruções de Upgrade",
          visit: "Clique para visitar o site!",
          upgradeInstructions: {
            title: "Instruções de Upgrade",
            paragraph1: "Se você instalou as imagens disponibilizadas pelo projeto em um servidor ou VPS utilizando as instruções facilitadas, tudo o que você precisa fazer é acessar seu servidor e digitar o comando abaixo:",
            command: "curl -sSL update.ticke.tz | sudo bash -s pro",
            paragraph2: "Em instantes o Ticketz PRO estará instalado com todos os seus dados. Agora só precisa ir até o menu de usuário, clicar em 'Assinatura do Ticketz PRO' e fazer a sua assinatura.",
            paragraph3: "Se a sua instalação for diferente ou acredita que precisa de auxílio para instalar o Ticketz Pro, ",
            paragraph4: "entre em contato que nós ajudamos!",
          },
        }
      },
      connections: {
        title: "Conexões",
        toasts: {
          deleted: "Conexão com o WhatsApp excluída com sucesso!",
        },
        confirmationModal: {
          deleteTitle: "Deletar",
          deleteMessage: "Você tem certeza? Essa ação não pode ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage: "Tem certeza? Você precisará ler o QR Code novamente.",
        },
        buttons: {
          add: "Adicionar WhatsApp",
          disconnect: "desconectar",
          tryAgain: "Tentar novamente",
          qrcode: "QR CODE",
          newQr: "Novo QR CODE",
          connecting: "Conectando",
        },
        toolTips: {
          disconnected: {
            title: "Falha ao iniciar sessão do WhatsApp",
            content: "Certifique-se de que seu celular esteja conectado à internet e tente novamente, ou solicite um novo QR Code",
          },
          qrcode: {
            title: "Esperando leitura do QR Code",
            content: "Clique no botão 'QR CODE' e leia o QR Code com o seu celular para iniciar a sessão",
          },
          connected: {
            title: "Conexão estabelecida!",
          },
          timeout: {
            title: "A conexão com o celular foi perdida",
            content: "Certifique-se de que seu celular esteja conectado à internet e o WhatsApp esteja aberto, ou clique no botão 'Desconectar' para obter um novo QR Code",
          },
          refresh: "Refazer conexão",
          disconnect: "Desconectar",
          scan: "Ler QR Code",
          newQr: "Gerar novo QR Code",
          retry: "Tentar novamente",
        },
        table: {
          name: "Nome",
          status: "Status",
          lastUpdate: "Última atualização",
          default: "Padrão",
          actions: "Ações",
          session: "Sessão",
        },
      },
      internalChat: {
        title: "Chat Interno",
        alertChatTitle: "Por favor, preencha o título da conversa.",
        alertChatUser: "Por favor, selecione pelo menos um usuário.",
        labelTitle: "Título",
        labelPlaceholder: "Digite o título",
      },
      whatsappModal: {
        title: {
          add: "Adicionar WhatsApp",
          edit: "Editar WhatsApp",
        },
        form: {
          name: "Nome",
          default: "Padrão",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "WhatsApp salvo com sucesso.",
      },
      qrCode: {
        message: "Leia o QrCode para iniciar a sessão",
      },
      contacts: {
        title: "Contatos",
        toasts: {
          deleted: "Contato excluído com sucesso!",
        },
        searchPlaceholder: "Pesquisar...",
        confirmationModal: {
          deleteTitle: "Deletar ",
          importTitlte: "Importar contatos",
          deleteMessage: "Tem certeza que deseja deletar este contato? Todos os atendimentos relacionados serão perdidos.",
          importMessage: "Deseja importar todos os contatos do telefone?",
        },
        buttons: {
          import: "Importar Contatos",
          add: "Adicionar Contato",
        },
        table: {
          name: "Nome",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Ações",
        },
      },
      contactModal: {
        title: {
          add: "Adicionar contato",
          edit: "Editar contato",
        },
        form: {
          mainInfo: "Dados do contato",
          extraInfo: "Informações adicionais",
          name: "Nome",
          number: "Número do Whatsapp",
          email: "Email",
          extraName: "Nome do campo",
          extraValue: "Valor",
          disableBot: "Desabilitar chatbot",
        },
        buttons: {
          addExtraInfo: "Adicionar informação",
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Contato salvo com sucesso.",
      },
      queueModal: {
        title: {
          titleNotDefined: "Título não definido",
          titleTabsQueue: "Dados da Fila",
          titleTabsHours: "Horário de Atendimento",
          optionText: "Digite o texto da opção",
          optionTitle: "Título da opção",
        },
        toasts: {

        },
        confirmationModal: {
          notificationAdd: "Dados da fila salvos com sucesso",
          notificationEdit: "Dados da fila alterados com sucesso",
          notificationDeleted: "Dados da fila excluídos com sucesso",
          notificationHours: "Clique em salvar para salvar as alterações",

        },
        form: {
          name: "Nome",
          color: "Cor",
          greetingMessage: "Mensagem de saudação",
          complationMessage: "Mensagem de conclusão",
          outOfHoursMessage: "Mensagem de fora de expediente",
          ratingMessage: "Mensagem de avaliação",
          transferMessage: "Mensagem de Transferência",
          token: "Token",
          forwardToQueue: "Encaminhar para Fila",
          options: "Opções",
        },
        outOfHoursAction: {
          title: "Ação Fora do Horário",
          options: {
            pending: "Manter na fila",
            closed: "Fechar ticket",
          },
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          attach: "Anexar Arquivo",
          add: "Adicionar Fila",
          edit: "Editar Fila",
          addSub: "Criar Subfila",
        },
        serviceHours: {
          dayWeek: "Dia da semana",
          startTimeA: "Hora Inicial - Turno A",
          endTimeA: "Hora Final - Turno A",
          startTimeB: "Hora Inicial - Turno B",
          endTimeB: "Hora Final - Turno B",
          monday: "Segunda-feira",
          tuesday: "Terça-feira",
          wednesday: "Quarta-feira",
          thursday: "Quinta-feira",
          friday: "Sexta-feira",
          saturday: "Sábado",
          sunday: "Domingo",
          dontEnableHours: "Não ativar Horário de Atendimento nesta fila",
        },
      },
      userModal: {
        title: {
          add: "Adicionar usuário",
          edit: "Editar usuário",
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Senha",
          profile: "Perfil",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Usuário salvo com sucesso.",
      },
      scheduleModal: {
        title: {
          add: "Novo Agendamento",
          edit: "Editar Agendamento",
        },
        form: {
          body: "Mensagem",
          contact: "Contato",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          saveMessage: "Salvar Mensagem no Ticket",
        },
        errorMessages: {
          tooShort: "Mensagem muito curta",
          required: "Obrigatório",
          sendError: "Falha ao enviar",
          default: "Mensagem",
          unidentifedWhatsapp: "WhatsApp não identificado",
          scheduleCheckError: "Falha ao verificar agendamento: ",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        schedules: {
          scheduledDispatch: "Agendamento para: ",
          messageSent: "Mensagem agendada enviada para: ",
        },
        completionMessages: {
          default: "Atendimento concluído",
        },
        success: "Agendamento salvo com sucesso.",
      },
      tagModal: {
        title: {
          add: "Nova Tag",
          edit: "Editar Tag",
          addKanban: "Nova Lane",
          editKanban: "Editar Lane",
        },
        form: {
          name: "Nome",
          color: "Cor",
          kanban: "Kanban",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Tag salvo com sucesso.",
        successKanban: "Lane salva com sucesso.",
      },
      chat: {
        noTicketMessage: "Selecione um ticket para começar a conversar.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTE E SOLTE ARQUIVOS NO CAMPO ABAIXO",
          titleFileList: "Lista de arquivo(s)"
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Novo",
        },
      },
      ticketsQueueSelect: {
        placeholder: "Filas",
      },
      tickets: {
        toasts: {
          deleted: "O atendimento que você estava foi deletado.",
        },
        notification: {
          message: "Mensagem de",
        },
        tabs: {
          open: { 
            title: "Abertas" 
          },
          closed: { 
            title: "Resolvidos",
            close: "Fechar"
          },
          groups: { 
            title: "Grupos" 
          },
          search: { 
            title: "Busca" 
          },
        },
        search: {
          placeholder: "Buscar atendimento e mensagens",
          filterTags: "Filtrar por Tags",
          filterUsers: "Filtrar por Usuário",
        },
        buttons: {
          showAll: "Todos",
        },
      },
      task:{
        title: "Tarefa",
        newTask: "Nova Tarefa",
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Digite para buscar usuários",
        fieldQueueLabel: "Transferir para fila",
        fieldQueuePlaceholder: "Selecione uma fila",
        noOptions: "Nenhum usuário encontrado com esse nome",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar",
        },
      },
      ticketsList: {
        pendingHeader: "Aguardando",
        assignedHeader: "Atendendo",
        noTicketsTitle: "Nada aqui!",
        noTicketsMessage: "Nenhum atendimento encontrado com esse status ou termo pesquisado",
        buttons: {
          accept: "Aceitar",
        },
      },
      newTicketModal: {
        title: "Criar Ticket",
        fieldLabel: "Digite para pesquisar o contato",
        add: "Adicionar",
        buttons: {
          ok: "Salvar",
          cancel: "Cancelar",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Conexões",
          tickets: "Atendimentos",
          quickMessages: "Respostas Rápidas",
          contacts: "Contatos",
          queues: "Filas & Chatbot",
          tags: "Tags",
          administration: "Administração",
          service: "Atendimento",
          users: "Usuários",
          settings: "Configurações",
          helps: "Ajuda",
          messagesAPI: "API",
          schedules: "Agendamentos",
          campaigns: "Campanhas",
          listing: "Lista de Campanhas",
          contactList: "Lista de Contatos",                    
          annoucements: "Informativos",
          chats: "Chat Interno",
          financeiro: "Financeiro",
          logout: "Sair",
          management: "Gerência",
          kanban: "Kanban"
        },
        appBar: {
          i18n: {
            language: "Português 🇧🇷",
            language_short: "pt_BR"
          },
          user: {
            profile: "Perfil",
            darkmode: "Modo escuro",
            lightmode: "Modo claro",
            language: "Selecionar idioma",
            about: "Sobre",
            logout: "Sair",
          },
        },
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensagem",
          token: "Token cadastrado",
        },
        mediaMessage: {
          number: "Número",
          body: "Nome do arquivo",
          media: "Arquivo",
          token: "Token cadastrado",
        },
      },
      notifications: {
        noTickets: "Nenhuma notificação.",
      },
      quickMessages: {
        title: "Respostas Rápidas",
        buttons: {
          add: "Nova Resposta",
        },
        dialog: {
          shortcode: "Atalho",
          message: "Resposta",          
          action: "Ação",
          deleteRecord: "Excluir Resposta Rápida",
          questionAnswer: "Tem certeza que deseja excluir esta mensagem?",
          notificationAdd: "Mensagem adicionada com sucesso.",
          notificationDelete: "Mensagem excluída com sucesso.",
          notificationUpdate: "Mensagem atualizada.",          
        },
      },
      kanban: {
        title: "Kanban",
        searchPlaceholder: "Pesquisa",
        subMenus: {
          list: "Painel",
          tags: "Lanes"
        }
      },
      tagsKanban: {
        title: "Lanes",
        laneDefault: "Em aberto",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir esta Lane?",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          actions: "Ações",
        },
        buttons: {
          add: "Nova Lane",
        },
        toasts: {
          deleted: "Lane excluída com sucesso.",
        },
      },
      contactLists: {
        title: "Listas de Contatos",
        table: {
          name: "Nome",
          contacts: "Contatos",
          actions: "Ações",
        },
        buttons: {
          add: "Nova Lista",
        },
        dialog: {
          name: "Nome",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        toasts: {
          deleted: "Registro excluído",
          created: "Registro criado",
        },
      },
      contactListItems: {
        title: "Contatos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo",
          lists: "Listas",
          import: "Importar",
        },
        dialog: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        table: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          actions: "Ações",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
          importMessage: "Deseja importar os contatos desta planilha? ",
          importTitlte: "Importar",
        },
        toasts: {
          deleted: "Registro excluído",
        },
      },
      campaigns: {
        title: "Campanhas",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Nova Campanha",
          contactLists: "Listas de Contatos",
          addVariable: "Adicionar Variável",
          saveSetting:  "Salvar Configuração",
        },
        table: {
          name: "Nome",
          whatsapp: "Conexão",
          contactList: "Lista de Contatos",
          status: "Status",
          scheduledAt: "Agendamento",
          completedAt: "Concluída",
          confirmation: "Confirmação",
          actions: "Ações",
        },
        dialog: {
          new: "Nova Campanha",
          update: "Editar Campanha",
          readonly: "Apenas Visualização",
          form: {
            name: "Nome",
            message1: "Mensagem 1",
            message2: "Mensagem 2",
            message3: "Mensagem 3",
            message4: "Mensagem 4",
            message5: "Mensagem 5",
            confirmationMessage1: "Mensagem de Confirmação 1",
            confirmationMessage2: "Mensagem de Confirmação 2",
            confirmationMessage3: "Mensagem de Confirmação 3",
            confirmationMessage4: "Mensagem de Confirmação 4",
            confirmationMessage5: "Mensagem de Confirmação 5",
            messagePlaceholder: "Conteúdo da mensagem",
            whatsapp: "Conexão",
            status: "Status",
            scheduledAt: "Agendamento",
            confirmation: "Confirmação",
            contactList: "Lista de Contato",
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Fechar",
            attach: "Anexar Arquivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        toasts: {
          title: "Intervalo",
          success: "Operação realizada com sucesso",
          cancel: "Campanha cancelada",
          restart: "Campanha reiniciada",
          deleted: "Registro excluído",
          seconds: "Segundos",
          messages: "Mensagens",
          noInterval: "Sem intervalo",
          greaterInterval: "Tempo de Envio Adiado",
          longerIntervalAfter: "Atraso no Envio",
          notDefined: "Sem atraso",
          messageInterval: "Intervalo entre Mensagens",
          hotKey: "Atalho",
          
        },
      },
      announcements: {
        title: "Informativos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo Informativo",
          contactLists: "Listas de Informativos",
        },
        table: {
          priority: "Prioridade",
          title: "Title",
          text: "Texto",
          mediaName: "Arquivo",
          status: "Status",
          actions: "Ações",
        },
        dialog: {
          edit: "Edição de Informativo",
          add: "Novo Informativo",
          update: "Editar Informativo",
          readonly: "Apenas Visualização",
          form: {
            priority: {
              title: "Prioridade",
              high: "Alta",
              medium: "Média",
              low: "Baixa",
            },
            title: "Título",
            text: "Texto",
            mediaPath: "Arquivo",
            attach: "Sem anexo",
            status: {
              title: "Status",
              active: "Ativo",
              inactive: "Inativo",
            },
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Fechar",
            attach: "Anexar Arquivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser desfeita.",
        },
        toasts: {
          success: "Operação realizada com sucesso",
          deleted: "Registro excluído",
        },
      },
      campaignsConfig: {
        title: "Configurações de Campanhas",
      },
      queues: {
        title: "Filas & Chatbot",
        table: {
          name: "Nome",
          color: "Cor",
          greeting: "Mensagem de saudação",
          actions: "Ações",
        },
        buttons: {
          add: "Adicionar fila",
        },
        dialog: {
          name: "Nome",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        toasts: {
          deleted: "Dados excluídos com sucesso",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Você tem certeza? Essa ação não pode ser revertida! Os atendimentos dessa fila continuarão existindo, mas não terão mais nenhuma fila atribuída.",
        },
      },
      queueSelect: {
        inputLabel: "Filas",
      },
      users: {
        title: "Usuários",
        table: {
          name: "Nome",
          email: "Email",
          profile: "Perfil",
          actions: "Ações",
        },
        buttons: {
          add: "Adicionar usuário",
        },
        toasts: {
          deleted: "Usuário excluído com sucesso.",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Todos os dados do usuário serão perdidos. Os atendimento abertos deste usuário serão movidos para a fila.",
        },
      },
      helps: {
        title: "Central de Ajuda",
      },
      about: {
        aboutthe: "Sobre o",
        copyright: "© 2024 - Funcionando com ticketz",
        buttonclose: "Fechar",
        title: "Sobre o ticketz",
        abouttitle: "Origem e melhorias",
        aboutdetail: "O ticketz é derivado indireto do projeto Whaticket com melhorias compartilhadas pelos desenvolvedores do sistema EquipeChat através do canal VemFazer no youtube, posteriormente melhoradas por Claudemir Todo Bom",
        aboutauthorsite: "Site do autor",
        aboutwhaticketsite: "Site do Whaticket Community no Github",
        aboutvemfazersite: "Site do canal Vem Fazer no Github",
        licenseheading: "Licença em Código Aberto",
        licensedetail: "O ticketz está licenciado sob a GNU Affero General Public License versão 3, isso significa que qualquer usuário que tiver acesso a esta aplicação tem o direito de obter acesso ao código fonte. Mais informações nos links abaixo:",
        licensefulltext: "Texto completo da licença",
        licensesourcecode: "Código fonte do ticketz"
      },
      schedules: {
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir este Agendamento?",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        table: {
          contact: "Contato",
          body: "Mensagem",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          status: "Status",
          actions: "Ações",
        },
        buttons: {
          add: "Novo Agendamento",
        },
        toasts: {
          deleted: "Agendamento excluído com sucesso.",
        },
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir esta Tag?",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Registros",
          actions: "Ações",
          id: "Id",
          kanban: "Kanban",
        },
        buttons: {
          add: "Nova Tag",
        },
        toasts: {
          deleted: "Tag excluído com sucesso.",
        },
      },
      whitelabel: {
        primaryColorLight: "Cor primária clara",
        primaryColorDark: "Cor primária escura",
        lightLogo: "Logo do app claro",
        darkLogo: "Logo do app escuro",
        favicon: "Favicon do app",
        appname: "Nome do app",
        logoHint: "Prefira SVG e aspecto de 28:10",
        faviconHint: "Prefira imagem SVG quadrada ou PNG 512x512",
      },
      settings: {
        group: {
          general: {
            title: "Configurações Gerais",
            VoiceAndVideoCalls: {
              title: "Chamadas de voz e vídeo",
              options: {
                enabled: "Ignorar",
                disabled: "Relatar indisponibilidade",
              },
            },
            AutomaticChatbotOutput: {
              title: "Saída automática do chatbot",
              options: {
                enabled: "Ativado",
                disabled: "Desativado",
              },
            },
            autoReopenTimeout: "Tempo para reabertura automática (minutos)",
          },
          rating: {
            title: "Configurações de Avaliação",
            label: "Avaliação",
            timeout: "Tempo limite para avaliação (minutos)",
          },
          noQueue: {
            title: "Configurações de Tickets sem Fila",
            label: "Tempo limite para tickets sem fila (minutos)",
            action: "Ação para tempo limite de tickets sem fila",
            options: {
              close: "Fechar ticket",
              transferTo: "Transferir para",
            },
          },
          ticketInProgress: {
            title: "Configurações de Tickets em Atendimento",
            label: "Tempo limite para tickets em atendimento (minutos)",
            action: "Ação para tempo limite de tickets abertos",
            options: {
              returnToQueue: "Retornar à fila",
              closeService: "Encerrar atendimento",
            },
          },
          timeouts: {
            title: "Tempos Limite",
            actionforUnassignedTicketTimeout: "Ação para tempo limite de tickets não atribuídos",
            actionforOpenTicketTimeout: "Ação para tempo limite de tickets abertos",
            transferTo: "Transferir para",
            timeoutforTicketInProgress: "Tempo limite para tickets em atendimento (minutos)",
            timeoutforUnassignedTicket: "Tempo limite para tickets não atribuídos (minutos)",
            returnToQueue: "Retornar à fila",
            closeService: "Encerrar atendimento",
          },
          officeHours: "Horário de expediente",
          groups: "Grupos",
          confidenciality: "Confidencialidade",
          api: "API",
          externalServices: "Serviços externos",
          serveradmin: "Administração do servidor",   
          helps:{
            title: "Título",
            videoLink: "Link do Vídeo",
            description: "Descrição",
            notification:{
              loadListError: "Não foi possível carregar a lista de registros",
              operationSuccess: "Dados salvos com sucesso!",
              operationDeletedSuccess: "Dados excluídos com sucesso!",
              operationError: "Não foi possível realizar a operação. Verifique se já existe um nome igual ou se os campos foram preenchidos corretamente",
              genericError: "Não foi possível realizar a operação",
            },
            deleteRecord: {
              title: "Exclusão de Dados",
              confirmationMessage: "Tem certeza que deseja excluir estes dados?"
            },
          },       
        },
        success: "Configurações salvas com sucesso.",
        copiedToClipboard: "Copiado para a área de transferência",
        title: "Configurações",
        chatbotTicketTimeout: "Timeout do chatbot (minutos)",
        chatbotTicketTimeoutAction: "Ação do timeout do chatbot",
        settings: {
          userCreation: {
            name: "Criação de usuário",
            options: {
              enabled: "Ativado",
              disabled: "Desativado",
            },
          },
        },
        validations: {
          title: "Avaliações",
          options: {
            enabled: "Habilitado",
            disabled: "Desabilitado",
          },
        },
        OfficeManagement: {
          title: "Gerenciamento de Expediente",
          options: {
            disabled: "Desabilitado",
            ManagementByDepartment: "Gerenciamento Por Fila",
            ManagementByCompany: "Gerenciamento Por Empresa",
          },
        },
        outOfHoursAction: {
          title: "Ação fora do expediente",
          options: {
            pending: "Deixar como pendente",
            closed: "Fechar ticket",
          },
        },
        IgnoreGroupMessages: {
          title: "Ignorar Mensagens de Grupos",
          options: {
            enabled: "Ativado",
            disabled: "Desativado",
          },
        },
        soundGroupNotifications: {
          title: "Notificações de som de grupo",
          options: {
            enabled: "Ativado",
            disabled: "Desativado",
          },
        },
        groupsTab: {
          title: "Aba de Grupos",
          options: {
            enabled: "Ativado",
            disabled: "Desativado",
          },
        },
        VoiceAndVideoCalls: {
          title: "Chamadas de Voz e Vídeo",
          options: {
            enabled: "Ignorar",
            disabled: "informar indisponibilidade",
          },
        },
        AutomaticChatbotOutput: {
          title: "Saída automática de chatbot",
          options: {
            enabled: "Activado",
            disabled: "Desativado",
          },
        },
        ShowNumericEmoticons: {
          title: "Exibir emojis numéricos na fila",
          options: {
            enabled: "Activado",
            disabled: "Desativado",
          },
        },
        QuickMessages: {
          title: "Mensagens Rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Usuário",
          },
        },
        AllowRegistration: {
          title: "Permitir cadastro",
          options: {
            enabled: "Ativado",
            disabled: "Desativado",
          },
        },
        FileUploadLimit: {
          title: "Limite de Upload de arquivos (MB)",
        },
        FileDownloadLimit: {
          title: "Limite de Download de arquivos (MB)",
        },
        GracePeriod: {
          title: "Período de carência",
        },
        "messageVisibility": {
          "title": "Visibilidade da mensagem",
          "options": {
            "respectMessageQueue": "Respeitar fila da mensagem",
            "respectTicketQueue": "Respeitar fila do ticket"
          }
        },
        "keepQueueAndUser": {
          "title": "Manter fila e usuário no ticket fechado",
          "options": {
            "enabled": "Ativado",
            "disabled": "Desativado"
          }
        },
        WelcomeGreeting: {
          greetings: "olá",
          earlyMorning: "Boa madrugada,",
          morning: "Bom dia,",
          afternoon: "Boa tarde,",
          evening: "Boa noite,",
          welcome: "bem-vindo ao",
          expirationTime: "Ativo até",
        },
        Options: {
          title: "Opções",
        },
        Companies: {
          title: "Empresas",
        },
        schedules: {
          title: "Horários",
        },
        Plans: {
          title: "Planos",
        },
        Help: {
          title: "Ajuda",
        },
        Whitelabel: {
          title: "Whitelabel",
        },
        PaymentGateways: {
          title: "Payment gateways",
        },
        AIProvider: {
          title: "Serviço de IA",
        },
        AudioTranscriptions: {
          title: "Transcrição de áudio",
        },        
        TagsMode: {
          title: "Modo de Tags",
          options: {
            ticket: "Ticket",
            contact: "Contato",
            both: "Ticket e Contacto"
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Atribuído à:",
          buttons: {
            return: "Retornar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceitar",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Digite uma mensagem",
        placeholderClosed: "Reabra ou aceite esse ticket para enviar uma mensagem.",
        signMessage: "Assinar",
        replying: "Respondendo",
        editing: "Editando",
      },
      message: {
        edited: "Editada",
        forwarded: "Encaminhada",
      },

      contactDrawer: {
        header: "Dados do contato",
        buttons: {
          edit: "Editar contato",
        },
        extraInfo: "Outras informações",
      },
      ticketOptionsMenu: {
        schedule: "Agendamento",
        delete: "Deletar",
        transfer: "Transferir",
        registerAppointment: "Observações do Contato",
        appointmentsModal: {
          title: "Observações do Contato",
          textarea: "Observação",
          placeholder: "Insira aqui a informação que deseja registrar",
        },
        confirmationModal: {
          title: "Deletar o ticket do contato",
          message: "Atenção! Todas as mensagens relacionadas ao ticket serão perdidas.",
        },
        buttons: {
          delete: "Excluir",
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
        delete: "Deletar",
        edit: "Editar",
        forward: "Encaminhar",
        history: "Histórico",
        reply: "Responder",
        confirmationModal: {
          title: "Apagar mensagem?",
          message: "Esta ação não pode ser revertida.",
        },
      },
      messageHistoryModal: {
        close: "Fechar",
        title: "Histórico de edição da mensagem"
      },
      presence: {
        unavailable: "Indisponível",
        available: "Disponível",
        composing: "Digitando...",
        recording: "Gravando...",
        paused: "Pausado",
      },
      privacyModal: {
        title: "Editar Privacidade do Whatsapp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Salvar",
        },
        form: {
          menu: {
            all: "Todos",
            none: "Ninguém",
            contacts: "Meus contatos",
            contact_blacklist: "Contatos selecionados",
            match_last_seen: "Semelhante ao Visto por Último",
            known: "Conhecidos",
            disable: "Desativada",
            hrs24: "24 Horas",
            dias7: "7 Dias",
            dias90: "90 Dias",
          },
          readreceipts: "Para atualizar a privacidade dos recibos de leitura",
          profile: "Para atualizar a privacidade da foto do perfil",
          status: "Para atualizar a privacidade do recados",
          online: "Para atualizar a privacidade online",
          last: "Para atualizar a privacidade do Último Visto",
          groupadd: "Para atualizar a privacidade de Adicionar a grupos",
          calladd: "Para atualizar a privacidade de Adicionar a Ligações",
          disappearing: "Para atualizar o Modo de Desaparecimento Padrão",
        },
      },
      backendErrors: {
        ERR_UNAUTHORIZED: "Você não está autorizado a acessar este recurso.",
        ERR_FORBIDDEN: "Você não tem permissão para acessar este recurso.",
        ERR_CHECK_NUMBER: "Verifique o número e tente novamente.",
        ERR_NO_OTHER_WHATSAPP: "Deve haver pelo menos um WhatsApp padrão.",
        ERR_NO_DEF_WAPP_FOUND: "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões.",
        ERR_WAPP_NOT_INITIALIZED: "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões.",
        ERR_WAPP_CHECK_CONTACT: "Não foi possível verificar o contato do WhatsApp. Verifique a página de conexões",
        ERR_WAPP_INVALID_CONTACT: "Este não é um número de Whatsapp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA: "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões.",
        ERR_INVALID_CREDENTIALS: "Erro de autenticação. Por favor, tente novamente.",
        ERR_SENDING_WAPP_MSG: "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões.",
        ERR_DELETE_WAPP_MSG: "Não foi possível excluir a mensagem do WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Não foi possível editar a mensagem do WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Já existe um tíquete aberto para este contato.",
        ERR_SESSION_EXPIRED: "Sessão expirada. Por favor entre.",
        ERR_USER_CREATION_DISABLED: "A criação do usuário foi desabilitada pelo administrador.",
        ERR_NO_PERMISSION: "Você não tem permissão para acessar este recurso.",
        ERR_DUPLICATED_CONTACT: "Já existe um contato com este número.",
        ERR_NO_SETTING_FOUND: "Nenhuma configuração encontrada com este ID.",
        ERR_NO_CONTACT_FOUND: "Nenhum contato encontrado com este ID.",
        ERR_NO_TICKET_FOUND: "Nenhum tíquete encontrado com este ID.",
        ERR_NO_USER_FOUND: "Nenhum usuário encontrado com este ID.",
        ERR_NO_WAPP_FOUND: "Nenhum WhatsApp encontrado com este ID.",
        ERR_CREATING_MESSAGE: "Erro ao criar mensagem no banco de dados.",
        ERR_CREATING_TICKET: "Erro ao criar tíquete no banco de dados.",
        ERR_FETCH_WAPP_MSG: "Erro ao buscar a mensagem no WhtasApp, talvez ela seja muito antiga.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS: "Esta cor já está em uso, escolha outra.",
        ERR_WAPP_GREETING_REQUIRED: "A mensagem de saudação é obrigatório quando há mais de uma fila.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Assinatura inválida ou não encontrada",
        ERR_WAPP_NOT_FOUND: "Conexão indisponível",
        ERR_SUBSCRIPTION_EXPIRED: "Assinatura expirada",
        ERR_UNKOWN: "Erro desconhecido",
      },
      ticketz: {
        registration: {
          header: "Cadastre-se na base de usuários do Ticketz",
          description: "Preencha os campos abaixo para se cadastrar na base de usuários do Ticketz e receber novidades sobre o projeto.",
          name: "Nome",
          country: "País",
          phoneNumber: "Número de Whatsapp",
          submit: "Cadastrar",
        },
        support: {
          title: "Apoie o projeto Ticketz Open Source",
          mercadopagotitle: "Cartão de Crédito",
          recurringbrl: "Doação recorrente em R$",
          paypaltitle: "Cartão de Crédito",
          international: "Internacional em US$",
        }
      },
      owenAd: {
        title: "Owen Payments apoia o Ticketz",
        description1: "A startup Owen Payments oferece recebimentos via PIX a custo fixo de R$ 0,99 por operação.",
        description2: "Uma fração do valor de cada operação é revertida para o projeto Ticketz, então ao utilizar este meio de recebimento você também estará apoiando o projeto.",
        description3: 'Selecione o gateway de pagamento "Owen Payments 💎" e solicite a abertura da sua conta sem sair do Ticketz!'
      },
    },
  },
};

export { 
  messages 
};