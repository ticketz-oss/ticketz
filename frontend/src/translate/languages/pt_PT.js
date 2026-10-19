const messages = {
  pt_PT: {
    translations: {
      agentPreview: {
        launcher: "Agente Espaço",
        subtitle: "Uma ajuda extra na operação",
        avatarTitle: "Kirby, personagem do Agente Espaço",
        panel: "Agente Espaço · conversa com Luiza's Agent",
        greeting: "Olá, {{name}}.",
        chat: {
          sources: "Fontes consultadas",
          contextChanged:
            "O contexto foi atualizado. Vamos continuar com as permissões e os dados atuais.",
          badge: "Luiza's Agent · do seu lado, na operação",
          connected: "Resposta de Luiza's Agent",
          progress: "A pensar no seu pedido…",
          progressConnecting: "A ligar os pontos…",
          progressWorking: "A trabalhar nisso, já volto…",
          progressPreparing: "A dar forma à sua resposta…",
          progressContinuing: "Mais um instante, estou consigo…",
          error: "Não foi possível receber a resposta. Tente novamente.",
          unavailable:
            "Luiza's Agent está indisponível de momento. Tente novamente.",
          timeout: "Luiza's Agent demorou a responder. Tente novamente.",
          cancelled: "Resposta interrompida.",
          invalidRequest:
            "Não foi possível enviar esta mensagem. Reveja o texto e tente novamente.",
          sessionExpired:
            "A sua sessão expirou. Entre novamente para continuar.",
          permissionDenied: "O seu utilizador não tem acesso a esta conversa.",
          agentDisabled:
            "O Luiza’s está desativado nesta empresa. O super admin pode ativá-lo em Configurações → Administração → Luiza’s Agent.",
          moduleBlocked:
            "O acesso a esta funcionalidade não foi autorizado para o Luiza’s. Peça ao super admin para rever os módulos disponíveis.",
          busy: "O agente está ocupado. Aguarde um momento e tente novamente.",
          notConfigured:
            "A ligação a Luiza's Agent ainda não está configurada.",
          emptyReply:
            "Luiza's Agent não devolveu uma resposta. Tente novamente.",
          retry: "Tentar novamente",
          placeholder: "O que vamos resolver hoje?"
        }
      },
      visual: {
        visualizar: "Visualizar",
        centralAtendimento: "Central de Atendimento",
        alternarNavegacao: "Alternar navegação",
        trilha: "Trilha de navegação",
        ferramentas: "Ferramentas e avisos",
        acoes: "Ações",
        colunas: "Colunas visíveis",
        selecionarPagina: "Selecionar todos nesta página",
        selecionar: "Selecionar {{nome}}",
        selecionados: "{{count}} selecionados",
        limpar: "Limpar seleção",
        carregando: "Carregando…",
        semResultados: "Nenhum resultado encontrado.",
        exibindo: "Mostrando {{count}} de {{total}}",
        anterior: "Página anterior",
        proxima: "Próxima página",
        descricaoContatos:
          "Base de contatos, grupos e informações personalizadas usadas em fluxos e campanhas.",
        importar: "Importar",
        novoContato: "Novo contato",
        nomeTelefone: "Nome / telefone",
        tipo: "Tipo",
        etiquetas: "Etiquetas",
        acoesContato: "Ações de {{nome}}",
        editar: "Editar",
        excluir: "Excluir",
        atualizar: "Atualizar lista",
        exportar: "Exportar",
        buscarContatos: "Buscar por nome, telefone ou e-mail",
        fila: "Fila",
        saudacao: "Mensagem de saudação",
        automacao: "Automação",
        editarFila: "Editar fila {{nome}}",
        novaFila: "Nova fila",
        novoEnvio: "Novo envio",
        campanhas: "Campanhas e envios",
        campanha: "Campanha",
        emAndamento: "Em andamento",
        agendadas: "Agendadas",
        concluidas: "Concluídas",
        inativas: "Inativas",
        canceladas: "Canceladas",
        campanhasPagina: "Campanhas nesta página",
        relatorio: "Ver relatório",
        pausar: "Pausar campanha",
        retomar: "Retomar campanha",
        confirmacao: "Confirmação",
        habilitada: "Habilitada",
        desabilitada: "Desabilitada",
        semAgendamento: "Sem agendamento",
        naoConcluida: "Não concluída",
        publico: "Público",
        conexao: "Conexão",
        resumo: "Visão geral",
        aoVivo: "Ao vivo",
        desempenho: "Desempenho",
        filasAgora: "Filas em tempo real",
        distribuicaoFilas: "Distribuição dos atendimentos abertos por fila.",
        atendentes: "Atendentes",
        periodo: "Período",
        redimensionar: "Redimensionar painéis",
        buscarAtendimentos: "Buscar por nome, telefone ou protocolo",
        contexto: "Contexto",
        detalhesContato: "Detalhes do contato",
        fluxosDescricao:
          "Desenhe caminhos de conversa e configure o atendimento com blocos conectados.",
        canvas: "Canvas",
        editor: "Editor de fluxo",
        versaoPublicada: "Publicado",
        campanhasDescricao:
          "Crie envios, acompanhe campanhas e organize os próximos agendamentos.",
        suporte: "Atendimento",
        blocos: "Blocos",
        filtrar: "Filtrar"
      },
      envios: {
        titulo: "Campanhas e envios",
        massivo: "Envio massivo",
        agendamentos: "Agendamentos",
        publicos: "Públicos e listas",
        configuracao: "Configuração dos envios"
      },
      contexto: {
        segmentos: "Tipos de contato",
        grupos: "Grupos",
        titulo: "Contexto",
        contato: "Contato",
        atendimento: "Atendimento",
        historico: "Histórico",
        carregando: "Carregando histórico…",
        erroHistorico: "Não foi possível consultar o histórico.",
        semHistorico: "Nenhum atendimento anterior disponível.",
        semFila: "Sem fila",
        verConversa: "Ver conversa",
        protocolo: "Protocolo",
        responsavel: "Responsável",
        fila: "Fila"
      },
      centralConfig: {
        secoes: "Áreas de configuração",
        atendimento: "Atendimento",
        equipe: "Equipe e recursos",
        canais: "Canais e integrações",
        administracao: "Administração",
        voltar: "Voltar às configurações",
        itens: {
          filas: {
            titulo: "Filas de atendimento",
            descricao: "Organize os times, canais e horários de cada fila."
          },
          fluxos: {
            titulo: "Fluxos de conversa",
            descricao:
              "Desenhe o atendimento com blocos conectados e teste cada caminho."
          },
          horarios: {
            titulo: "Horário de atendimento",
            descricao:
              "Defina expediente, exceções e disponibilidade da equipe."
          },
          mensagens: {
            titulo: "Mensagens rápidas",
            descricao: "Respostas reutilizáveis e atalhos para os atendentes."
          },
          aparencia: {
            titulo: "Personalizar aparência",
            descricao:
              "Cores, logos, banners e tela de login da sua organização."
          },
          opcoes: {
            titulo: "Regras de atendimento",
            descricao:
              "Avaliações, transferências, tempos de espera e políticas do chatbot."
          },
          usuarios: {
            titulo: "Membros da equipe",
            descricao:
              "Gerencie os usuários, permissões e filas de cada pessoa."
          },
          ajuda: {
            titulo: "Central de ajuda",
            descricao: "Publique orientações e conteúdos para sua equipe."
          },
          conexoes: {
            titulo: "Canais de comunicação",
            descricao: "Conecte e gerencie as contas usadas nos atendimentos."
          },
          integracoes: {
            titulo: "ChatGPT e integrações",
            descricao: "Conecte o ChatGPT e gerencie os acessos autorizados."
          },
          voz: {
            titulo: "Canal de voz",
            descricao: "Gerencie as configurações e conexões de chamadas."
          },
          empresas: {
            titulo: "Organizações",
            descricao: "Administre as empresas cadastradas na plataforma."
          },
          planos: {
            titulo: "Planos e recursos",
            descricao: "Configure os limites e recursos disponíveis por plano."
          },
          parceiros: {
            titulo: "Parceiros",
            descricao: "Gerencie a operação e os acessos dos parceiros."
          },
          pagamentos: {
            titulo: "Meios de pagamento",
            descricao: "Configure os provedores de cobrança da plataforma."
          },
          traducoes: {
            titulo: "Idiomas e traduções",
            descricao: "Personalize os textos e idiomas da plataforma."
          }
        }
      },
      fluxos: {
        titulo: "Fluxos e automação",
        editor: "Editor de fluxo",
        canvas: "Canvas",
        blocos: "Blocos",
        conversa: "Conversa",
        atendimento: "Atendimento",
        fechar: "Fechar",
        entrada: "Entrada do bloco",
        saida: "Saída do bloco",
        pausado: "Pausado",
        semMensagem: "Configure a mensagem no inspetor",
        nomeBloco: "Nome da opção",
        tipoBloco: "Tipo de bloco",
        mensagem: "Mensagem",
        variaveis:
          "Variáveis: {{name}}, {{firstname}}, {{queue}}. O cliente escolhe as opções pelo número.",
        filaDestino: "Fila de destino",
        selecionarFila: "Selecione uma fila",
        descricaoHumano:
          "Interrompe o chatbot e mantém o atendimento disponível para a equipe humana.",
        midia: "Anexo",
        anexar: "Selecionar arquivo",
        removerMidia: "Remover anexo",
        opcoes: "Próximas opções",
        subir: "Mover opção para cima",
        descer: "Mover opção para baixo",
        adicionarOpcao: "Adicionar opção",
        conectadoA: "Bloco anterior",
        semConexao: "Sem conexão",
        blocoAtivo: "Bloco ativo",
        desconectar: "Desconectar",
        excluir: "Excluir",
        carregando: "Carregando fluxo…",
        erroCarregar: "Não foi possível carregar o fluxo.",
        tentarNovamente: "Tentar novamente",
        rascunhoAntigo:
          "Existe um rascunho antigo neste navegador. Foi carregada a versão atual do servidor.",
        erroRascunho:
          "Não foi possível guardar o rascunho neste navegador. Publique antes de sair.",
        publicado: "Fluxo publicado com sucesso.",
        sairRascunho:
          "Há alterações não publicadas. Deseja sair do editor? Anexos pendentes precisam ser selecionados novamente.",
        rascunho: "Rascunho · não publicado",
        emUso: "Publicado",
        contagem: "{{count}} bloco",
        contagem_plural: "{{count}} blocos",
        testar: "Testar percurso",
        publicar: "Publicar",
        buscarBloco: "Buscar bloco",
        dicaPaleta:
          "Arraste um bloco para o canvas ou clique para adicioná-lo. Conecte os pontos para mudar o caminho da conversa.",
        desfazer: "Desfazer",
        refazer: "Refazer",
        minimapa: "Minimapa do fluxo",
        ajudaTeclado:
          "Selecione um bloco para editar. Use o campo Bloco anterior para conectar pelo teclado.",
        reduzirZoom: "Reduzir zoom",
        aumentarZoom: "Aumentar zoom",
        enquadrar: "Enquadrar fluxo",
        organizar: "Organizar blocos",
        pendencias:
          "{{count}} bloco precisa de nome, conexão ou fila de destino.",
        pendencias_plural:
          "{{count}} blocos precisam de nome, conexão ou fila de destino.",
        pronto:
          "Todas as conexões estão válidas. As alterações entram em uso ao publicar.",
        simulacaoDescricao:
          "Percorra as opções como seu cliente. Esta prévia não envia mensagens nem altera atendimentos.",
        simulacaoHumano:
          "O chatbot para e a equipe humana continua o atendimento.",
        simulacaoTransferencia: "A conversa segue para a fila {{fila}}.",
        simulacaoFim:
          "Fim do fluxo. O atendimento fica disponível para a equipa humana.",
        reiniciar: "Reiniciar teste",
        excluirBloco: "Excluir bloco?",
        excluirDescricao:
          "Os blocos seguintes serão mantidos, sem conexão. Reconecte-os antes de publicar.",
        selecionarFluxo: "Selecionar fluxo",
        novoFluxo: "Criar fluxo",
        secoes: "Seções de automação",
        filasCanais: "Filas e canais",
        integracoes: "Integrações",
        primeiroFluxo: "Desenhe sua primeira conversa",
        descricaoInicio:
          "Crie uma fila, adicione os blocos e conecte as etapas do atendimento.",
        descricaoEditor:
          "Crie, conecte e teste os blocos em um canvas com visão completa da conversa.",
        abrirEditor: "Abrir canvas",
        tipos: {
          inicio: "Início da conversa",
          mensagem: "Enviar mensagem",
          menu: "Menu de opções",
          midia: "Enviar mídia",
          transferir: "Transferir para fila",
          humano: "Atendimento humano"
        }
      },
      redesign: {
        importarCsv: "Importar arquivo CSV",
        exportarCsv: "Exportar contatos em CSV",
        descricaoContatos:
          "Base de contatos, grupos e informações para um atendimento próximo.",
        descricaoCampanhas:
          "Disparos e agendamentos reunidos para acompanhar cada envio.",
        descricaoConfiguracoes:
          "Regras de atendimento, equipe, canais e identidade da sua organização.",

        operacao: "Operação",
        relacionamento: "Relacionamento",
        automacao: "Automação e IA",
        administracao: "Administração",
        envios: "Envios e campanhas",
        listasContatos: "Listas de contatos",
        abrirAtendimento: "Abrir atendimento",
        visaoGeral: "Visão geral da operação",
        descricaoPainel: "Indicadores, atendimentos e equipe em um só lugar.",
        organizacao: "Organização"
      },
      voiceCalls: {
        settingsTab: "Chamadas experimentais",
        companySwitch: "Chamadas experimentais",
        enabled: "Ativadas",
        disabled: "Desativadas",
        experimentalTitle: "Integração experimental de chamadas",
        warning:
          "Integração não oficial com o WhatsApp. Existe risco de desconexão, suspensão ou bloqueio. Utilize apenas no tenant de testes.",
        serviceUnavailable:
          "O serviço de chamadas não está disponível neste momento.",
        riskConsent:
          "Compreendo o risco e quero associar um segundo dispositivo por código QR.",
        status: "Estado",
        disconnect: "Desligar e desassociar",
        pair: "Associar por código QR",
        noConnections:
          "Crie primeiro uma ligação ao WhatsApp para configurar chamadas.",
        qrInstruction:
          "No WhatsApp, abra Dispositivos associados e leia este segundo código QR.",
        disconnectedSuccess: "Integração de chamadas desassociada.",
        incoming: "Chamada recebida",
        incomingHint: "O primeiro atendente a aceitar ficará com a chamada.",
        reject: "Recusar",
        accept: "Atender",
        active: "Chamada em curso",
        mute: "Silenciar microfone",
        transcribe: "Transcrever chamada",
        record: "Gravar chamada",
        end: "Terminar",
        states: {
          disconnected: "Desligada",
          pairing: "A aguardar código QR",
          connecting: "A ligar",
          open: "Ligada",
          logged_out: "Desassociada"
        },
        errors: {
          load: "Não foi possível carregar as chamadas experimentais.",
          pair: "Não foi possível gerar o código QR de chamadas.",
          action: "Não foi possível concluir a ação da chamada.",
          transcriptionConfig:
            "Configure GROQ_API_KEY no ambiente para ativar a transcrição.",
          microphone: "O microfone foi recusado. A chamada foi terminada."
        }
      },
      common: {
        search: "Pesquisar",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Salvar",
        confirm: "Confirmar",
        confirmation: "Confirmação",
        areyousure: "Tem certeza?",
        close: "Fechar",
        closed: "Fechado",
        error: "Erro",
        success: "Sucesso",
        actions: "Ações",
        add: "Adicionar",
        name: "Nome",
        email: "Email",
        phone: "Telefone",
        language: "Idioma",
        company: "Empresa",
        user: "Utilizador",
        users: "Utilizadores",
        connection: "Conexão",
        connections: "Conexões",
        queue: "Fila",
        queues: "Filas",
        contact: "Contacto",
        messages: "Mensagens",
        whatsappNumber: "Número do Whatsapp",
        dueDate: "Data de vencimento",
        copy: "Copiar",
        paste: "Colar",
        proceed: "Prosseguir",
        enabled: "Ativado",
        disabled: "Desativado",
        undefined: "Indefinido",
        yes: "Sim",
        no: "Não",
        noqueue: "Sem fila",
        rating: "Classificação",
        transferTo: "Transferir para",
        key: "Chave",
        value: "Valor",
        validations: {
          required: "Este campo é obrigatório",
          short: "Valor demasiado curto",
          long: "Valor demasiado longo",
          invalid: "Valor inválido",
          invalidEmail: "Email inválido",
          invalidPhone: "Número de telefone inválido"
        },
        serverTime: "Hora do servidor:",
        clientTime: "Hora do cliente:",
        differenceMinutes: "Diferença: {{count}} minuto(s)"
      },
      signup: {
        title: "Registar",
        toasts: {
          success: "Utilizador criado com sucesso! Faça o seu login!!!",
          fail: "Erro ao criar utilizador. Verifique os dados fornecidos."
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Palavra-passe"
        },
        buttons: {
          submit: "Registar",
          login: "Já tem uma conta? Entre!"
        }
      },
      login: {
        title: "Entrar",
        form: {
          email: "Email",
          password: "Palavra-passe",
          newPassword: "Nova palavra-passe",
          confirmPassword: "Confirmar palavra-passe",
          passwordStrength:
            "Use pelo menos 8 caracteres, com maiúscula, minúscula e número."
        },
        buttons: {
          submit: "Entrar",
          continue: "Continuar",
          createPassword: "Criar palavra-passe e entrar",
          changeEmail: "Alterar email",
          backToLogin: "Voltar ao login",
          register: "Não tem uma conta? Registe-se!"
        },
        errors: {
          emailNotFound: "Não encontrámos este email.",
          passwordMismatch: "As palavras-passe não coincidem.",
          passwordStrength:
            "A palavra-passe deve ter pelo menos 8 caracteres, com maiúscula, minúscula e número.",
          activationInvalid: "Este link de ativação é inválido ou expirou."
        },
        activation: {
          title: "Crie a sua palavra-passe",
          account: "A ativar a conta {{email}}"
        }
      },
      companies: {
        title: "Registar Empresa",
        form: {
          name: "Nome da Empresa",
          plan: "Plano",
          token: "Token",
          submit: "Registar",
          success: "Empresa criada com sucesso!"
        }
      },
      auth: {
        toasts: {
          success: "Login efetuado com sucesso!"
        },
        token: "Token"
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Atendimentos hoje: "
          }
        },
        blog: {
          title: "Blog do Espaço Whats",
          loading: "A carregar artigos...",
          error: "Nao foi possivel carregar os artigos do blog.",
          empty: "Nenhum artigo encontrado.",
          showAll: "Mostrar todos os artigos",
          showLess: "Mostrar menos",
          openPost: "Ler artigo",
          previous: "Artigo anterior",
          next: "Proximo artigo"
        }
      },
      connections: {
        title: "Conexões",
        toasts: {
          deleted: "Conexão com o WhatsApp excluída com sucesso!"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Tem a certeza? Esta ação não pode ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage: "Tem a certeza? Terá de ler o QR Code novamente.",
          closetTickets: "Fechar todos os atendimentos abertos desta conexão"
        },
        buttons: {
          add: "Adicionar WhatsApp",
          disconnect: "Desconectar",
          tryAgain: "Tentar novamente",
          qrcode: "QR CODE",
          newQr: "Novo QR CODE",
          connecting: "A conectar"
        },
        toolTips: {
          disconnected: {
            title: "Falha ao iniciar sessão do WhatsApp",
            content:
              "Certifique-se de que o seu telemóvel está conectado à internet e tente novamente, ou solicite um novo QR Code"
          },
          qrcode: {
            title: "A aguardar leitura do QR Code",
            content:
              "Clique no botão 'QR CODE' e leia o QR Code com o seu telemóvel para iniciar a sessão"
          },
          connected: {
            title: "Conexão estabelecida!"
          },
          timeout: {
            title: "A conexão com o telemóvel foi perdida",
            content:
              "Certifique-se de que o seu telemóvel está conectado à internet e o WhatsApp está aberto, ou clique no botão 'Desconectar' para obter um novo QR Code"
          },
          passkey: {
            title: "Autenticação por passkey necessária",
            content:
              "Clique no botão de passkey e utilize a extensão do navegador para capturar a sessão autenticada do WhatsApp Web."
          },
          resetPasskey: "Reiniciar sessão passkey"
        },
        table: {
          contact: "Contacto",
          name: "Nome",
          status: "Estado",
          lastUpdate: "Última atualização",
          default: "Padrão",
          actions: "Ações",
          session: "Sessão"
        }
      },
      internalChat: {
        title: "Chat Interno"
      },
      whatsappGroups: {
        configure: "Configurar grupo",
        mode: "Modo do grupo",
        conversation: "Conversa",
        attendance: "Atendimento",
        allowedQueues: "Filas autorizadas",
        serviceQueue: "Fila do atendimento",
        cancel: "Cancelar",
        save: "Guardar",
        you: "Você",
        confirmConversation:
          "Retirar este grupo do fluxo de atendimento? O atendimento ativo será encerrado sem avaliação."
      },
      whatsappModal: {
        title: {
          add: "Adicionar WhatsApp",
          edit: "Editar WhatsApp"
        },
        form: {
          name: "Nome",
          default: "Padrão"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "WhatsApp salvo com sucesso."
      },
      qrCode: {
        message: "Leia o QrCode para iniciar a sessão",
        extensionHint: "Autenticar pelo WhatsApp Web",
        startCapture: "Capturar sessão do WhatsApp Web",
        installExtension: "Instalar Extensão de Captura"
      },
      passkeyModal: {
        title: "Extensão de Captura do WhatsApp Web",
        instructions:
          "Utilize a extensão do navegador para capturar a sessão autenticada do WhatsApp Web e enviá-la ao servidor.",
        connectorNotFound:
          "Extensão não detetada. Instale a extensão de captura passkey e recarregue a página.",
        connectorReady:
          "Extensão detetada. Clique abaixo para se autenticar pelo WhatsApp Web.",
        startCapture: "Iniciar Captura",
        waitingForCapture: "A aguardar a captura da sessão do WhatsApp Web…",
        existingSession: "O WhatsApp Web já tem uma sessão para {{number}}.",
        captureExisting: "Capturar esta sessão",
        clearAndContinue: "Limpar sessão local e continuar",
        importSent: "Sessão capturada e enviada com sucesso.",
        importError: "Falha na captura: {{reason}}.",
        missingToken: "Token de captura em falta. Recarregue a página.",
        downloadExtension: "Transferir extensão de captura",
        installInstructions: "Como instalar",
        hideInstructions: "Ocultar instruções",
        instructionsIntro: "Siga os passos abaixo para instalar a extensão:",
        installStep1: "Transfira o ficheiro ZIP da extensão.",
        installStep2:
          "Descompacte o ficheiro ZIP para uma pasta no seu computador.",
        installStep3: "Abra o Google Chrome e aceda a chrome://extensions/.",
        installStep4:
          "Ative o Modo de programador com o botão no canto superior direito.",
        installStep5: 'Clique em "Carregar expandida".',
        installStep6:
          "Selecione a pasta extraída que contém os ficheiros da extensão.",
        installStep7: "A extensão está instalada e pronta a usar.",
        installStep8: "Recarregue esta página com F5 e tente ligar novamente."
      },
      contacts: {
        title: "Contactos",
        toasts: {
          deleted: "Contacto excluído com sucesso!"
        },
        searchPlaceholder: "Pesquisar...",
        confirmationModal: {
          deleteTitle: "Eliminar",
          importTitlte: "Importar contactos",
          deleteMessage: "Interações relacionadas serão perdidas.",
          importMessage: "Deseja importar todos os contactos do telefone?"
        },
        buttons: {
          import: "Importar Contactos",
          add: "Adicionar Contacto"
        },
        table: {
          name: "Nome",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Ações"
        }
      },
      contactModal: {
        title: {
          add: "Adicionar contacto",
          edit: "Editar contacto"
        },
        form: {
          mainInfo: "Dados do contacto",
          extraInfo: "Informações adicionais",
          name: "Nome",
          number: "Número do WhatsApp",
          email: "Email",
          extraName: "Nome do campo",
          extraValue: "Valor",
          disableBot: "Desativar chatbot"
        },
        buttons: {
          addExtraInfo: "Adicionar informação",
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Contacto salvo com sucesso."
      },
      queueModal: {
        title: {
          add: "Adicionar fila",
          edit: "Editar fila"
        },
        form: {
          name: "Nome",
          color: "Cor",
          greetingMessage: "Mensagem de saudação",
          complationMessage: "Mensagem de conclusão",
          outOfHoursMessage: "Mensagem fora de expediente",
          ratingMessage: "Mensagem de avaliação",
          transferMessage: "Mensagem de Transferência",
          connections: "Conexões de WhatsApp",
          connectionsHelp:
            "A fila e o chatbot serão apresentados apenas nestas conexões.",
          token: "Token"
        },
        validation: {
          connectionRequired: "Selecione pelo menos uma conexão para a fila."
        },
        toasts: {
          saved: "Fila salva com sucesso"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          attach: "Anexar Ficheiro"
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
          sunday: "Domingo"
        }
      },
      userModal: {
        title: {
          add: "Adicionar utilizador",
          edit: "Editar utilizador"
        },
        listItems: {
          adminProfile: "Administrador",
          userProfile: "Usuário"
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Palavra-passe",
          profile: "Perfil"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },

        success: "Utilizador salvo com sucesso."
      },
      scheduleModal: {
        title: {
          add: "Novo Agendamento",
          edit: "Editar Agendamento"
        },
        form: {
          body: "Mensagem",
          contact: "Contacto",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          saveMessage: "Salvar Mensagem no Ticket"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Agendamento salvo com sucesso."
      },
      tagModal: {
        title: {
          add: "Nova Tag",
          edit: "Editar Tag",
          addKanban: "Nova Lane",
          editKanban: "Editar Lane"
        },
        form: {
          name: "Nome",
          color: "Cor",
          kanban: "Kanban"
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Tag salva com sucesso.",
        successKanban: "Lane salva com sucesso."
      },
      chat: {
        noTicketMessage: "Selecione um ticket para começar a conversar."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTE E SOLTE FICHEIROS NO CAMPO ABAIXO",
          titleFileList: "Lista de ficheiros"
        }
      },
      billing: {
        trialDays: "Dias de teste grátis",
        trialDaysHelp: "0 significa sem período grátis",
        dueDay: "Dia do vencimento",
        dueDayHelp: "Mensal; meses menores usam o último dia",
        prorata: "Pró-rata",
        trialEndsIn: "O período de teste termina em {{days}} dias!",
        noActiveTrial: "Sem período de teste ativo",
        period: "Período: {{start}} a {{end}}"
      },
      todolist: {
        title: "Quadro de tarefas",
        loading: "A carregar o quadro...",
        loadError: "Não foi possível carregar o quadro.",
        emptyColumn: "Arraste uma tarefa para esta coluna",
        dragTask: "Mover tarefa",
        dragTaskLabel: "Mover tarefa {{title}}",
        completedAt: "Concluída em {{date}}",
        editTaskTitle: "Editar tarefa",
        newTaskTitle: "Nova tarefa",
        targets: { global: "Global", user: "Utilizador", queue: "Fila" },
        deadline: {
          ok: "Dentro do prazo",
          warning: "Prazo próximo",
          overdue: "Em atraso"
        },
        details: {
          noDescription: "Sem descrição",
          state: "Estado",
          createdBy: "Criada por",
          target: "Destino",
          createdAt: "Criada em",
          dueAt: "Prazo",
          completedAt: "Concluída em",
          history: "Histórico"
        },
        events: {
          CREATED: "Criada",
          EDITED: "Editada",
          MOVED: "Movida",
          COMPLETED: "Concluída",
          REOPENED: "Reaberta"
        },
        form: {
          name: "Nome da tarefa",
          columnName: "Nome da coluna",
          description: "Descrição",
          targetType: "Destino",
          assignee: "Utilizador responsável",
          queue: "Fila responsável",
          dueAt: "Prazo"
        },
        buttons: {
          add: "Adicionar",
          newTask: "Nova tarefa",
          save: "Guardar",
          configure: "Configurar colunas",
          clearFilter: "Limpar filtro",
          tryAgain: "Tentar novamente",
          editTask: "Editar tarefa",
          deleteTask: "Eliminar tarefa",
          addColumn: "Adicionar coluna"
        },
        filters: {
          from: "Concluídas de",
          to: "Concluídas até",
          invalidDate: "Data inválida"
        },
        settings: {
          title: "Configurar colunas",
          description:
            "Personalize a ordem, os nomes e as cores. Apenas uma coluna representa tarefas concluídas.",
          markDone: "Marcar {{title}} como coluna concluída",
          doneColumn: "Coluna de tarefas concluídas",
          regularColumn: "Coluna de tarefas em curso",
          moveLeft: "Mover para a esquerda",
          moveRight: "Mover para a direita",
          editColumn: "Editar coluna",
          newColumn: "Nova coluna",
          chooseColor: "Escolher cor",
          useBrandColor: "Usar cor da empresa"
        },
        confirm: {
          deleteTaskTitle: "Eliminar tarefa",
          deleteTask: "Deseja eliminar a tarefa “{{title}}”?",
          deleteColumnTitle: "Eliminar coluna",
          deleteColumn: "Deseja eliminar a coluna “{{title}}”?"
        },
        toasts: {
          taskCreated: "Tarefa criada.",
          taskSaved: "Tarefa atualizada.",
          taskDeleted: "Tarefa eliminada.",
          columnSaved: "Coluna guardada.",
          columnDeleted: "Coluna eliminada.",
          doneColumnChanged: "Coluna de conclusão atualizada."
        }
      },
      ticketsManager: {
        buttons: {
          newTicket: "Novo"
        }
      },
      ticketsQueueSelect: {
        placeholder: "Filas"
      },
      tickets: {
        toasts: {
          deleted: "O atendimento que estava a gerir foi eliminado."
        },
        notification: {
          message: "Mensagem de",
          nomessages: "Sem novas mensagens"
        },
        tabs: {
          open: { title: "Abertos" },
          closed: { title: "Resolvidos" },
          groups: {
            title: "Grupos",
            conversations: "Conversas",
            attendances: "Atendimentos",
            pending: "Pendentes",
            open: "Em atendimento",
            closed: "Finalizados"
          },
          search: { title: "Busca" }
        },
        search: {
          placeholder: "Buscar atendimento e mensagens",
          filterByTags: "Filtro por tags",
          filterByUsers: "Filtro por usuários"
        },
        buttons: {
          showAll: "Todos"
        }
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Digite para buscar utilizadores",
        fieldConnectionLabel: "Encaminhar pela conexão",
        fieldConnectionPlaceholder: "Selecione uma conexão",
        connectionHelp:
          "Depois de escolher a conexão, selecione uma fila disponível nela.",
        connectionUnavailable: "desconectada",
        fieldQueueLabel: "Transferir para fila",
        fieldQueuePlaceholder: "Selecione uma fila",
        noOptions: "Nenhum utilizador encontrado com esse nome",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar"
        }
      },
      ticketsList: {
        pendingHeader: "Aguardando",
        assignedHeader: "Em atendimento",
        noTicketsTitle: "Nada aqui!",
        noTicketsMessage:
          "Nenhum atendimento encontrado com este estado ou termo pesquisado",
        buttons: {
          accept: "Aceitar"
        }
      },
      newTicketModal: {
        title: "Criar Ticket",
        fieldLabel: "Digite para pesquisar o contacto",
        add: "Adicionar",
        buttons: {
          ok: "Salvar",
          cancel: "Cancelar"
        }
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Conexões",
          tickets: "Atendimentos",
          quickMessages: "Respostas Rápidas",
          contacts: "Contactos",
          queues: "Filas & Chatbot",
          tags: "Tags",
          administration: "Administração",
          service: "Serviço",
          users: "Utilizadores",
          settings: "Configurações",
          helps: "Ajuda",
          chatgpt: "ChatGPT",
          schedules: "Agendamentos",
          campaigns: "Campanhas",
          annoucements: "Informativos",
          chats: "Chat Interno",
          financeiro: "Financeiro",
          cobranca: "Cobrança",
          prospeccao: "Prospeção",
          logout: "Sair",
          management: "Gestão",
          kanban: "Kanban",
          tasks: "Tarefas"
        },
        appBar: {
          i18n: {
            language: "Português 🇵🇹",
            language_short: "pt_PT"
          },
          user: {
            profile: "Perfil",
            subscriptionValidUntilLabel: "Assinatura válida até",
            darkmode: "Modo escuro",
            lightmode: "Modo claro",
            language: "Selecionar idioma",
            about: "Sobre",
            logout: "Sair"
          }
        }
      },
      chatgpt: {
        title: "ChatGPT",
        enabled: "Piloto ativado",
        disabled: "Piloto desativado",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Recomendado",
          description:
            "A forma mais simples de utilizar os seus atendimentos no ChatGPT.",
          details:
            "Instale o plugin, ligue a sua conta Espaço Whats por OAuth e utilize-o nas conversas através do menu de plugins ou mencionando @EspaçoWhats.",
          open: "Abrir plugin no ChatGPT",
          steps: {
            title: "Como instalar e ligar",
            open: "Abra o plugin Espaço Whats no ChatGPT",
            install: "Clique em Instalar plugin",
            connect: "Selecione Ligar",
            login: "Entre com tenant, e-mail e senha de administrador",
            use: "Utilize o menu de plugins ou mencione @EspaçoWhats"
          },
          marketplace: {
            title: "Instalação para workspaces pelo GitHub",
            description:
              "Um administrador também pode importar o marketplace oficial em Definições do workspace → Plugins → Adicionar → Importar marketplace.",
            repository: "Repositório",
            path: "Caminho",
            pathValue: "Deixe em branco",
            branch: "Branch",
            copy: "Copiar repositório"
          }
        },
        warningTitle: "Dados pessoais e clínicos",
        warning:
          "Ao ligar, conversas identificáveis e possíveis dados clínicos poderão ser enviados ao ChatGPT conforme as suas perguntas. Utilize apenas após aprovação jurídica e administrativa.",
        copy: "Copiar URL",
        connection: {
          title: "URL do servidor MCP",
          description:
            "O Espaço Whats não utiliza uma chave OpenAI. A inteligência e os limites pertencem ao plano ChatGPT do utilizador."
        },
        steps: {
          title: "Como ligar",
          open: "Abra o Developer Mode do ChatGPT",
          create: "Crie uma integração MCP Draft",
          url: "Cole o URL MCP",
          oauth: "Escolha OAuth",
          login: "Entre com tenant, e-mail e palavra-passe de administrador"
        },
        connections: {
          title: "Ligações ativas",
          empty: "Nenhum ChatGPT ligado.",
          client: "Cliente",
          admin: "Administrador",
          created: "Criada em",
          lastUse: "Última utilização",
          revoke: "Revogar",
          revokeAll: "Revogar todas"
        },
        revoke: {
          title: "Revogar ligação",
          one: "Esta ligação perderá o acesso imediatamente.",
          all: "Todas as ligações deste tenant perderão o acesso imediatamente."
        },
        toasts: {
          copied: "URL MCP copiado.",
          repositoryCopied: "Repositório do plugin copiado.",
          revoked: "Ligação revogada."
        }
      },
      notifications: {
        noTickets: "Nenhuma notificação."
      },
      quickMessages: {
        title: "Respostas Rápidas",
        buttons: {
          add: "Nova Resposta"
        },
        dialog: {
          shortcode: "Atalho",
          message: "Resposta"
        }
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
          deleteTitle: "Tem a certeza que quer excluir esta Lane?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          actions: "Ações"
        },
        buttons: {
          add: "Nova Lane"
        },
        toasts: {
          deleted: "Lane excluída com sucesso."
        }
      },
      contactLists: {
        title: "Listas de Contactos",
        table: {
          name: "Nome",
          contacts: "Contactos",
          actions: "Ações"
        },
        buttons: {
          add: "Nova Lista"
        },
        dialog: {
          name: "Nome",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        toasts: {
          deleted: "Registro excluído",
          created: "Registro criado"
        }
      },
      contactListItems: {
        title: "Contactos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo",
          lists: "Listas",
          import: "Importar"
        },
        dialog: {
          name: "Nome",
          number: "Número",
          whatsapp: "WhatsApp",
          email: "Email",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar"
        },
        table: {
          name: "Nome",
          number: "Número",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Ações"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
          importMessage: "Deseja importar os contactos desta planilha?",
          importTitlte: "Importar"
        },
        toasts: {
          deleted: "Registro excluído"
        }
      },
      campaigns: {
        title: "Campanhas",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Nova Campanha",
          contactLists: "Listas de Contactos"
        },
        table: {
          name: "Nome",
          whatsapp: "Conexão",
          contactList: "Lista de Contactos",
          status: "Estado",
          scheduledAt: "Agendamento",
          completedAt: "Concluída",
          confirmation: "Confirmação",
          actions: "Ações"
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
            status: "Estado",
            scheduledAt: "Agendamento",
            confirmation: "Confirmação",
            contactList: "Lista de Contactos"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar Envios",
            restart: "Reiniciar Envios",
            close: "Fechar",
            attach: "Anexar Ficheiro"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        toasts: {
          success: "Operação realizada com sucesso",
          cancel: "Campanha cancelada",
          restart: "Campanha reiniciada",
          deleted: "Registro excluído"
        }
      },
      announcements: {
        title: "Informativos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo Informativo",
          contactLists: "Listas de Informativos"
        },
        table: {
          priority: "Prioridade",
          title: "Título",
          text: "Texto",
          mediaName: "Ficheiro",
          status: "Estado",
          actions: "Ações"
        },
        dialog: {
          edit: "Edição de Informativo",
          add: "Novo Informativo",
          update: "Editar Informativo",
          readonly: "Apenas Visualização",
          form: {
            priority: "Prioridade",
            title: "Título",
            text: "Texto",
            mediaPath: "Ficheiro",
            status: "Estado"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Fechar",
            attach: "Anexar Ficheiro"
          }
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        toasts: {
          success: "Operação realizada com sucesso",
          deleted: "Registro excluído"
        }
      },
      campaignsConfig: {
        title: "Configurações de Campanhas",
        intervals: "Intervalos",
        messageInterval: "Intervalo entre mensagens (segundos)",
        longerIntervalAfter: "Intervalo maior após (mensagens)",
        longerInterval: "Intervalo maior (segundos)",
        addVariable: "Adicionar variável"
      },
      queues: {
        title: "Filas & Chatbot",
        table: {
          name: "Nome",
          color: "Cor",
          greeting: "Mensagem de saudação",
          actions: "Ações"
        },
        toasts: {
          deleted: "Fila removida com sucesso"
        },
        buttons: {
          add: "Adicionar fila"
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Tem a certeza? Esta ação não pode ser revertida! Os atendimentos desta fila continuarão a existir, mas não terão mais nenhuma fila atribuída."
        }
      },
      queueSelect: {
        inputLabel: "Filas"
      },
      users: {
        title: "Utilizadores",
        empty: "Nenhum utilizador encontrado.",
        filters: {
          queue: "Fila",
          allQueues: "Todas as filas"
        },
        profiles: {
          admin: "Administrador",
          user: "Utilizador"
        },
        groups: {
          admin: "Administradores",
          user: "Utilizadores"
        },
        table: {
          name: "Nome",
          email: "Email",
          profile: "Perfil",
          queues: "Filas",
          noQueues: "Sem filas",
          actions: "Ações"
        },
        buttons: {
          add: "Adicionar utilizador"
        },
        toasts: {
          deleted: "Utilizador excluído com sucesso."
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Todos os dados do utilizador serão perdidos. Os atendimentos abertos deste utilizador serão movidos para a fila."
        }
      },
      helps: {
        title: "Central de Ajuda",
        adminOnly: "Só administradores",
        groupModal: {
          adminOnlyHelper:
            "Este cartão e todo o conteúdo ficam ocultos para utilizadores comuns."
        },
        contentModal: {
          adminOnly: "Visível apenas para administradores"
        }
      },
      about: {
        aboutthe: "Sobre o",
        copyright: "© 2024 - Funcionando com Espaço Whats",
        buttonclose: "Fechar",
        title: "Sobre o Espaço Whats",
        abouttitle: "Origem e melhorias",
        aboutdetail:
          "O Espaço Whats é derivado indireto do projeto Whaticket com melhorias compartilhadas pelos desenvolvedores do sistema EquipeChat através do canal VemFazer no YouTube, posteriormente melhoradas por Claudemir Todo Bom",
        aboutauthorsite: "Site do autor",
        aboutwhaticketsite: "Site do Whaticket Community no Github",
        aboutvemfazersite: "Site do canal Vem Fazer no Github",
        licenseheading: "Licença em Código Aberto",
        licensedetail:
          "O Espaço Whats está licenciado sob a GNU Affero General Public License versão 3, isso significa que qualquer utilizador que tiver acesso a esta aplicação tem o direito de obter acesso ao código fonte. Mais informações nos links abaixo:",
        licensefulltext: "Texto completo da licença",
        licensesourcecode: "Código fonte do Espaço Whats"
      },
      schedules: {
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "Tem a certeza que quer excluir este Agendamento?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          contact: "Contacto",
          body: "Mensagem",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          status: "Estado",
          actions: "Ações"
        },
        buttons: {
          add: "Novo Agendamento"
        },
        toasts: {
          deleted: "Agendamento excluído com sucesso."
        }
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Tem a certeza que quer excluir esta Tag?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          contacts: "Contactos",
          actions: "Ações",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nova Tag"
        },
        toasts: {
          deleted: "Tag excluída com sucesso."
        }
      },
      whitelabel: {
        primaryColorLight: "Cor primária clara",
        primaryColorDark: "Cor primária escura",
        lightLogo: "Logo claro da aplicação",
        darkLogo: "Logo escuro da aplicação",
        favicon: "Favicon da aplicação",
        appname: "Nome da aplicação",
        logoHint: "Prefira SVG e proporção de 28:10",
        faviconHint: "Prefira uma imagem SVG quadrada ou PNG 512x512",
        loginLinks: "Links do login",
        loginLinksHint:
          "Adicione pares de título e URL para mostrar abaixo da caixa de login em desktop e mobile.",
        linkTitle: "Título do link",
        linkUrl: "URL do link",
        removeLink: "Remover link",
        sidePanelImage: "Imagem lateral do login",
        sidePanelImageHint:
          "Mostrada no painel lateral do login em ecrãs desktop.",
        backgroundContent: "Conteúdo de fundo do login",
        backgroundContentHint:
          "Aceita imagens, ficheiros SVG e vídeos MP4 para o fundo do ecrã de login.",
        noFileSelected: "Ainda não foi selecionado nenhum ficheiro.",
        buildExtension: "Construir extensão WA Session Capture",
        buildingExtension: "A construir extensão…",
        downloadExtension: "Transferir extensão",
        extensionHint:
          "Constrói uma extensão Chrome personalizada. O ZIP transferido já contém os ficheiros da extensão: extraia e carregue a pasta extraída como extensão descompactada.",
        extensionBuildStarted:
          "Construção da extensão iniciada. Será notificado quando estiver pronta.",
        extensionBuildFailed:
          "Não foi possível iniciar a construção da extensão.",
        extensionBuilt: "Extensão construída com sucesso.",
        extensionBuildUnknownError: "Erro desconhecido na construção."
      },
      settings: {
        group: {
          general: "Geral",
          timeouts: "Tempos de espera",
          officeHours: "Horário de expediente",
          groups: "Grupos",
          confidenciality: "Confidencialidade",
          api: "API",
          serveradmin: "Administração do servidor"
        },
        success: "Configurações salvas com sucesso.",
        title: "Configurações",
        settings: {
          userCreation: {
            name: "Criação de utilizador",
            options: {
              enabled: "Ativado",
              disabled: "Desativado"
            }
          }
        },
        validations: {
          title: "Avaliações",
          options: {
            enabled: "Habilitado",
            disabled: "Desabilitado"
          }
        },
        OfficeManagement: {
          title: "Gestão de Expediente",
          options: {
            disabled: "Desabilitado",
            ManagementByDepartment: "Gestão Por Fila",
            ManagementByCompany: "Gestão Por Empresa"
          }
        },
        outOfHoursAction: {
          title: "Ação fora do expediente",
          options: {
            pending: "Deixar como pendente",
            closed: "Fechar ticket"
          }
        },
        IgnoreGroupMessages: {
          title: "Ignorar Mensagens de Grupos",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        soundGroupNotifications: {
          title: "Notificações de som de grupo",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        groupsTab: {
          title: "Aba de Grupos",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        VoiceAndVideoCalls: {
          title: "Chamadas de Voz e Vídeo",
          options: {
            enabled: "Ignorar",
            disabled: "Informar indisponibilidade"
          }
        },
        AutomaticChatbotOutput: {
          title: "Saída automática de chatbot",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        ShowNumericEmoticons: {
          title: "Exibir emojis numéricos na fila",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        QuickMessages: {
          title: "Mensagens Rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Utilizador"
          }
        },
        AllowRegistration: {
          title: "Permitir registo",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        FileDownloadLimit: {
          title: "Limite de Download de ficheiros (MB)"
        },
        messageVisibility: {
          title: "Visibilidade da mensagem",
          options: {
            respectMessageQueue: "Respeitar fila da mensagem",
            respectTicketQueue: "Respeitar fila do ticket"
          }
        },
        keepQueueAndUser: {
          title: "Manter fila e utilizador no ticket fechado",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        GracePeriod: {
          title: "Carência após vencimento (dias)"
        },
        ticketAcceptedMessage: {
          title: "Mensagem de ticket aceito",
          placeholder: "Digite sua mensagem de ticket aceito aqui"
        },
        transferMessage: {
          title: "Mensagem de transferência",
          placeholder: "Digite sua mensagem de transferência aqui"
        },
        mustacheVariables: {
          title: "Variáveis disponíveis:"
        },
        WelcomeGreeting: {
          greetings: "Olá",
          welcome: "Bem-vindo a",
          expirationTime: "Ativo até"
        },
        Options: {
          title: "Opções"
        },
        Companies: {
          title: "Empresas"
        },
        schedules: {
          title: "Horários"
        },
        Plans: {
          title: "Planos"
        },
        Help: {
          title: "Ajuda"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Gateways de pagamento"
        }
      },
      messagesList: {
        header: {
          assignedTo: "Atribuído a:",
          buttons: {
            return: "Retornar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceitar",
            call: "Chamar"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Digite uma mensagem",
        placeholderClosed:
          "Reabra ou aceite este ticket para enviar uma mensagem.",
        signMessage: "Assinar",
        replying: "A responder",
        editing: "A editar"
      },
      message: {
        edited: "Editada"
      },
      contactDrawer: {
        header: "Dados do contacto",
        groupHeader: "Dados do grupo",
        buttons: {
          edit: "Editar contacto"
        },
        extraInfo: "Outras informações",
        participants: "Participantes",
        participantsUnavailable: "Não foi possível carregar os participantes",
        you: "você",
        admin: "Administrador",
        owner: "Criador"
      },
      ticketOptionsMenu: {
        schedule: "Agendamento",
        delete: "Eliminar",
        transfer: "Transferir",
        appointmentsModal: {
          title: "Observações do Atendimento",
          textarea: "Observação",
          placeholder: "Insira aqui a informação que deseja registar"
        },
        confirmationModal: {
          title: "Eliminar o ticket do contacto",
          message:
            "Atenção! Todas as mensagens relacionadas ao ticket serão perdidas."
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
        history: "Histórico",
        reply: "Responder",
        confirmationModal: {
          title: "Apagar mensagem?",
          message: "Esta ação não pode ser revertida."
        }
      },
      messageHistoryModal: {
        close: "Fechar",
        title: "Histórico de edição da mensagem"
      },
      presence: {
        unavailable: "Indisponível",
        available: "Disponível",
        composing: "A digitar...",
        recording: "A gravar...",
        paused: "Em pausa"
      },
      privacyModal: {
        title: "Editar Privacidade do WhatsApp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Salvar"
        },
        form: {
          menu: {
            all: "Todos",
            none: "Ninguém",
            contacts: "Meus contactos",
            contact_blacklist: "Contactos selecionados",
            match_last_seen: "Semelhante ao Visto por Último",
            known: "Conhecidos",
            disable: "Desativada",
            hrs24: "24 Horas",
            dias7: "7 Dias",
            dias90: "90 Dias"
          },
          readreceipts: "Para atualizar a privacidade dos recibos de leitura",
          profile: "Para atualizar a privacidade da foto do perfil",
          status: "Para atualizar a privacidade dos estados",
          online: "Para atualizar a privacidade online",
          last: "Para atualizar a privacidade do Último Visto",
          groupadd: "Para atualizar a privacidade de Adicionar a grupos",
          calladd: "Para atualizar a privacidade de Adicionar a Chamadas",
          disappearing: "Para atualizar o Modo de Desaparecimento Padrão"
        }
      },
      phoneNumberInput: {
        country: "País",
        phoneNumber: "Telefone",
        localNumber: "Telefone"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR:
          "Erro de configuração. Por favor, contacte o suporte.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Relógio fora de sincronização. Verifique as configurações de data e hora do seu dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inacessível. Por favor, tente novamente mais tarde.",
        ERR_BACKEND_NOT_READY:
          "O backend está a iniciar e ainda não está pronto. A tentar novamente automaticamente."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "Nenhuma ligação de WhatsApp disponível para abrir a conversa.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "Esse lead já não está na sua base.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Esse lead não tem telefone para abrir conversa.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "A prospeção ainda não foi configurada neste servidor.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "A chave de acesso à prospeção foi recusada. Avise o suporte.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "O serviço de prospeção não respondeu. Tente novamente dentro de alguns minutos.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "O serviço de prospeção recusou esta pesquisa. Reveja o nicho e a cidade.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Esta pesquisa já não existe no serviço de prospeção.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Indique o nicho e a cidade para procurar leads.",
        ERR_FLOW_INVALID: "O fluxo tem dados inválidos. Revise os blocos.",
        ERR_FLOW_CONNECTION:
          "Esta conexão não é permitida. Blocos de transferência e atendimento humano encerram o fluxo.",
        ERR_FLOW_QUEUE_REQUIRED:
          "Selecione uma fila de destino válida e diferente da atual.",
        ERR_FLOW_DISCONNECTED:
          "Conecte todos os blocos ao início sem criar ciclos.",
        ERR_FLOW_CONFLICT:
          "O fluxo foi alterado em outra sessão. Recarregue a página antes de publicar.",
        ERR_FLOW_IN_USE:
          "Um bloco removido está em uso por um atendimento ativo. Desative-o ou aguarde a conclusão antes de excluir.",
        ERR_INVALID_TRIAL_DAYS:
          "Os dias de teste devem ser um inteiro entre 0 e 3650.",
        ERR_INVALID_DUE_DAY:
          "O dia do vencimento deve ser um inteiro entre 1 e 31.",
        ERR_TRIAL_ALREADY_STARTED:
          "O teste grátis não pode ser alterado após o início da cobrança.",
        ERR_TASK_BOARD_INVALID_TITLE: "Indique um título válido.",
        ERR_TASK_BOARD_INVALID_COLOR: "Indique uma cor hexadecimal válida.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Coluna não encontrada.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Tarefa não encontrada.",
        ERR_TASK_BOARD_INVALID_DATE: "Indique uma data válida.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "O intervalo de datas é inválido.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "O quadro precisa de uma coluna de tarefas concluídas.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER: "A ordem das colunas é inválida.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Escolha outra coluna de conclusão antes de eliminar esta.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Mova as tarefas desta coluna antes de a eliminar.",
        ERR_EMAIL_NOT_FOUND: "Não encontrámos este email.",
        ERR_COMPANY_SUSPENDED:
          "Esta conta está suspensa. Contacte o responsável pela sua subscrição.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Esta conta já possui palavra-passe. Volte ao login para entrar.",
        ERR_ACTIVATION_INVALID: "Este link de ativação é inválido ou expirou.",
        ERR_PASSWORD_CONFIRMATION: "As palavras-passe não coincidem.",
        ERR_PASSWORD_TOO_WEAK:
          "A palavra-passe deve ter pelo menos 8 caracteres, com maiúscula, minúscula e número.",
        ERR_UNAUTHORIZED: "Não autorizado. Por favor, faça o login novamente.",
        ERR_FORBIDDEN:
          "Acesso negado. Você não tem permissão para acessar este recurso.",
        ERR_CHECK_NUMBER: "Número não encontrado no Whatsapp.",
        ERR_NO_OTHER_WHATSAPP: "Deve haver pelo menos um WhatsApp padrão.",
        ERR_NO_DEF_WAPP_FOUND:
          "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões.",
        ERR_WAPP_CHECK_CONTACT:
          "Não foi possível verificar o contacto do WhatsApp. Verifique a página de conexões",
        ERR_WAPP_INVALID_CONTACT: "Este não é um número de WhatsApp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões.",
        ERR_INVALID_CREDENTIALS:
          "Erro de autenticação. Por favor, tente novamente.",
        ERR_SENDING_WAPP_MSG:
          "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões.",
        ERR_DELETE_WAPP_MSG: "Não foi possível excluir a mensagem do WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Não foi possível editar a mensagem do WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Já existe um ticket aberto para este contacto.",
        ERR_QUEUE_INVALID_CONNECTION:
          "Uma das conexões selecionadas não pertence a esta empresa.",
        ERR_WAPP_INVALID_QUEUE:
          "Uma das filas selecionadas não pertence a esta empresa.",
        ERR_TICKET_INVALID_CONNECTION:
          "A conexão selecionada não é compatível com este atendimento.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "Não é possível trocar a conexão de um atendimento em grupo.",
        ERR_INVALID_GROUP_MODE: "O modo de grupo indicado é inválido.",
        ERR_GROUP_QUEUE_REQUIRED:
          "Selecione pelo menos uma fila autorizada para o grupo.",
        ERR_GROUP_SERVICE_QUEUE_REQUIRED:
          "Selecione uma fila de atendimento autorizada.",
        ERR_GROUP_CONVERSATION_NOT_TICKET:
          "Este grupo está no modo conversa e não aceita ações de atendimento.",
        ERR_TICKET_CONNECTION_NOT_CONNECTED:
          "A conexão de destino precisa estar conectada.",
        ERR_TICKET_TRANSFER_QUEUE_REQUIRED:
          "Selecione uma fila ao trocar a conexão.",
        ERR_QUEUE_NOT_AVAILABLE_FOR_CONNECTION:
          "Esta fila não está vinculada à conexão selecionada.",
        ERR_SESSION_EXPIRED: "Sessão expirada. Por favor entre novamente.",
        ERR_USER_CREATION_DISABLED:
          "A criação do utilizador foi desabilitada pelo administrador.",
        ERR_NO_PERMISSION: "Você não tem permissão para acessar este recurso.",
        ERR_DUPLICATED_CONTACT: "Já existe um contacto com este número.",
        ERR_NO_SETTING_FOUND: "Nenhuma configuração encontrada com este ID.",
        ERR_NO_CONTACT_FOUND: "Nenhum contacto encontrado com este ID.",
        ERR_NO_TICKET_FOUND: "Nenhum ticket encontrado com este ID.",
        ERR_NO_USER_FOUND: "Nenhum utilizador encontrado com este ID.",
        ERR_NO_WAPP_FOUND: "Nenhum WhatsApp encontrado com este ID.",
        ERR_CREATING_MESSAGE: "Erro ao criar mensagem na base de dados.",
        ERR_CREATING_TICKET: "Erro ao criar ticket na base de dados.",
        ERR_FETCH_WAPP_MSG:
          "Erro ao buscar a mensagem no WhatsApp, talvez ela seja muito antiga.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Esta cor já está em uso, escolha outra.",
        ERR_WAPP_GREETING_REQUIRED:
          "A mensagem de saudação é obrigatória quando há mais de uma fila.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Assinatura inválida ou não encontrada",
        ERR_WAPP_NOT_FOUND: "Conexão indisponível",
        ERR_SUBSCRIPTION_EXPIRED: "Assinatura expirada",
        ERR_UNKOWN: "Erro desconhecido"
      },
      ticketz: {
        registration: {
          header: "Registe-se na base de utilizadores do Espaço Whats",
          description:
            "Preencha os campos abaixo para se registar na base de utilizadores do Espaço Whats e receber novidades sobre o projeto.",
          name: "Nome",
          country: "País",
          phoneNumber: "Número de WhatsApp",
          submit: "Registar"
        },
        proAd: {
          imageAlt: "Captura de ecrã do Espaço Whats PRO",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "WhatsApp Oficial - Instagram - Messenger e outros",
            exclusiveFeatures: "Funcionalidades exclusivas",
            advancedSupport: "Suporte Avançado",
            easyMigration: "Migração Facilitada"
          },
          subscribePrice: "Subscreva por {{monthlyPrice}}/mês",
          subscribeSubtitle: "diretamente dentro do sistema",
          ctaUpgrade: "Clique para instruções de Upgrade",
          ctaVisitSite: "Clique para visitar o site!",
          instructions: {
            title: "Instruções de Upgrade",
            stepIntro:
              "Se instalou as imagens disponibilizadas pelo projeto num servidor ou VPS utilizando as instruções facilitadas, tudo o que precisa fazer é aceder ao seu servidor e escrever o comando abaixo:",
            stepInstall:
              'Em instantes o Espaço Whats PRO estará instalado com todos os seus dados; agora só precisa de ir ao menu de utilizador, clicar em "Assinatura do Espaço Whats PRO" e concluir a subscrição.',
            helpPrefix:
              "Se a sua instalação for diferente ou acreditar que precisa de ajuda para instalar o Espaço Whats PRO, ",
            helpLink: "entre em contacto",
            helpSuffix: " e nós ajudamos!"
          }
        },
        support: {
          title: "Apoie o projeto Espaço Whats Open Source",
          mercadopagotitle: "Cartão de Crédito",
          recurringbrl: "Doação recorrente em R$",
          paypaltitle: "Cartão de Crédito",
          international: "Internacional em US$"
        }
      }
    }
  }
};

export { messages };
