import landingMotion from "./landingMotion";
const messages = {
  pt: {
    translations: {
      agentPreview: {
        launcher: "Agente Espaço",
        subtitle: "Uma mão extra na operação",
        avatarTitle: "Kirby, personagem do Agente Espaço",
        panel: "Agente Espaço · chat com Luiza's Agent",
        greeting: "Olá, {{name}}.",
        chat: {
          sources: "Fontes consultadas",
          contextChanged:
            "O contexto foi atualizado. Vamos continuar com as permissões e os dados atuais.",
          badge: "Luiza's Agent · do seu lado, na operação",
          connected: "Resposta de Luiza's Agent",
          progress: "Pensando no seu pedido…",
          progressConnecting: "Ligando os pontos…",
          progressWorking: "Trabalhando nisso, já volto…",
          progressPreparing: "Caprichando na sua resposta…",
          progressContinuing: "Mais um instante, estou com você…",
          error: "Não foi possível receber a resposta. Tente novamente.",
          unavailable:
            "Luiza's Agent está indisponível no momento. Tente novamente.",
          timeout: "Luiza's Agent demorou a responder. Tente novamente.",
          cancelled: "Resposta interrompida.",
          invalidRequest:
            "Não foi possível enviar esta mensagem. Revise o texto e tente novamente.",
          sessionExpired: "Sua sessão expirou. Entre novamente para continuar.",
          permissionDenied: "Seu usuário não tem acesso a este chat.",
          agentDisabled:
            "O Luiza’s está desativado nesta empresa. O super admin pode ativá-lo em Configurações → Administração → Luiza’s Agent.",
          moduleBlocked:
            "O acesso a esta funcionalidade não foi liberado para o Luiza’s. Peça ao super admin para revisar os módulos disponíveis.",
          busy: "O agente está ocupado. Aguarde um momento e tente novamente.",
          notConfigured:
            "A conexão com Luiza's Agent ainda não está configurada.",
          emptyReply:
            "Luiza's Agent não retornou uma resposta. Tente novamente.",
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
          "Fim do fluxo. O atendimento fica disponível para a equipe humana.",
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
        enabled: "Habilitadas",
        disabled: "Desabilitadas",
        experimentalTitle: "Integração experimental de chamadas",
        warning:
          "Integração não oficial com o WhatsApp. Existe risco de desconexão, suspensão ou banimento. Use somente no tenant de testes.",
        serviceUnavailable:
          "O serviço de chamadas não está disponível no momento.",
        riskConsent:
          "Compreendo o risco e quero vincular um segundo dispositivo por QR Code.",
        status: "Estado",
        disconnect: "Desligar e desvincular",
        pair: "Vincular por QR Code",
        noConnections:
          "Crie primeiro uma conexão de WhatsApp para configurar chamadas.",
        qrInstruction:
          "No WhatsApp, abra Dispositivos conectados e leia este segundo QR Code.",
        disconnectedSuccess: "Integração de chamadas desvinculada.",
        incoming: "Chamada recebida",
        incomingHint: "O primeiro atendente que aceitar ficará com a chamada.",
        reject: "Recusar",
        accept: "Atender",
        active: "Chamada em andamento",
        mute: "Silenciar microfone",
        transcribe: "Transcrever ligação",
        record: "Gravar ligação",
        end: "Encerrar",
        states: {
          disconnected: "Desconectada",
          pairing: "Aguardando QR Code",
          connecting: "Conectando",
          open: "Conectada",
          logged_out: "Desvinculada"
        },
        errors: {
          load: "Não foi possível carregar as chamadas experimentais.",
          pair: "Não foi possível gerar o QR Code de chamadas.",
          action: "Não foi possível concluir a ação da chamada.",
          transcriptionConfig:
            "Configure GROQ_API_KEY no ambiente para ativar a transcrição.",
          microphone: "O microfone foi negado. A chamada foi encerrada."
        }
      },
      landing: {
        motion: landingMotion,
        story: {
          skip: "Pular para o conteúdo",
          login: "Entrar",
          start: "Começar agora",
          createAccount: "Criar minha conta",
          source: "Código-fonte · AGPL",
          heroEyebrow: "Seu WhatsApp. Um novo espaço de trabalho.",
          heroTitle: "Mais conversa.",
          heroHighlight: "Menos caos.",
          heroAside: "Perto do cliente. Junto da equipe.",
          heroDescription:
            "Reúna conversas, pessoas e contexto em uma única central. Seu time atende junto. Seu cliente se sente lembrado.",
          demo: "Demonstração ilustrativa",
          connected: "Tudo conectado",
          introEyebrow: "Espaço para atender melhor",
          introTitle: "O cliente continua a conversa.",
          introHighlight: "Sua equipe também.",
          introDescription:
            "Do primeiro oi ao próximo atendimento, cada pessoa encontra o que precisa para seguir. Sem procurar mensagens em vários celulares.",
          eyebrow: "Uma conversa. Toda a jornada.",
          title: "Chegou uma mensagem.",
          highlight: "O próximo passo já tem lugar.",
          scrollHint:
            "Role para acompanhar a conversa ou escolha uma etapa abaixo.",
          clickHint: "Escolha uma etapa para explorar o atendimento.",
          steps: [
            {
              label: "Receba",
              title: "Toda conversa tem seu espaço.",
              description:
                "Veja quem está aguardando e quem já está em atendimento. Tudo em uma central compartilhada."
            },
            {
              label: "Direcione",
              title: "A pessoa certa. Na hora certa.",
              description:
                "Organize filas e distribua conversas entre os setores. Cada atendimento tem um responsável."
            },
            {
              label: "Continue",
              title: "Troque o atendente. Preserve o contexto.",
              description:
                "Histórico, tags e próximos passos acompanham o cliente. Sua equipe continua de onde parou."
            }
          ],
          featuresTitle: "Uma central. Muitas formas de cuidar.",
          ctaEyebrow: "Seu próximo atendimento começa aqui",
          ctaTitle: "Dê espaço ao que importa.",
          ctaHighlight: "A conversa.",
          ctaDescription:
            "Organize sua operação e aproxime sua equipe de cada cliente."
        },
        meta: {
          title: "Espaço Whats — Atendimento profissional pelo WhatsApp",
          description:
            "Centralize atendimento, CRM, automações, campanhas e indicadores em uma única plataforma."
        },
        nav: {
          home: "Ir para o início",
          menu: "Abrir menu de navegação",
          howItWorks: "Como funciona",
          features: "Recursos",
          integrations: "Integrações",
          team: "Para sua equipe",
          contact: "Contato",
          connection: "Oficial ou QR code",
          plans: "Planos"
        },
        actions: {
          scheduleDemo: "Agendar demonstração",
          seeHow: "Ver como funciona",
          talkWhatsApp: "Falar pelo WhatsApp"
        },
        hero: {
          eyebrow: "Atendimento, CRM e automação em um único lugar",
          titleBefore: "Transforme o WhatsApp em uma",
          titleHighlight: "operação profissional",
          titleAfter: "de atendimento.",
          description:
            "Centralize números, atendentes, clientes, automações e indicadores em uma única plataforma. Sua equipe ganha organização e cada conversa mantém todo o contexto necessário.",
          proofs: [
            "Implantação assistida",
            "Múltiplos atendentes",
            "Gestão em tempo real"
          ],
          queueLabel: "Direcionado automaticamente",
          queueValue: "Fila Comercial",
          productivity: "produtividade"
        },
        problem: {
          eyebrow: "Do improviso ao controle",
          title:
            "Seu atendimento cresceu. O improviso não precisa crescer junto.",
          description:
            "Quando as conversas ficam espalhadas entre celulares, números e pessoas, a empresa perde contexto, agilidade e controle sobre a experiência do cliente.",
          central: "Central organizada",
          items: [
            "Clientes esperando sem saber quem irá responder.",
            "Conversas importantes esquecidas.",
            "Informações espalhadas entre atendentes.",
            "Dificuldade para acompanhar o histórico.",
            "Falta de indicadores sobre a operação.",
            "Dependência de celulares individuais."
          ]
        },
        transformation: {
          eyebrow: "A transformação",
          title: "Uma única central para acompanhar toda a jornada do cliente.",
          items: [
            {
              title: "Atenda com contexto",
              description:
                "Histórico, dados, tags, observações e agendamentos permanecem junto da conversa."
            },
            {
              title: "Organize sua equipe",
              description:
                "Distribua atendimentos entre setores, filas e profissionais com responsabilidades claras."
            },
            {
              title: "Gerencie com segurança",
              description:
                "Acompanhe volume, tempo de espera e desempenho da operação em tempo real."
            }
          ]
        },
        tour: {
          eyebrow: "Tour pelo produto",
          title: "Veja o Espaço Whats funcionando.",
          description:
            "Explore os principais fluxos da plataforma e descubra como cada área trabalha em conjunto.",
          ariaLabel: "Áreas do produto",
          scrollHint: "Continue rolando para avançar pelo sistema",
          items: [
            {
              title: "Atendimento",
              short: "Conversas em uma única central",
              description:
                "Visualize conversas pendentes, em andamento e concluídas por atendente, fila ou tag.",
              highlight: "Todo o atendimento em uma única tela"
            },
            {
              title: "Contatos e CRM",
              short: "Contexto sempre disponível",
              description:
                "Consulte dados, histórico, observações, tags e informações adicionais durante a conversa.",
              highlight: "Histórico completo junto do contato"
            },
            {
              title: "Filas e conexões",
              short: "Números, setores e equipes",
              description:
                "Administre diferentes números, departamentos e equipes dentro da mesma operação.",
              highlight: "Distribuição clara entre equipes"
            },
            {
              title: "Campanhas",
              short: "Envios planejados e mensuráveis",
              description:
                "Importe contatos, programe mensagens, alterne conteúdos e acompanhe cada envio.",
              highlight: "Campanhas acompanhadas em tempo real"
            },
            {
              title: "Dashboard",
              short: "Indicadores para decidir melhor",
              description:
                "Acompanhe atendimentos, usuários online, tempos médios, contatos e desempenho.",
              highlight: "Gestão baseada em dados"
            },
            {
              title: "White-label",
              short: "A plataforma com a sua marca",
              description:
                "Personalize nome, cores, logos, tela de login e toda a identidade visual.",
              highlight: "Sua identidade em toda a experiência"
            }
          ]
        },
        productDemo: {
          admin: "Administrador",
          company: "Empresa demonstração",
          tickets: {
            open: "Abertas",
            resolved: "Resolvidos",
            search: "Busca",
            newTicket: "Novo",
            all: "Todos",
            queues: "Filas",
            serving: "Atendendo",
            waiting: "Aguardando",
            queueName: "Comercial",
            today: "HOJE",
            typeMessage: "Digite uma mensagem...",
            customerMessage:
              "Olá! Gostaria de conhecer os planos para a minha equipe.",
            agentMessage:
              "Olá, Luiza! Posso te ajudar. Quantas pessoas atendem pelo WhatsApp hoje?",
            contacts: [
              {
                initials: "LM",
                name: "Luiza Martins",
                message: "Gostaria de conhecer os planos...",
                time: "10:32"
              },
              {
                initials: "RC",
                name: "Rafael Costa",
                message: "Podemos agendar para amanhã?",
                time: "10:18"
              },
              {
                initials: "BA",
                name: "Bianca Alves",
                message: "Obrigada pelo atendimento!",
                time: "09:54"
              },
              {
                initials: "JP",
                name: "João Pereira",
                message: "O financeiro já recebeu?",
                time: "09:31"
              }
            ]
          },
          contacts: {
            title: "Contatos",
            search: "Pesquisar",
            import: "Importar contatos",
            add: "Adicionar contato",
            headers: ["Nome", "WhatsApp", "Email", "Ações"],
            rows: [
              {
                initials: "LM",
                name: "Luiza Martins",
                whatsapp: "+55 11 90000-1001",
                email: "luiza@empresa.demo"
              },
              {
                initials: "RC",
                name: "Rafael Costa",
                whatsapp: "+55 21 90000-1002",
                email: "rafael@empresa.demo"
              },
              {
                initials: "BA",
                name: "Bianca Alves",
                whatsapp: "+55 31 90000-1003",
                email: "bianca@empresa.demo"
              },
              {
                initials: "JP",
                name: "João Pereira",
                whatsapp: "+55 41 90000-1004",
                email: "joao@empresa.demo"
              }
            ]
          },
          connections: {
            title: "Conexões",
            add: "Adicionar WhatsApp",
            headers: [
              "Nome",
              "Status",
              "Sessão",
              "Última atualização",
              "Padrão",
              "Ações"
            ],
            rows: [
              [
                "Comercial",
                "Conectado",
                "Pronta",
                "14/07/2026 10:42",
                "Sim",
                ""
              ],
              ["Suporte", "Conectado", "Pronta", "14/07/2026 10:38", "Não", ""]
            ],
            queueTitle: "Fila Comercial",
            queueDescription: "4 atendentes vinculados",
            queueGreeting: "Olá! Como podemos ajudar?"
          },
          campaigns: {
            title: "Campanhas",
            search: "Pesquisar campanha",
            add: "Nova campanha",
            summary: [
              { label: "Programadas", value: "03" },
              { label: "Em andamento", value: "01" },
              { label: "Concluídas", value: "18" }
            ],
            headers: [
              "Nome",
              "Lista",
              "Data inicial",
              "Status",
              "Enviadas",
              "Ações"
            ],
            rows: [
              [
                "Novidades de julho",
                "Clientes ativos",
                "15/07/2026 09:00",
                "Programada",
                "0 / 428",
                ""
              ],
              [
                "Pesquisa de satisfação",
                "Pós-atendimento",
                "12/07/2026 14:00",
                "Concluída",
                "312 / 312",
                ""
              ]
            ]
          },
          dashboard: {
            primary: [
              { label: "Usuários online", value: "8/12" },
              { label: "Atendimentos aguardando", value: "10" },
              { label: "Atendimentos abertos", value: "24" }
            ],
            filters: [
              { label: "Período", value: "Personalizado" },
              { label: "Data inicial", value: "01/07/2026, 00:00" },
              { label: "Data final", value: "14/07/2026, 11:59" }
            ],
            secondary: [
              { label: "Atendimentos resolvidos", value: "186" },
              { label: "Novos contatos", value: "42" },
              { label: "Tempo médio de atendimento", value: "0h 8m" },
              { label: "Tempo médio de espera", value: "0h 4m" }
            ],
            chartTitle: "Atendimentos no período"
          },
          whiteLabel: {
            title: "Configurações",
            activeTab: "WHITELABEL",
            tabs: [
              "OPÇÕES",
              "EMPRESAS",
              "PLANOS",
              "AJUDA",
              "WHITELABEL",
              "TRADUÇÕES"
            ],
            fields: [
              { label: "Cor primária clara", value: "#7457FF" },
              { label: "Cor primária escura", value: "#039AAD" },
              { label: "Nome do app", value: "Espaço Whats" },
              { label: "Logo do app claro", value: "logo-claro.svg" },
              { label: "Logo do app escuro", value: "logo-escuro.svg" },
              { label: "Favicon do app", value: "favicon.png" }
            ],
            logoCaption: "ATENDIMENTO PROFISSIONAL",
            loginLinks: "Links do login",
            loginDescription:
              "Adicione pares de título e URL para exibir abaixo da caixa de login.",
            linkTitle: "Título do link",
            linkUrl: "URL do link",
            save: "Salvar"
          }
        },
        steps: {
          eyebrow: "Como funciona",
          title: "Comece de forma simples. Cresça sem perder o controle.",
          items: [
            {
              title: "Conecte seus números",
              description:
                "Adicione e gerencie as conexões de WhatsApp utilizadas pela sua empresa."
            },
            {
              title: "Organize a operação",
              description:
                "Crie usuários, setores, filas, permissões e regras de atendimento."
            },
            {
              title: "Atenda e acompanhe",
              description:
                "Sua equipe trabalha enquanto os gestores acompanham toda a operação."
            }
          ]
        },
        features: {
          eyebrow: "Recursos principais",
          title: "Tudo o que sua equipe precisa para atender melhor.",
          description:
            "Uma plataforma completa, construída para transformar conversas em processos claros e relacionamentos duradouros.",
          items: [
            {
              title: "Atendimento centralizado",
              description: "Todas as conversas em uma única central organizada."
            },
            {
              title: "Vários atendentes",
              description: "Colaboração simultânea sem perder o controle."
            },
            {
              title: "Múltiplos números",
              description: "Gerencie diferentes conexões na mesma operação."
            },
            {
              title: "Contatos e CRM",
              description: "Informações e histórico sempre disponíveis."
            },
            {
              title: "Tags e campos",
              description: "Classifique contatos conforme o seu processo."
            },
            {
              title: "Respostas rápidas",
              description: "Agilidade sem abrir mão da personalização."
            },
            {
              title: "Agendamentos",
              description: "Programe mensagens e acompanhamentos."
            },
            {
              title: "Filas e chatbot",
              description: "Direcione cada contato para o lugar certo."
            },
            {
              title: "Chat interno",
              description: "Aproxime a comunicação entre colaboradores."
            },
            {
              title: "Campanhas",
              description: "Planeje, envie e acompanhe ações em escala."
            },
            {
              title: "IA e transcrição",
              description: "Automatize tarefas e transforme áudios em texto."
            },
            {
              title: "Relatórios e dashboard",
              description: "Enxergue a operação e identifique oportunidades."
            }
          ]
        },
        routing: {
          eyebrow: "Organização da equipe",
          title: "Cada mensagem chega a quem pode resolver.",
          description:
            "Encaminhe o cliente para recepção, comercial, financeiro, suporte ou qualquer outro setor. Transfira, conclua ou reabra sem perder o histórico.",
          items: [
            "Permissões por perfil",
            "Filas por usuário",
            "Transferência entre profissionais",
            "Observações internas",
            "Histórico completo",
            "Chat entre colaboradores"
          ],
          newMessage: "Nova mensagem",
          customer: "Cliente no WhatsApp",
          flow: ["Recepção", "Setor responsável", "Concluído"]
        },
        automation: {
          eyebrow: "Escala com proximidade",
          title: "Automatize o repetitivo. Preserve o atendimento humano.",
          description:
            "Use automações onde elas geram agilidade e mantenha sua equipe presente nos momentos que exigem conversa.",
          automationTitle: "Automação",
          automationDescription:
            "Configure saudações, horários, chatbot, mensagens fora do expediente, transferências, timeouts e avaliações.",
          campaignTitle: "Campanhas",
          campaignDescription:
            "Crie listas, importe contatos, programe envios, alterne mensagens e acompanhe resultados.",
          greeting: "Saudação",
          menu: "Menu inteligente",
          team: "Equipe",
          sent: "enviadas",
          delivered: "entregues",
          replies: "respostas"
        },
        metrics: {
          eyebrow: "Gestão e indicadores",
          title: "Decisões melhores começam com uma operação visível.",
          description:
            "O dashboard reúne os principais indicadores para você entender o que está acontecendo e onde sua equipe pode melhorar.",
          items: [
            { label: "Usuários online", value: "18", delta: "+3 hoje" },
            { label: "Aguardando", value: "07", delta: "-12%" },
            { label: "Em atendimento", value: "42", delta: "+8%" },
            { label: "Concluídos", value: "186", delta: "+21%" },
            { label: "Novos contatos", value: "64", delta: "+15%" },
            { label: "Tempo médio", value: "04:12", delta: "-18%" }
          ]
        },
        whiteLabel: {
          eyebrow: "White-label",
          title:
            "A tecnologia do Espaço Whats com a identidade da sua empresa.",
          description:
            "Personalize a experiência para que clientes e colaboradores reconheçam sua marca em cada detalhe.",
          items: [
            "Nome e logos",
            "Cores e favicon",
            "Tela de login",
            "Links e conteúdos"
          ]
        },
        integrations: {
          eyebrow: "Tecnologia e evolução",
          title: "Uma plataforma pronta para acompanhar sua operação.",
          description:
            "Recursos que ampliam as possibilidades sem complicar a rotina da equipe.",
          items: [
            {
              title: "Inteligência artificial",
              description: "Use OpenAI ou Groq em fluxos inteligentes."
            },
            {
              title: "Vários idiomas",
              description: "Atenda equipes e operações internacionais."
            },
            {
              title: "Atualizações em tempo real",
              description: "Acompanhe cada mudança assim que ela acontece."
            },
            {
              title: "Múltiplas empresas",
              description: "Escale usuários, conexões e operações."
            }
          ]
        },
        contact: {
          eyebrow: "Vamos conversar",
          title:
            "Seus clientes já usam o WhatsApp. Agora sua equipe pode usá-lo de forma profissional.",
          description:
            "Chame nossa equipe pelo WhatsApp e descubra como o Espaço Whats pode organizar seu atendimento.",
          responseTitle: "Conversa rápida e sem compromisso",
          responseDescription:
            "Vamos entender seu cenário diretamente no chat.",
          whatsappMessage:
            "Olá! Quero conhecer o Espaço Whats e agendar uma demonstração."
        },
        faq: {
          eyebrow: "Perguntas frequentes",
          title: "Ficou alguma dúvida?",
          items: [
            {
              question: "Posso utilizar mais de um número de WhatsApp?",
              answer:
                "Sim. O Espaço Whats permite administrar diferentes conexões dentro da mesma operação."
            },
            {
              question: "Vários atendentes podem trabalhar simultaneamente?",
              answer:
                "Sim. Cada colaborador possui seu próprio acesso e pode receber permissões e filas específicas."
            },
            {
              question: "Posso separar o atendimento por setores?",
              answer:
                "Sim. Você pode criar filas para recepção, comercial, financeiro, suporte ou qualquer outro departamento."
            },
            {
              question:
                "A plataforma pode utilizar a identidade da minha empresa?",
              answer:
                "Sim. Nome, cores, logos, tela de login e outros elementos podem ser personalizados."
            },
            {
              question:
                "O Espaço Whats possui recursos de inteligência artificial?",
              answer:
                "Sim. A plataforma oferece recursos de IA e transcrição para apoiar a rotina da equipe."
            },
            {
              question: "Como posso conhecer o sistema?",
              answer:
                "Solicite uma demonstração para entendermos sua operação e apresentarmos os recursos mais importantes para sua equipe."
            }
          ]
        },
        mock: {
          workspace: "Central de atendimento",
          inbox: "Atendimentos",
          waiting: "Aguardando",
          open: "Em atendimento",
          done: "Concluídos",
          salesQueue: "Comercial • Ana Souza",
          online: "online",
          today: "HOJE",
          customerMessage:
            "Olá! Gostaria de entender qual plano funciona melhor para minha equipe.",
          agentMessage:
            "Claro, Marina! Vou te ajudar. Quantas pessoas atendem hoje pelo WhatsApp?",
          typeMessage: "Digite uma mensagem...",
          customer: "Informações do cliente",
          company: "Ateliê Aurora",
          hotLead: "Lead quente",
          returning: "Retorno",
          history: "12 atendimentos anteriores",
          followUp: "Retorno agendado para amanhã",
          overview: "Visão geral",
          dashboard: "Dashboard de atendimento",
          lastDays: "Últimos 7 dias",
          serviceVolume: "Volume de atendimentos",
          week: "Esta semana",
          team: "Equipe online",
          weekdays: ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB"],
          contacts: [
            {
              initials: "MC",
              name: "Marina Costa",
              message: "Gostaria de conhecer os planos...",
              time: "10:32",
              unread: 2
            },
            {
              initials: "RL",
              name: "Rafael Lima",
              message: "Obrigado pelo atendimento!",
              time: "10:18"
            },
            {
              initials: "BC",
              name: "Bianca Castro",
              message: "Podemos agendar para amanhã?",
              time: "09:54",
              unread: 1
            },
            {
              initials: "JS",
              name: "João Silva",
              message: "O financeiro já recebeu?",
              time: "09:31"
            }
          ],
          teamMembers: [
            { initials: "AS", name: "Ana Souza", role: "Comercial" },
            { initials: "PM", name: "Paulo Melo", role: "Suporte" },
            { initials: "CL", name: "Carla Luz", role: "Financeiro" },
            { initials: "RM", name: "Rita Moraes", role: "Recepção" }
          ]
        },
        footer: {
          description:
            "Atendimento, CRM e automação para transformar o WhatsApp em uma operação profissional.",
          rights: "Todos os direitos reservados.",
          privacy: "Política de Privacidade",
          terms: "Termos de Serviço"
        },
        pieces: {
          eyebrow: "Um espaço, todas as peças",
          title: "Tudo o que o seu atendimento precisa, já encaixado.",
          description:
            "Filas, IA, etiquetas, campanhas e relatórios funcionando juntos no mesmo número. Toque numa peça para ver o que ela faz.",
          hint: "Toque numa peça do teclado para ver o que ela faz.",
          items: {
            inbox: {
              title: "Caixa de entrada",
              description:
                "Todas as conversas do número num lugar só, com cada atendente vendo o que é seu."
            },
            queues: {
              title: "Filas",
              description:
                "Vendas, Suporte, Financeiro: cada cliente cai no setor certo logo na primeira mensagem."
            },
            ai: {
              title: "IA",
              description:
                "Sugere respostas, revisa o texto antes de enviar e resume conversas longas em segundos."
            },
            tags: {
              title: "Etiquetas",
              description:
                "Marque clientes e conversas para encontrar tudo depois e acompanhar cada etapa."
            },
            campaigns: {
              title: "Campanhas",
              description:
                "Avisos e promoções para listas de contatos, com envio agendado."
            },
            chatbot: {
              title: "Chatbot",
              description:
                "Menus automáticos que respondem o básico e encaminham para uma pessoa quando precisa."
            },
            reports: {
              title: "Relatórios",
              description:
                "Tempo de resposta, volume por fila e desempenho de cada atendente."
            },
            schedule: {
              title: "Agendamentos",
              description:
                "Programe mensagens para a hora certa: lembretes, retornos e cobranças."
            },
            contacts: {
              title: "Contatos",
              description:
                "Histórico completo de cada cliente, com todas as conversas anteriores."
            },
            transfer: {
              title: "Transferir",
              description:
                "Passe a conversa para outro atendente ou setor sem o cliente repetir a história."
            },
            quick: {
              title: "Respostas rápidas",
              description:
                "Atalhos para as respostas de sempre, iguais para a equipe inteira."
            },
            qrcode: {
              title: "QR code",
              description:
                "Conecte o número lendo um QR code no celular, como no WhatsApp Web."
            },
            official: {
              title: "API oficial",
              description:
                "Conexão direta com a Meta: mais segura e com perfil comercial verificado."
            },
            team: {
              title: "Equipe",
              description:
                "Convide atendentes, defina permissões e acompanhe quem está online."
            },
            kanban: {
              title: "Kanban",
              description:
                "Veja os atendimentos em colunas e arraste cada cliente para a próxima etapa."
            },
            hours: {
              title: "Horários",
              description:
                "Mensagem automática fora do expediente, para ninguém ficar sem resposta."
            }
          }
        },
        ask: {
          eyebrow: "Peça para a IA",
          title: "Você pede.",
          highlight: "O atendimento anda.",
          description:
            "Nos planos com IA, você descreve o que precisa em uma frase e o Espaço Whats organiza as conversas por você.",
          cardLabel: "Agente Espaço",
          cardTitle: "O que você precisa agora?",
          prompts: [
            {
              chip: "Organizar o dia",
              text: "Distribua as conversas de hoje entre Vendas e Suporte e me avise quem está esperando há mais tempo.",
              results: [
                "12 conversas distribuídas entre Vendas e Suporte",
                "3 clientes esperando há mais de 10 minutos",
                "Ana e Bruno avisados sobre as prioridades"
              ]
            },
            {
              chip: "Responder dúvidas",
              text: "Sugira uma resposta para quem perguntou sobre prazo de entrega nesta manhã.",
              results: [
                "5 conversas sobre prazo de entrega encontradas",
                "Resposta sugerida com o prazo da sua política",
                "Sugestões prontas para a equipe revisar e enviar"
              ]
            },
            {
              chip: "Resumir conversas",
              text: "Resuma as conversas do Financeiro de ontem e marque as que precisam de retorno.",
              results: [
                "8 conversas resumidas em tópicos",
                "Etiqueta retorno aplicada em 3 clientes",
                "Resumo enviado para o gestor da fila"
              ]
            }
          ]
        },
        modes: {
          eyebrow: "Oficial ou QR code",
          title: "Escolha como conectar seu WhatsApp",
          description:
            "Os dois jeitos entregam os mesmos recursos do Espaço Whats. A diferença está em como o seu número fala com o WhatsApp.",
          same: {
            tag: "Mesmos recursos",
            title: "Qualquer que seja a escolha, o Espaço Whats é o mesmo",
            description:
              "Filas, IA, etiquetas, campanhas e relatórios funcionam igual nas duas conexões. Você escolhe o jeito de conectar na assinatura.",
            points: [
              "Mesmo painel e mesmos recursos",
              "Mesmo preço de plano nas duas conexões",
              "Dá para trocar de conexão depois, falando com o nosso time"
            ],
            note: ""
          },
          official: {
            tag: "API oficial",
            title: "API oficial da Meta",
            description:
              "Conexão direta e autorizada pela Meta, dona do WhatsApp. É o caminho mais seguro e o que passa mais confiança para o seu cliente.",
            points: [
              "Conexão autorizada pela Meta, com menor risco de bloqueio",
              "Perfil comercial verificado e mensagens com aparência profissional",
              "Estável para grandes volumes de conversa"
            ],
            note: "As mensagens são cobradas pela Meta, direto na sua conta. Esse custo não tem vínculo com o Espaço Whats."
          },
          unofficial: {
            tag: "QR code",
            title: "Conexão por QR code",
            description:
              "Você lê um QR code com o celular, como no WhatsApp Web, e começa na hora. Não há ligação direta com a Meta.",
            points: [
              "Começa em minutos, com o número que você já usa",
              "Sem custo por mensagem enviada",
              "Nossa equipe monitora as conexões para manter seu número protegido"
            ],
            note: "Por não ser uma conexão oficial, existe mais risco de instabilidade ou bloqueio. Trabalhamos todos os dias para que isso não aconteça com você."
          }
        },
        plans: {
          eyebrow: "Planos",
          title: "Planos para cada fase da sua empresa",
          description:
            "Todos os planos funcionam com a API oficial ou com QR code. Você escolhe a conexão no próximo passo.",
          recommended: "Recomendado",
          phases: {
            basic: "Para começar",
            ai: "Para crescer",
            enterprise: "Para escalar",
            custom: "Sob medida"
          },
          enterprise: {
            badge: "Mais completo",
            exclusiveTitle: "Só no Enterprise",
            lockedTitle: "Disponível no Enterprise",
            notIncluded: "Não incluso neste plano:",
            exclusive: [
              {
                id: "custom",
                title: "Desenvolvimento sob medida",
                text: "Integrações e mini sistemas feitos para você."
              },
              {
                id: "priority",
                title: "Suporte prioritário",
                text: "Seus chamados passam na frente."
              },
              {
                id: "onboarding",
                title: "Implantação assistida",
                text: "Configuramos tudo com a sua equipe."
              }
            ],
            perUser: "{{price}} por usuário/mês",
            upgradeTitle:
              "Por + {{price}}/mês em relação ao {{name}}, você também leva:",
            plusCapacity: "+{{count}}",
            trialNote:
              "O teste é grátis em qualquer plano. Comece pelo mais completo.",
            talk: "Falar com um especialista",
            whatsappMessage:
              "Olá! Quero conhecer o plano Enterprise do Espaço Whats."
          },
          nudge: {
            cheaper:
              "No Enterprise, cada usuário sai por {{price}}/mês, menos que neste plano.",
            same: "No Enterprise, cada usuário custa o mesmo, com desenvolvimento sob medida incluso."
          },
          compare: {
            title: "Compare os planos",
            plan: "Plano",
            groups: {
              capacity: "Capacidade",
              ai: "Inteligência artificial",
              shared: "Em todos os planos",
              service: "Só no Enterprise"
            },
            rows: {
              users: "Usuários",
              connections: "Conexões de WhatsApp",
              queues: "Filas de atendimento",
              ai: "IA para a equipe",
              modes: "API oficial ou QR code",
              attendance: "Atendimento com filas e vários atendentes",
              flows: "Editor visual de fluxos",
              campaigns: "Campanhas e agendamentos",
              tasks: "Quadro de tarefas da equipe",
              internalChat: "Chat interno",
              custom: "Desenvolvimento sob medida",
              priority: "Suporte prioritário",
              onboarding: "Implantação assistida"
            },
            aiUnlimited: "Ilimitada",
            aiFrom: "Pacotes a partir de {{price}}",
            included: "Incluso",
            notIncluded: "Não incluso"
          },
          perMonth: "/mês",
          aiUnlimited: "IA ilimitada inclusa",
          aiSeparate: "IA contratada à parte",
          users: "{{count}} usuários",
          connections: "{{count}} conexões",
          queues: "{{count}} filas",
          bothModes: "API oficial ou QR code",
          choose: "Testar {{name}} grátis",
          trialPromise:
            "7 dias grátis. Sem cartão de crédito. É só criar a conta e usar.",
          customPitch: "Plano sob medida para a sua operação.",
          unavailable:
            "Não conseguimos carregar os planos agora. Atualize a página ou fale com a gente.",
          tiers: {
            basic: {
              name: "Básico",
              pitch:
                "Para organizar o atendimento. A IA você adiciona quando quiser."
            },
            ai: {
              name: "IA",
              pitch: "Tudo do Básico, com IA ilimitada para a equipe inteira."
            },
            enterprise: {
              name: "Enterprise",
              pitch:
                "Para operações grandes, com mais usuários, filas e IA ilimitada."
            }
          }
        },
        addons: {
          title: "Pacotes de IA para o plano Básico",
          description:
            "No Básico, a IA é contratada à parte. Escolha um pacote na assinatura ou depois, direto no painel.",
          package: "Pacote",
          monthly: "Mensal",
          includes: "Recursos",
          items: {
            atendimento: {
              name: "Atendimento",
              includes: "Respostas, revisão de mensagens e resumos de conversas"
            },
            equipe: {
              name: "Equipe",
              includes:
                "Acrescenta análise de filas, prioridades, habilidades e documentos"
            },
            gestao: {
              name: "Gestão",
              includes:
                "Acrescenta especialistas, projetos, tarefas recorrentes e conexões"
            }
          }
        },
        checkout: {
          metaTitle: "Assinar o Espaço Whats",
          backToSite: "Voltar ao site",
          steps: ["Plano", "Conexão", "Sua conta", "Sua marca"],
          stepOf: "Passo {{current}} de {{total}}",
          continue: "Continuar",
          back: "Voltar",
          loadingPlans: "Carregando planos…",
          plan: {
            title: "Qual plano combina com você?",
            description:
              "Todos funcionam com API oficial ou QR code. Dá para mudar de plano depois.",
            aiTitle: "Quer adicionar IA agora?",
            aiDescription:
              "No Básico, a IA é um pacote à parte. Pode deixar para depois.",
            aiNone: "Agora não",
            upsell: {
              title: "Por + {{price}}/mês, leve o Enterprise",
              capacity: {
                users: "+{{count}} usuários",
                connections: "+{{count}} conexões de WhatsApp",
                queues: "+{{count}} filas de atendimento"
              },
              aiIncluded: "IA ilimitada inclusa",
              action: "Trocar para Enterprise",
              note: "O teste continua grátis por 7 dias, sem cartão."
            }
          },
          mode: {
            title: "Como você quer conectar seu WhatsApp?",
            description:
              "Os recursos são os mesmos nos dois. Escolha o que faz mais sentido para o seu negócio.",
            officialBadge: "Mais seguro",
            unofficialBadge: "Começa na hora"
          },
          data: {
            title: "Crie seu espaço",
            description:
              "Com esses dados criamos sua conta de administrador. Você convida a equipe depois.",
            company: "Nome da empresa",
            email: "E-mail",
            phone: "WhatsApp para contato",
            password: "Senha",
            passwordHint: "Mínimo de 6 caracteres",
            showPassword: "Mostrar senha",
            hidePassword: "Ocultar senha",
            termsPrefix: "Li e aceito os",
            termsLink: "Termos de Serviço",
            termsJoin: "e a",
            privacyLink: "Política de Privacidade",
            submit: "Começar meu teste grátis",
            submitting: "Criando seu espaço…"
          },
          errors: {
            company: "Informe o nome da empresa, com pelo menos 2 letras.",
            email: "Informe um e-mail válido, como voce@empresa.com.br.",
            phone: "Informe um WhatsApp com DDD.",
            password: "A senha precisa ter pelo menos 6 caracteres.",
            terms: "Aceite os termos para continuar.",
            plan: "Escolha um plano para continuar.",
            mode: "Escolha como conectar para continuar.",
            generic:
              "Não foi possível criar seu espaço. Confira os dados e tente de novo.",
            captcha:
              "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo.",
            ERR_COMPANY_NAME_ALREADY_EXISTS:
              "Já existe um espaço com esse nome de empresa. Use outro nome.",
            ERR_SIGNUP_INVALID_DATA:
              "Confira os dados, o endereço e o dia de vencimento.",
            ERR_SIGNUP_INVALID_PLAN:
              "Esse plano não está disponível. Volte e escolha outro.",
            ERR_SIGNUP_INVALID_IMAGE:
              "Uma das imagens é inválida. Use PNG, JPG ou WebP com até 5 MB.",
            ERR_SIGNUP_RATE_LIMIT:
              "Muitas tentativas de cadastro. Tente novamente mais tarde.",
            ERR_COMPANY_INVALID_SLUG:
              "Use um endereço com letras, números e hífens.",
            ERR_COMPANY_SLUG_RESERVED:
              "Esse endereço está reservado. Escolha outro.",
            ERR_COMPANY_SLUG_ALREADY_EXISTS:
              "Já existe um espaço com esse endereço. Escolha outro endereço."
          },
          summary: {
            title: "Sua assinatura",
            plan: "Plano",
            mode: "Conexão",
            ai: "IA",
            aiIncluded: "Ilimitada, inclusa",
            aiNone: "Não contratada",
            total: "Mensalidade após o teste",
            trial:
              "Hoje: R$ 0,00. São 7 dias grátis, sem cartão. Você só paga se decidir continuar.",
            metaCost:
              "Na API oficial, as mensagens são cobradas pela Meta, à parte.",
            change: "Alterar",
            pending: "Escolha no próximo passo"
          },
          modeNames: {
            official: "API oficial",
            unofficial: "QR code"
          },
          success: {
            title: "Seu espaço está pronto!",
            description:
              "Entre com {{email}} e a senha que você criou para conectar seu WhatsApp.",
            official:
              "Como você escolheu a API oficial, nossa equipe vai ajudar a conectar seu número à Meta.",
            unofficial:
              "No painel, abra Conexões e leia o QR code com o celular para começar.",
            login: "Entrar no painel"
          },
          disabled: {
            title: "Cadastro pelo site fechado no momento",
            description:
              "Não estamos abrindo novos espaços pelo site agora. Fale com a gente para assinar.",
            talk: "Falar com a gente"
          }
        }
      },
      date: {
        yesterday: "Ontem"
      },
      common: {
        search: "Buscar",
        filter: "Filtrar",
        edit: "Editar",
        delete: "Excluir",
        cancel: "Cancelar",
        save: "Salvar",
        you: "Você",
        confirm: "Confirmar",
        confirmation: "Confirmação",
        areyousure: "Você tem certeza?",
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
        user: "Usuário",
        users: "Usuários",
        connection: "Conexão",
        connections: "Conexões",
        queue: "Fila",
        queues: "Filas",
        contact: "Contato",
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
        rating: "Avaliação",
        transferTo: "Transferir para",
        key: "Chave",
        value: "Valor",
        validations: {
          required: "Este campo é obrigatório",
          short: "Valor muito curto",
          long: "Valor muito longo",
          invalid: "Valor inválido",
          invalidEmail: "Email inválido",
          invalidPhone: "Número de telefone inválido"
        },
        serverTime: "Hora do servidor:",
        clientTime: "Hora do cliente:",
        differenceMinutes: "Diferença: {{count}} minuto(s)"
      },
      signup: {
        title: "Cadastre-se",
        toasts: {
          success: "Usuário criado com sucesso! Faça seu login!!!.",
          fail: "Erro ao criar usuário. Verifique os dados informados."
        },
        form: {
          name: "Nome",
          nickname: "Apelido",
          birthdayDay: "Dia",
          birthdayMonth: "Mês",
          email: "Email",
          password: "Senha"
        },
        buttons: {
          submit: "Cadastrar",
          login: "Já tem uma conta? Entre!"
        }
      },
      login: {
        title: "Login",
        form: {
          email: "Email",
          password: "Senha",
          newPassword: "Nova senha",
          confirmPassword: "Confirmar senha",
          passwordStrength:
            "Use pelo menos 8 caracteres, com maiúscula, minúscula e número."
        },
        buttons: {
          submit: "Entrar",
          continue: "Continuar",
          createPassword: "Criar senha e entrar",
          changeEmail: "Trocar e-mail",
          backToLogin: "Voltar ao login",
          register: "Não tem uma conta? Cadastre-se!"
        },
        errors: {
          emailNotFound: "Não encontramos esse e-mail.",
          passwordMismatch: "As senhas não coincidem.",
          passwordStrength:
            "A senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula e número.",
          activationInvalid: "Este link de ativação é inválido ou expirou."
        },
        activation: {
          title: "Crie sua senha",
          account: "Ativando a conta {{email}}"
        }
      },
      companies: {
        title: "Cadastrar Empresa",
        form: {
          name: "Nome da Empresa",
          plan: "Plano",
          token: "Token",
          submit: "Cadastrar",
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
        contactReport: {
          button: "Exportar contatos",
          title: "Exportar fluxo de contatos",
          columns: "Colunas do relatório",
          contactedAt: "Data do contato",
          name: "Nome",
          number: "Número",
          notes: "Notas internas",
          historyNotice:
            "Alterações feitas antes da ativação deste histórico não podem ser reconstruídas."
        },
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
          end: "Data final"
        },
        ticketCountersLabels: {
          created: "Criado",
          closed: "Fechado"
        },
        blog: {
          title: "Blog do Espaço Whats",
          loading: "Carregando posts...",
          error: "Nao foi possivel carregar os posts do blog agora.",
          empty: "Nenhum post encontrado.",
          showAll: "Exibir todos os posts",
          showLess: "Exibir menos",
          openPost: "Ler post",
          previous: "Post anterior",
          next: "Proximo post"
        }
      },
      connections: {
        title: "Conexões",
        toasts: {
          deleted: "Conexão com o WhatsApp excluída com sucesso!"
        },
        confirmationModal: {
          deleteTitle: "Deletar",
          deleteMessage: "Você tem certeza? Essa ação não pode ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "Tem certeza? Você precisará ler o QR Code novamente.",
          closeTickets: "Fechar todos os atendimentos desta conexão"
        },
        buttons: {
          add: "Adicionar WhatsApp",
          disconnect: "desconectar",
          tryAgain: "Tentar novamente",
          qrcode: "QR CODE",
          newQr: "Novo QR CODE",
          connecting: "Conectando"
        },
        toolTips: {
          disconnected: {
            title: "Falha ao iniciar sessão do WhatsApp",
            content:
              "Certifique-se de que seu celular esteja conectado à internet e tente novamente, ou solicite um novo QR Code"
          },
          qrcode: {
            title: "Esperando leitura do QR Code",
            content:
              "Clique no botão 'QR CODE' e leia o QR Code com o seu celular para iniciar a sessão"
          },
          connected: {
            title: "Conexão estabelecida!"
          },
          timeout: {
            title: "A conexão com o celular foi perdida",
            content:
              "Certifique-se de que seu celular esteja conectado à internet e o WhatsApp esteja aberto, ou clique no botão 'Desconectar' para obter um novo QR Code"
          },
          passkey: {
            title: "Autenticação por passkey necessária",
            content:
              "Clique no botão de passkey e use a extensão do navegador para capturar a sessão autenticada do WhatsApp Web."
          },
          refresh: "Refazer conexão",
          disconnect: "Desconectar",
          scan: "Ler QR Code",
          newQr: "Gerar novo QR Code",
          retry: "Tentar novamente",
          resetPasskey: "Reiniciar sessão passkey"
        },
        table: {
          contact: "Contato",
          name: "Nome",
          status: "Status",
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
        save: "Salvar",
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
          "Use a extensão do navegador para capturar a sessão autenticada do WhatsApp Web e enviá-la ao servidor.",
        connectorNotFound:
          "Extensão não detectada. Instale a extensão de captura passkey e recarregue a página.",
        connectorReady:
          "Extensão detectada. Clique abaixo para autenticar pelo WhatsApp Web.",
        startCapture: "Iniciar Captura",
        waitingForCapture: "Aguardando a captura da sessão do WhatsApp Web…",
        existingSession: "O WhatsApp Web já possui uma sessão para {{number}}.",
        captureExisting: "Capturar esta sessão",
        clearAndContinue: "Limpar sessão local e continuar",
        importSent: "Sessão capturada e enviada com sucesso.",
        importError: "Falha na captura: {{reason}}.",
        missingToken: "Token de captura ausente. Recarregue a página.",
        downloadExtension: "Baixar extensão de captura",
        installInstructions: "Como instalar",
        hideInstructions: "Ocultar instruções",
        instructionsIntro: "Siga os passos abaixo para instalar a extensão:",
        installStep1: "Baixe o arquivo ZIP da extensão.",
        installStep2: "Extraia o arquivo ZIP para uma pasta no seu computador.",
        installStep3: "Abra o Google Chrome e acesse chrome://extensions/.",
        installStep4:
          "Ative o Modo de desenvolvedor usando a chave no canto superior direito.",
        installStep5: 'Clique em "Carregar sem compactação".',
        installStep6: "Selecione a pasta da extensão extraída.",
        installStep7: "A extensão está instalada e pronta para uso.",
        installStep8:
          "Recarregue esta página com F5 e tente conectar novamente."
      },
      contacts: {
        title: "Contatos",
        toasts: {
          deleted: "Contato excluído com sucesso!"
        },
        searchPlaceholder: "Pesquisar...",
        confirmationModal: {
          deleteTitle: "Deletar ",
          importTitlte: "Importar contatos",
          deleteMessage:
            "Tem certeza que deseja deletar este contato? Todos os atendimentos relacionados serão perdidos.",
          importMessage: "Deseja importar todos os contatos do telefone?"
        },
        buttons: {
          import: "Importar Contatos",
          add: "Adicionar Contato"
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
          add: "Adicionar contato",
          edit: "Editar contato"
        },
        form: {
          mainInfo: "Dados do contato",
          extraInfo: "Informações adicionais",
          name: "Nome",
          number: "Número do Whatsapp",
          email: "Email",
          extraName: "Nome do campo",
          extraValue: "Valor",
          disableBot: "Desabilitar chatbot"
        },
        buttons: {
          addExtraInfo: "Adicionar informação",
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Contato salvo com sucesso."
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
          outOfHoursMessage: "Mensagem de fora de expediente",
          ratingMessage: "Mensagem de avaliação",
          transferMessage: "Mensagem de Transferência",
          connections: "Conexões de WhatsApp",
          connectionsHelp:
            "A fila e o chatbot serão oferecidos somente nestas conexões.",
          token: "Token"
        },
        validation: {
          connectionRequired: "Selecione pelo menos uma conexão para a fila."
        },
        tabs: {
          label: "Seções da fila",
          data: "Dados da Fila",
          chatbot: "Chatbot",
          chatbotHint: "Salve a fila antes de montar o chatbot",
          schedules: "Horários de Atendimento"
        },
        toasts: {
          saved: "Fila salva com sucesso",
          deleted: "Anexo removido com sucesso"
        },
        confirmationModal: {
          deleteTitle: "Remover anexo",
          deleteMessage:
            "Tem certeza que deseja remover o anexo desta fila? Essa ação não pode ser desfeita."
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          attach: "Anexar Arquivo"
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
          add: "Adicionar usuário",
          edit: "Editar usuário"
        },
        listItems: {
          adminProfile: "Administrador",
          userProfile: "Usuário"
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Senha",
          profile: "Perfil",
          visibleScreens: "Telas visíveis",
          screenAccessHint:
            "Usuários comuns podem visualizar as telas selecionadas. Ações administrativas continuam reservadas aos administradores."
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar"
        },
        success: "Usuário salvo com sucesso."
      },
      scheduleModal: {
        title: {
          add: "Novo Agendamento",
          edit: "Editar Agendamento"
        },
        subtitle: "Defina o público, a ocasião e personalize cada entrega.",
        sections: {
          audience: "Público",
          when: "Quando",
          message: "Mensagem e variáveis",
          media: "Mídia",
          review: "Conferência"
        },
        form: {
          body: "Mensagem",
          contact: "Contato",
          contacts: "Contatos",
          allContacts: "Todos os contatos elegíveis",
          kind: "Tipo de agendamento",
          sendAt: "Data de Agendamento",
          sendTime: "Horário anual",
          timezone: "Fuso horário",
          commemorativeDate: "Data comemorativa",
          sentAt: "Data de Envio",
          saveMessage: "Salvar mensagem no ticket",
          mediaMode: "Forma de envio da mídia",
          noMedia: "Nenhuma mídia selecionada"
        },
        kinds: {
          once: "Data única",
          birthday: "Aniversário",
          commemorative: "Data comemorativa"
        },
        mediaModes: {
          caption: "Mensagem como legenda",
          separate: "Mensagem e mídia separadas"
        },
        review: {
          recipients: "destinatários",
          missingData: "Há dados ausentes",
          hint: "Confira a mensagem com um contato real antes de salvar."
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          save: "Salvar agendamento",
          preview: "Gerar prévia",
          attach: "Adicionar mídia",
          removeMedia: "Remover"
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
        success: "Tag salvo com sucesso.",
        successKanban: "Lane salva com sucesso."
      },
      chat: {
        noTicketMessage: "Selecione um ticket para começar a conversar."
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTE E SOLTE ARQUIVOS NO CAMPO ABAIXO",
          titleFileList: "Lista de arquivo(s)"
        }
      },
      billing: {
        trialDays: "Dias de teste grátis",
        trialDaysHelp: "0 significa sem período grátis",
        dueDay: "Dia do vencimento",
        dueDayHelp: "Mensal; meses menores usam o último dia",
        prorata: "Pró-rata",
        trialEndsIn: "Seu período de teste termina em {{days}} dias!",
        noActiveTrial: "Sem período de teste ativo",
        period: "Período: {{start}} a {{end}}"
      },
      todolist: {
        title: "Quadro de tarefas",
        loading: "Carregando o quadro...",
        loadError: "Não foi possível carregar o quadro.",
        emptyColumn: "Arraste uma tarefa para esta coluna",
        dragTask: "Mover tarefa",
        dragTaskLabel: "Mover tarefa {{title}}",
        completedAt: "Concluída em {{date}}",
        editTaskTitle: "Editar tarefa",
        newTaskTitle: "Nova tarefa",
        targets: { global: "Global", user: "Usuário", queue: "Fila" },
        deadline: {
          ok: "No prazo",
          warning: "Prazo próximo",
          overdue: "Atrasada"
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
          assignee: "Usuário responsável",
          queue: "Fila responsável",
          dueAt: "Prazo"
        },
        buttons: {
          add: "Adicionar",
          newTask: "Nova tarefa",
          save: "Salvar",
          configure: "Configurar colunas",
          clearFilter: "Limpar filtro",
          tryAgain: "Tentar novamente",
          editTask: "Editar tarefa",
          deleteTask: "Excluir tarefa",
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
          regularColumn: "Coluna de tarefas em andamento",
          moveLeft: "Mover para a esquerda",
          moveRight: "Mover para a direita",
          editColumn: "Editar coluna",
          newColumn: "Nova coluna",
          chooseColor: "Escolher cor",
          useBrandColor: "Usar cor da empresa"
        },
        confirm: {
          deleteTaskTitle: "Excluir tarefa",
          deleteTask: "Deseja excluir a tarefa “{{title}}”?",
          deleteColumnTitle: "Excluir coluna",
          deleteColumn: "Deseja excluir a coluna “{{title}}”?"
        },
        toasts: {
          taskCreated: "Tarefa criada.",
          taskSaved: "Tarefa atualizada.",
          taskDeleted: "Tarefa excluída.",
          columnSaved: "Coluna salva.",
          columnDeleted: "Coluna excluída.",
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
          deleted: "O atendimento que você estava foi deletado."
        },
        notification: {
          message: "Mensagem de",
          nomessages: "Sem novas mensagens"
        },
        tabs: {
          open: { title: "Abertas" },
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
          placeholder: "Buscar atendimento e mensagens"
        },
        buttons: {
          showAll: "Todos"
        }
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Digite para buscar usuários",
        fieldConnectionLabel: "Encaminhar pela conexão",
        fieldConnectionPlaceholder: "Selecione uma conexão",
        connectionHelp:
          "Depois de escolher a conexão, selecione uma fila disponível nela.",
        connectionUnavailable: "desconectada",
        fieldQueueLabel: "Transferir para fila",
        fieldQueuePlaceholder: "Selecione uma fila",
        noOptions: "Nenhum usuário encontrado com esse nome",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar"
        }
      },
      ticketsList: {
        pendingHeader: "Aguardando",
        assignedHeader: "Atendendo",
        noTicketsTitle: "Nada aqui!",
        noTicketsMessage:
          "Nenhum atendimento encontrado com esse status ou termo pesquisado",
        buttons: {
          accept: "Aceitar"
        }
      },
      newTicketModal: {
        title: "Criar Ticket",
        fieldLabel: "Digite para pesquisar o contato",
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
          contacts: "Contatos",
          queues: "Filas & Chatbot",
          tags: "Tags",
          administration: "Administração",
          service: "Atendimento",
          users: "Usuários",
          settings: "Configurações",
          helps: "Ajuda",
          chatgpt: "ChatGPT",
          schedules: "Agendamentos",
          campaigns: "Campanhas",
          annoucements: "Informativos",
          chats: "Chat Interno",
          financeiro: "Financeiro",
          subscription: "Assinatura",
          cobranca: "Cobrança",
          prospeccao: "Prospecção",
          logout: "Sair",
          management: "Gerência",
          kanban: "Kanban",
          tasks: "Tarefas"
        },
        appBar: {
          i18n: {
            language: "Português 🇧🇷",
            language_short: "pt_BR"
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
        enabled: "Piloto habilitado",
        disabled: "Piloto desabilitado",
        tabs: { plugin: "Plugin", mcp: "MCP" },
        plugin: {
          name: "Espaço Whats",
          recommended: "Recomendado",
          description:
            "A forma mais simples de usar seus atendimentos dentro do ChatGPT.",
          details:
            "Instale o plugin, conecte sua conta do Espaço Whats com OAuth e use-o nas conversas pelo menu de plugins ou mencionando @EspaçoWhats.",
          open: "Abrir plugin no ChatGPT",
          steps: {
            title: "Como instalar e conectar",
            open: "Abra o plugin Espaço Whats no ChatGPT",
            install: "Clique em Instalar plugin",
            connect: "Selecione Conectar",
            login: "Entre com tenant, e-mail e senha de administrador",
            use: "Use pelo menu de plugins ou mencione @EspaçoWhats"
          },
          marketplace: {
            title: "Instalação para workspaces pelo GitHub",
            description:
              "Um administrador também pode importar o marketplace oficial em Configurações do workspace → Plugins → Adicionar → Importar marketplace.",
            repository: "Repositório",
            path: "Caminho",
            pathValue: "Deixe em branco",
            branch: "Branch",
            copy: "Copiar repositório"
          }
        },
        warningTitle: "Dados pessoais e clínicos",
        warning:
          "Ao conectar, conversas identificáveis e possíveis dados clínicos poderão ser transmitidos ao ChatGPT conforme suas perguntas. Use somente após a aprovação jurídica e administrativa.",
        copy: "Copiar URL",
        connection: {
          title: "URL do servidor MCP",
          description:
            "O Espaço Whats não usa chave da OpenAI. A inteligência e os limites pertencem ao plano ChatGPT do usuário."
        },
        steps: {
          title: "Como conectar",
          open: "Abra o Developer Mode do ChatGPT",
          create: "Crie uma integração MCP Draft",
          url: "Cole a URL MCP",
          oauth: "Escolha OAuth",
          login: "Entre com tenant, e-mail e senha de administrador"
        },
        connections: {
          title: "Conexões ativas",
          empty: "Nenhum ChatGPT conectado.",
          client: "Cliente",
          admin: "Administrador",
          created: "Criada em",
          lastUse: "Último uso",
          revoke: "Revogar",
          revokeAll: "Revogar todas"
        },
        revoke: {
          title: "Revogar conexão",
          one: "Esta conexão perderá o acesso imediatamente.",
          all: "Todas as conexões deste tenant perderão o acesso imediatamente."
        },
        toasts: {
          copied: "URL MCP copiada.",
          repositoryCopied: "Repositório do plugin copiado.",
          revoked: "Conexão revogada."
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
          deleteTitle: "Você tem certeza que quer excluir esta Lane?",
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
        title: "Listas de Contatos",
        table: {
          name: "Nome",
          contacts: "Contatos",
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
        title: "Contatos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo",
          lists: "Listas",
          import: "Importar"
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
          cancel: "Cancelar"
        },
        table: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          actions: "Ações"
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
          importMessage: "Deseja importar os contatos desta planilha? ",
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
          contactLists: "Listas de Contatos"
        },
        table: {
          name: "Nome",
          whatsapp: "Conexão",
          contactList: "Lista de Contatos",
          status: "Status",
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
            status: "Status",
            scheduledAt: "Agendamento",
            confirmation: "Confirmação",
            contactList: "Lista de Contato"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Fechar",
            attach: "Anexar Arquivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Excluir",
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
          title: "Title",
          text: "Texto",
          mediaName: "Arquivo",
          status: "Status",
          actions: "Ações"
        },
        dialog: {
          edit: "Edição de Informativo",
          add: "Novo Informativo",
          update: "Editar Informativo",
          readonly: "Apenas Visualização",
          form: {
            priority: "Prioridade",
            title: "Title",
            text: "Texto",
            mediaPath: "Arquivo",
            status: "Status"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Fechar",
            attach: "Anexar Arquivo"
          }
        },
        confirmationModal: {
          deleteTitle: "Excluir",
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
        dragHint:
          "Arraste as filas pela alça para definir a ordem em que aparecem no menu inicial do WhatsApp.",
        empty: "Nenhuma fila criada ainda.",
        noGreeting: "Sem mensagem de saudação",
        optionsCountHint: "Opções no menu inicial do chatbot",
        moveHandle: "Mover a fila {{name}}",
        moved: "{{name}} movida para a posição {{position}} de {{total}}",
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
          deleteTitle: "Excluir",
          deleteMessage:
            "Você tem certeza? Essa ação não pode ser revertida! Os atendimentos dessa fila continuarão existindo, mas não terão mais nenhuma fila atribuída."
        }
      },
      chatbotFlow: {
        title: "Jornada automática",
        subtitle: "É assim que o cliente vê o menu no WhatsApp",
        activeCount: "{{active}}/{{total}} ativas",
        path: "Caminho no chatbot",
        root: "Menu principal",
        footer:
          "Arraste pela alça para reordenar. A tecla que o cliente digita é sempre 1, 2, 3… entre as opções ativas — desativar uma opção renumera as demais automaticamente.",
        noTitle: "Sem título",
        noMessage: "Sem mensagem",
        inactive: "Desativada — não aparece no menu",
        exitsChatbot: "Encerra o chatbot e chama um atendente",
        forwardsTo: "Transfere para {{queue}}",
        activeKey: "O cliente digita {{key}}",
        answers: "{{total}} respostas",
        createAnswers: "Criar respostas",
        moveHandle: "Mover a opção {{title}}",
        activate: "Ativar {{title}}",
        deactivate: "Desativar {{title}}",
        moved: "{{title}} movida para a posição {{position}} de {{total}}",
        emptyRoot:
          "Nenhuma opção ainda. Crie a primeira e ela virará o item 1 do menu.",
        emptyBranch:
          "Nenhuma resposta ainda para esta opção. O cliente recebe só a mensagem dela.",
        addOption: "Adicionar opção",
        addAnswer: "Adicionar resposta",
        toasts: {
          saved: "Opção salva com sucesso",
          deleted: "Opção removida com sucesso"
        },
        confirmDelete: {
          title: "Excluir opção",
          message:
            "Tem certeza? As respostas dentro dela também serão excluídas, e as opções seguintes serão renumeradas."
        },
        editor: {
          addTitle: "Nova opção",
          editTitle: "Editar opção",
          title: "Título",
          titleHelp: "Aparece ao lado do número no menu enviado ao cliente.",
          message: "Mensagem",
          messageHelp:
            "Enviada quando o cliente escolhe esta opção. Deixe em branco para enviar só as respostas seguintes.",
          attach: "Anexar arquivo",
          removeAttachment: "Remover anexo",
          exitChatbot: "Encerrar o chatbot e chamar um atendente",
          forwardQueue: "Transferir para outra fila",
          noForwardQueue: "Não transferir",
          forwardQueueHelp:
            "Ao escolher esta opção, o atendimento passa para a fila selecionada e o menu dela é enviado.",
          delete: "Excluir",
          cancel: "Cancelar",
          save: "Salvar"
        }
      },
      queueSelect: {
        inputLabel: "Filas"
      },
      users: {
        title: "Usuários",
        empty: "Nenhum usuário encontrado.",
        filters: {
          queue: "Fila",
          allQueues: "Todas as filas"
        },
        profiles: {
          admin: "Admin",
          user: "Usuário"
        },
        groups: {
          admin: "Administradores",
          user: "Usuários"
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
          add: "Adicionar usuário"
        },
        toasts: {
          deleted: "Usuário excluído com sucesso."
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage:
            "Todos os dados do usuário serão perdidos. Os atendimento abertos deste usuário serão movidos para a fila."
        }
      },
      helps: {
        title: "Central de Ajuda",
        empty: "Nenhum material publicado ainda.",
        emptyGroup: "Nenhum conteúdo neste card.",
        noGroups: "Nenhum card cadastrado.",
        inactive: "Inativo",
        active: "Ativo",
        adminOnly: "Somente administradores",
        videos: "Vídeos",
        articles: "Artigos",
        articleOne: "artigo",
        articleOther: "artigos",
        videoOne: "vídeo",
        videoOther: "vídeos",
        tabs: {
          contents: "Conteúdo",
          groups: "Grupos"
        },
        audience: {
          company: "Clientes",
          partner: "Parceiros"
        },
        scope: {
          platform: "Plataforma",
          company: "Minha empresa"
        },
        sections: {
          platform: "Ajuda da Plataforma",
          company: "Ajuda da {{name}}",
          companyFallback: "sua empresa"
        },
        player: {
          title: "Vídeo"
        },
        contentType: {
          video: "Vídeo",
          article: "Artigo"
        },
        buttons: {
          addGroup: "Novo card",
          addContent: "Novo conteúdo",
          cancel: "Cancelar",
          save: "Salvar"
        },
        iconPicker: {
          title: "Escolher ícone",
          search: "Buscar ícone"
        },
        groupModal: {
          addTitle: "Novo card",
          editTitle: "Editar card",
          title: "Título",
          subtitle: "Subtítulo",
          audience: "Público",
          isGlobal: "Publicar para todas as empresas",
          isGlobalHelper:
            "Material da plataforma: aparece na Central de Ajuda de todas as empresas.",
          adminOnlyHelper:
            "Este card e todo o conteúdo dentro dele ficam ocultos para usuários comuns."
        },
        contentModal: {
          addTitle: "Novo conteúdo",
          editTitle: "Editar conteúdo",
          group: "Card",
          title: "Título",
          description: "Descrição",
          contentPlaceholder: "Escreva o artigo...",
          adminOnly: "Visível somente para administradores",
          video: "Vídeo do YouTube",
          videoHelper:
            "Cole o link do YouTube ou apenas o ID, ex.: dQw4w9WgXcQ",
          videoInvalid: "Não reconhecemos um vídeo do YouTube nesse valor.",
          videoPreview: "Prévia da capa do vídeo",
          duration: "Duração",
          link: "Link",
          linkHelper: "Opcional. Usado quando o vídeo não está no YouTube."
        },
        confirmDeleteGroup: {
          title: "Excluir card",
          message:
            "Deseja realmente excluir este card? Todo o conteúdo dele será removido."
        },
        confirmDeleteContent: {
          title: "Excluir conteúdo",
          message: "Deseja realmente excluir este conteúdo?"
        },
        toasts: {
          saved: "Operação realizada com sucesso!",
          deleted: "Registro excluído com sucesso!"
        }
      },
      about: {
        aboutthe: "Sobre o",
        copyright: "© 2024 - Funcionando com Espaço Whats",
        buttonclose: "Fechar",
        title: "Sobre o Espaço Whats",
        abouttitle: "Origem e melhorias",
        aboutdetail:
          "O Espaço Whats é derivado indireto do projeto Whaticket com melhorias compartilhadas pelos desenvolvedores do sistema EquipeChat através do canal VemFazer no youtube, posteriormente melhoradas por Claudemir Todo Bom",
        aboutauthorsite: "Site do autor",
        aboutwhaticketsite: "Site do Whaticket Community no Github",
        aboutvemfazersite: "Site do canal Vem Fazer no Github",
        licenseheading: "Licença em Código Aberto",
        licensedetail:
          "O Espaço Whats está licenciado sob a GNU Affero General Public License versão 3, isso significa que qualquer usuário que tiver acesso a esta aplicação tem o direito de obter acesso ao código fonte. Mais informações nos links abaixo:",
        licensefulltext: "Texto completo da licença",
        licensesourcecode: "Código fonte do Espaço Whats"
      },
      schedules: {
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir este Agendamento?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          contact: "Contato",
          body: "Mensagem",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          status: "Status",
          actions: "Ações",
          occasion: "Ocasião",
          nextRun: "Próxima ocorrência",
          audience: "Público",
          progress: "Entregas"
        },
        tabs: {
          schedules: "Agendamentos",
          dates: "Datas comemorativas"
        },
        filters: { kind: "Tipo", status: "Status" },
        empty: "Nenhum agendamento encontrado.",
        emptyDeliveries: "As entregas aparecerão aqui após a ocorrência.",
        buttons: {
          add: "Novo Agendamento"
        },
        toasts: {
          deleted: "Agendamento excluído com sucesso."
        }
      },
      commemorativeDates: {
        add: "Nova data comemorativa",
        edit: "Editar data comemorativa",
        success: "Data comemorativa salva com sucesso.",
        empty: "Nenhuma data comemorativa cadastrada.",
        last: "Último",
        form: {
          name: "Nome",
          ruleType: "Padrão anual",
          month: "Mês",
          day: "Dia",
          weekday: "Dia da semana",
          ordinal: "Ocorrência",
          active: "Ativa"
        },
        rules: { fixed: "Dia e mês fixos", nthWeekday: "Dia da semana no mês" },
        weekdays: {
          0: "Domingo",
          1: "Segunda-feira",
          2: "Terça-feira",
          3: "Quarta-feira",
          4: "Quinta-feira",
          5: "Sexta-feira",
          6: "Sábado"
        }
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir esta Tag?",
          deleteMessage: "Esta ação não pode ser revertida."
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Tickets",
          contacts: "Contatos",
          actions: "Ações",
          id: "Id",
          kanban: "Kanban"
        },
        buttons: {
          add: "Nova Tag"
        },
        toasts: {
          deleted: "Tag excluído com sucesso."
        }
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
        loginLinks: "Links do login",
        loginLinksHint:
          "Adicione pares de título e URL para exibir abaixo da caixa de login no desktop e no mobile.",
        linkTitle: "Título do link",
        linkUrl: "URL do link",
        removeLink: "Remover link",
        sidePanelImage: "Imagem lateral do login",
        sidePanelImageHint:
          "Exibida no painel lateral do login em telas desktop.",
        backgroundContent: "Conteúdo de fundo do login",
        backgroundContentHint:
          "Aceita imagens, arquivos SVG e vídeos MP4 para o fundo da tela de login.",
        linkPreview: "Prévia do link (compartilhamento)",
        linkPreviewImage: "Banner do link",
        linkPreviewImageHint:
          "Imagem exibida quando o link do sistema é compartilhado (WhatsApp, Telegram, etc.). Prefira 1200x630.",
        linkPreviewDescription: "Descrição do link",
        linkPreviewDescriptionHint:
          "Texto exibido abaixo do título na prévia do link compartilhado.",
        noFileSelected: "Nenhum arquivo selecionado ainda.",
        buildExtension: "Construir extensão WA Session Capture",
        buildingExtension: "Construindo extensão…",
        downloadExtension: "Baixar extensão",
        extensionHint:
          "Constrói uma extensão Chrome personalizada. O ZIP baixado já contém os arquivos da extensão: extraia e carregue a pasta extraída como extensão descompactada.",
        extensionBuildStarted:
          "Construção da extensão iniciada. Você será notificado quando estiver pronta.",
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
          externalServices: "Serviços externos",
          serveradmin: "Administração do servidor"
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
          title: "Gerenciamento de Expediente",
          options: {
            disabled: "Desabilitado",
            ManagementByDepartment: "Gerenciamento Por Fila",
            ManagementByCompany: "Gerenciamento Por Empresa"
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
            disabled: "informar indisponibilidade"
          }
        },
        AutomaticChatbotOutput: {
          title: "Saída automática de chatbot",
          options: {
            enabled: "Activado",
            disabled: "Desativado"
          }
        },
        ShowNumericEmoticons: {
          title: "Exibir emojis numéricos na fila",
          options: {
            enabled: "Activado",
            disabled: "Desativado"
          }
        },
        QuickMessages: {
          title: "Mensagens Rápidas",
          options: {
            enabled: "Por empresa",
            disabled: "Por Usuário"
          }
        },
        AllowRegistration: {
          title: "Permitir cadastro",
          options: {
            enabled: "Ativado",
            disabled: "Desativado"
          }
        },
        FileUploadLimit: {
          title: "Limite de Upload de arquivos (MB)"
        },
        FileDownloadLimit: {
          title: "Limite de Download de arquivos (MB)"
        },
        messageVisibility: {
          title: "Visibilidade da mensagem",
          options: {
            respectMessageQueue: "Respeitar fila da mensagem",
            respectTicketQueue: "Respeitar fila do ticket"
          }
        },
        keepQueueAndUser: {
          title: "Manter fila e usuário no ticket fechado",
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
          welcome: "Seja bem-vindo a",
          expirationTime: "Ativo até"
        },
        Options: {
          title: "Opções"
        },
        Companies: {
          title: "Empresas"
        },
        schedules: {
          title: "Horários",
          updateToNewFormat: "Atualizar para novo formato"
        },
        Plans: {
          title: "Planos",
          public: "Público",
          usersLimit: "Limite de usuários",
          connectionsLimit: "Limite de conexões",
          queuesLimit: "Limite de filas",
          currencyCode: "Código da Moeda (ISO 4217)"
        },
        Help: {
          title: "Ajuda"
        },
        Whitelabel: {
          title: "Whitelabel"
        },
        PaymentGateways: {
          title: "Payment gateways"
        },
        i18nSettings: {
          title: "Traduções"
        },
        AIProvider: {
          title: "Serviço de IA"
        },
        AudioTranscriptions: {
          title: "Transcrição de áudio"
        },
        TagsMode: {
          title: "Modo de Tags",
          options: {
            ticket: "Ticket",
            contact: "Contato",
            both: "Ticket e Contacto"
          }
        }
      },
      messagesList: {
        header: {
          assignedTo: "Atribuído à:",
          buttons: {
            return: "Retornar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceitar",
            call: "Chamar",
            endCall: "Encerrar Chamada"
          }
        }
      },
      messagesInput: {
        placeholderOpen: "Digite uma mensagem",
        placeholderClosed:
          "Reabra ou aceite esse ticket para enviar uma mensagem.",
        signMessage: "Assinar",
        replying: "Respondendo",
        editing: "Editando"
      },
      message: {
        edited: "Editada",
        forwarded: "Encaminhada"
      },

      contactDrawer: {
        header: "Dados do contato",
        addExtraInfo: "Informações adicionais",
        fieldAddedAt: "Adicionado em",
        groupHeader: "Dados do grupo",
        buttons: {
          edit: "Editar contato"
        },
        extraInfo: "Outras informações",
        participants: "Participantes",
        participantsUnavailable: "Não foi possível carregar os participantes",
        you: "você",
        admin: "Admin",
        owner: "Criador"
      },
      ticketOptionsMenu: {
        schedule: "Agendamento",
        delete: "Deletar",
        transfer: "Transferir",
        appointmentsModal: {
          title: "Observações do Atendimento",
          textarea: "Observação",
          placeholder: "Insira aqui a informação que deseja registrar"
        },
        confirmationModal: {
          title: "Deletar o ticket do contato",
          message:
            "Atenção! Todas as mensagens relacionadas ao ticket serão perdidas."
        },
        buttons: {
          delete: "Excluir",
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
        delete: "Deletar",
        edit: "Editar",
        forward: "Encaminhar",
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
        composing: "Digitando...",
        recording: "Gravando...",
        paused: "Pausado"
      },
      privacyModal: {
        title: "Editar Privacidade do Whatsapp",
        buttons: {
          cancel: "Cancelar",
          okEdit: "Salvar"
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
            dias90: "90 Dias"
          },
          readreceipts: "Para atualizar a privacidade dos recibos de leitura",
          profile: "Para atualizar a privacidade da foto do perfil",
          status: "Para atualizar a privacidade do recados",
          online: "Para atualizar a privacidade online",
          last: "Para atualizar a privacidade do Último Visto",
          groupadd: "Para atualizar a privacidade de Adicionar a grupos",
          calladd: "Para atualizar a privacidade de Adicionar a Ligações",
          disappearing: "Para atualizar o Modo de Desaparecimento Padrão"
        }
      },
      phoneNumberInput: {
        country: "País",
        phoneNumber: "Telefone",
        localNumber: "Telefone"
      },
      frontendErrors: {
        ERR_CONFIG_ERROR: "Erro de configuração. Por favor, contate o suporte.",
        ERR_CLOCK_OUT_OF_SYNC:
          "Relógio fora de sincronia. Por favor, verifique as configurações de data e hora do seu dispositivo.",
        ERR_BACKEND_UNREACHABLE:
          "Backend inacessível. Por favor, tente novamente mais tarde.",
        ERR_BACKEND_NOT_READY:
          "O backend está iniciando e ainda não está pronto. Tentando novamente automaticamente."
      },
      backendErrors: {
        ERR_PROSPECCAO_SEM_CONEXAO:
          "Nenhuma conexão de WhatsApp disponível para abrir a conversa.",
        ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO:
          "Esse lead não está mais na sua base.",
        ERR_PROSPECCAO_LEAD_SEM_TELEFONE:
          "Esse lead não tem telefone para abrir conversa.",
        ERR_PROSPECCAO_NAO_CONFIGURADA:
          "A prospecção ainda não foi configurada neste servidor.",
        ERR_PROSPECCAO_CHAVE_INVALIDA:
          "A chave de acesso à prospecção foi recusada. Avise o suporte.",
        ERR_PROSPECCAO_INDISPONIVEL:
          "O serviço de prospecção não respondeu. Tente de novo em alguns minutos.",
        ERR_PROSPECCAO_BUSCA_INVALIDA:
          "O serviço de prospecção recusou esta busca. Revise o nicho e a cidade.",
        ERR_PROSPECCAO_BUSCA_NAO_ENCONTRADA:
          "Esta busca não existe mais no serviço de prospecção.",
        ERR_PROSPECCAO_NICHO_CIDADE_OBRIGATORIOS:
          "Informe o nicho e a cidade para buscar leads.",
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
        ERR_BILLING_MANAGED_IN_CENTRAL:
          "Plano, valores e vencimentos deste cliente devem ser alterados na Central de Cobrança.",
        ERR_ACTIVE_CHARGE_PREVENTS_DUE_DATE_CHANGE:
          "Exclua primeiro a cobrança ativa deste cliente antes de mudar o próximo vencimento.",
        ERR_PAID_INVOICE_CANNOT_BE_DELETED:
          "Uma cobrança já paga não pode ser excluída.",
        ERR_TASK_BOARD_INVALID_TITLE: "Informe um título válido.",
        ERR_TASK_BOARD_INVALID_COLOR: "Informe uma cor hexadecimal válida.",
        ERR_TASK_BOARD_COLUMN_NOT_FOUND: "Coluna não encontrada.",
        ERR_TASK_BOARD_TASK_NOT_FOUND: "Tarefa não encontrada.",
        ERR_TASK_BOARD_INVALID_DATE: "Informe uma data válida.",
        ERR_TASK_BOARD_INVALID_DATE_RANGE: "O intervalo de datas é inválido.",
        ERR_TASK_BOARD_DONE_COLUMN_REQUIRED:
          "O quadro precisa ter uma coluna de tarefas concluídas.",
        ERR_TASK_BOARD_INVALID_COLUMN_ORDER: "A ordem das colunas é inválida.",
        ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN:
          "Escolha outra coluna de conclusão antes de excluir esta.",
        ERR_TASK_BOARD_COLUMN_NOT_EMPTY:
          "Mova as tarefas desta coluna antes de excluí-la.",
        ERR_EMAIL_NOT_FOUND: "Não encontramos esse e-mail.",
        ERR_COMPANY_SUSPENDED:
          "Esta conta está suspensa. Entre em contato com o responsável pela sua assinatura.",
        ERR_PASSWORD_ALREADY_CONFIGURED:
          "Esta conta já possui senha. Volte ao login para entrar.",
        ERR_ACTIVATION_INVALID: "Este link de ativação é inválido ou expirou.",
        ERR_PASSWORD_CONFIRMATION: "As senhas não coincidem.",
        ERR_PASSWORD_TOO_WEAK:
          "A senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula e número.",
        ERR_HELP_INVALID_TYPE: "Tipo de conteúdo inválido.",
        ERR_HELP_REQUIRED: "Preencha os campos obrigatórios do conteúdo.",
        ERR_HELP_INVALID_NAME: "Título do conteúdo inválido.",
        ERR_HELP_INVALID_GROUP: "O card informado não existe.",
        ERR_HELP_GROUP_REQUIRED: "Escolha um card para o conteúdo.",
        ERR_HELP_VIDEO_REQUIRED: "Informe o vídeo do YouTube ou um link.",
        ERR_HELP_INVALID_VIDEO:
          "Link de vídeo inválido. Cole o endereço do YouTube ou o ID de 11 caracteres.",
        ERR_HELP_CONTENT_REQUIRED: "O artigo não pode ficar vazio.",
        ERR_NO_HELP_FOUND: "Conteúdo de ajuda não encontrado.",
        ERR_NO_HELP_GROUP_FOUND: "Card de ajuda não encontrado.",
        ERR_HELP_REORDER_EMPTY: "Nenhum conteúdo informado para reordenar.",
        ERR_HELP_REORDER_INVALID:
          "Só é possível reordenar conteúdos do mesmo card.",
        ERR_HELP_GROUP_REORDER_EMPTY: "Nenhum card informado para reordenar.",
        ERR_HELP_GROUP_REORDER_INVALID:
          "Só é possível reordenar cards do mesmo público.",
        ERR_HELP_GROUP_INVALID_TITLE: "Título do card inválido.",
        ERR_HELP_GROUP_INVALID_AUDIENCE: "Público do card inválido.",
        ERR_UNAUTHORIZED: "Você não está autorizado a acessar este recurso.",
        ERR_FORBIDDEN: "Você não tem permissão para acessar este recurso.",
        ERR_CHECK_NUMBER: "Número não encontrado no Whatsapp.",
        ERR_NO_OTHER_WHATSAPP: "Deve haver pelo menos um WhatsApp padrão.",
        ERR_NO_DEF_WAPP_FOUND:
          "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões.",
        ERR_WAPP_CHECK_CONTACT:
          "Não foi possível verificar o contato do WhatsApp. Verifique a página de conexões",
        ERR_WAPP_INVALID_CONTACT: "Este não é um número de Whatsapp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões.",
        ERR_INVALID_CREDENTIALS:
          "Erro de autenticação. Por favor, tente novamente.",
        ERR_SENDING_WAPP_MSG:
          "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões.",
        ERR_DELETE_WAPP_MSG: "Não foi possível excluir a mensagem do WhatsApp.",
        ERR_EDITING_WAPP_MSG: "Não foi possível editar a mensagem do WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Já existe um tíquete aberto para este contato.",
        ERR_QUEUE_INVALID_CONNECTION:
          "Uma das conexões selecionadas não pertence a esta empresa.",
        ERR_WAPP_INVALID_QUEUE:
          "Uma das filas selecionadas não pertence a esta empresa.",
        ERR_TICKET_INVALID_CONNECTION:
          "A conexão selecionada não é compatível com este atendimento.",
        ERR_TICKET_GROUP_CONNECTION_TRANSFER:
          "Não é possível trocar a conexão de um atendimento em grupo.",
        ERR_INVALID_GROUP_MODE: "O modo de grupo informado é inválido.",
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
        ERR_SESSION_EXPIRED: "Sessão expirada. Por favor entre.",
        ERR_USER_CREATION_DISABLED:
          "A criação do usuário foi desabilitada pelo administrador.",
        ERR_NO_PERMISSION: "Você não tem permissão para acessar este recurso.",
        ERR_DUPLICATED_CONTACT: "Já existe um contato com este número.",
        ERR_NO_SETTING_FOUND: "Nenhuma configuração encontrada com este ID.",
        ERR_NO_CONTACT_FOUND: "Nenhum contato encontrado com este ID.",
        ERR_NO_TICKET_FOUND: "Nenhum tíquete encontrado com este ID.",
        ERR_NO_USER_FOUND: "Nenhum usuário encontrado com este ID.",
        ERR_NO_WAPP_FOUND: "Nenhum WhatsApp encontrado com este ID.",
        ERR_CREATING_MESSAGE: "Erro ao criar mensagem no banco de dados.",
        ERR_CREATING_TICKET: "Erro ao criar tíquete no banco de dados.",
        ERR_FETCH_WAPP_MSG:
          "Erro ao buscar a mensagem no WhtasApp, talvez ela seja muito antiga.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Esta cor já está em uso, escolha outra.",
        ERR_WAPP_GREETING_REQUIRED:
          "A mensagem de saudação é obrigatório quando há mais de uma fila.",
        ERR_SUBSCRIPTION_CHECK_FAILED: "Assinatura inválida ou não encontrada",
        ERR_WAPP_NOT_FOUND: "Conexão indisponível",
        ERR_SUBSCRIPTION_EXPIRED: "Assinatura expirada",
        ERR_UNKOWN: "Erro desconhecido"
      },
      phoneCall: {
        hangup: "Desligar"
      },
      wavoipModal: {
        title: "Insira o token da sua conexão no Wavoip",
        instructions:
          "Acessando o endereço abaixo você pode criar uma conta com 50 ligações gratuitas para teste",
        coupon: "Consulte as condições de desconto ao contratar o serviço."
      },
      openHours: {
        title: "Horários de Funcionamento",
        timezone: {
          placeholder: "Selecione o fuso horário",
          searchPlaceholder: "Digite para buscar...",
          selected: "Fuso horário selecionado"
        },
        tabs: {
          weekly: "Horários Semanais",
          overrides: "Exceções e Feriados"
        },
        weekly: {
          title: "Horários de Funcionamento Semanais",
          description:
            "Configure os horários regulares de funcionamento para cada dia da semana.",
          rule: "Regra",
          days: "Dias da Semana",
          hours: "Horários",
          closedMessage: "Fechado (sem horários definidos)",
          addHour: "Adicionar Horário",
          addRule: "Adicionar Nova Regra Semanal",
          from: "De",
          to: "Até",
          until: "até"
        },
        overrides: {
          title: "Exceções e Feriados",
          description:
            "Configure datas específicas com horários especiais ou fechamentos (feriados, eventos, etc.).",
          exception: "Exceção",
          date: "Data",
          label: "Descrição",
          labelPlaceholder: "Ex: Natal, Carnaval...",
          repeat: "Repetição",
          repeatNone: "Não repetir",
          repeatYearly: "Anual",
          closedDay: "Fechado neste dia",
          specialHours: "Horários Especiais",
          addHour: "Adicionar Horário",
          addException: "Adicionar Exceção ou Feriado",
          from: "De",
          to: "Até",
          until: "até"
        },
        days: {
          mon: "Segunda",
          tue: "Terça",
          wed: "Quarta",
          thu: "Quinta",
          fri: "Sexta",
          sat: "Sábado",
          sun: "Domingo"
        }
      },
      ticketz: {
        registration: {
          header: "Cadastre-se na base de usuários do Espaço Whats",
          description:
            "Preencha os campos abaixo para se cadastrar na base de usuários do Espaço Whats e receber novidades sobre o projeto.",
          name: "Nome",
          country: "País",
          phoneNumber: "Número de Whatsapp",
          submit: "Cadastrar"
        },
        proAd: {
          imageAlt: "Captura de tela do Espaço Whats PRO",
          title: "Espaço Whats PRO",
          features: {
            officialChannels:
              "Whatsapp Oficial - Instagram - Messenger e outros",
            exclusiveFeatures: "Features exclusivas",
            advancedSupport: "Suporte Avançado",
            easyMigration: "Migração Facilitada"
          },
          subscribePrice: "Assine por {{monthlyPrice}}/mês",
          subscribeSubtitle: "direto dentro do sistema",
          ctaUpgrade: "Clique para instruções de Upgrade",
          ctaVisitSite: "Clique para visitar o site!",
          instructions: {
            title: "Instruções de Upgrade",
            stepIntro:
              "Se você instalou as imagens disponibilizadas pelo projeto em um servidor ou VPS utilizando as instruções facilitadas tudo o que você precisa fazer é acessar seu servidor e digitar o comando abaixo:",
            stepInstall:
              'Em instantes o Espaço Whats PRO estará instalado com todos os teus dados, agora só precisa ir até o menu de usuário, clicar em "Assinatura do Espaço Whats PRO" e fazer a sua assinatura.',
            helpPrefix:
              "Se a tua instalação for diferente ou acredita que precisa de auxílio para instalar o Espaço Whats Pro, ",
            helpLink: "entre em contato",
            helpSuffix: " que nós ajudamos!"
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
