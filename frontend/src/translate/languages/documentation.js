export const documentationMessages = {
  pt: {
    documentation: {
      title: "Documentação | Espaço Whats",
      apiTitle: "Referência da API | Espaço Whats",
      description:
        "Guias de integração, autenticação, mensagens e referência dos recursos existentes do Espaço Whats.",
      home: "Espaço Whats — início",
      guides: "Documentação",
      reference: "Referência da API",
      login: "Entrar no sistema",
      menu: "Abrir navegação",
      closeMenu: "Fechar navegação",
      dark: "Ativar tema escuro",
      light: "Ativar tema claro",
      skip: "Ir para o conteúdo",
      navigation: "Guias de integração",
      contents: "Nesta página",
      download: "Baixar OpenAPI",
      source: "Código-fonte · AGPL",
      footer: "Espaço Whats. Documentação da implementação existente.",
      updated: "Referência · {{version}}",
      loading: "Carregando a referência…",
      loadError:
        "Não foi possível carregar a documentação. Verifique sua conexão e tente novamente.",
      retry: "Tentar novamente",
      copy: "Copiar código",
      copied: "Copiado",
      copyError:
        "Não foi possível copiar. Selecione o código e copie manualmente.",
      sample: "Exemplo ilustrativo",
      module: "Escolha um módulo",
      allModules: "Todos os módulos",
      apiIntro:
        "Explore os endpoints, as credenciais e os campos de cada módulo. Os exemplos usam dados fictícios e não executam requisições.",
      apiNote:
        "A URL da API é o endereço da sua empresa seguido de /backend. /api é esta página de referência.",
      reviewed: "Contrato revisado",
      observed: "Campos observados no código",
      coverage: "{{count}} operações em {{modules}} módulos",
      search: "Buscar por recurso, caminho ou operação",
      searchLabel: "Buscar endpoints",
      method: "Método HTTP",
      allMethods: "Todos os métodos",
      results: "{{count}} operações encontradas",
      more: "Mostrar mais operações",
      empty:
        "Nenhuma operação encontrada. Tente outro termo ou remova os filtros.",
      clear: "Limpar filtros",
      viewEndpoint: "Ver documentação de {{method}} {{path}}",
      endpoint: "Endpoint",
      access: "Acesso",
      contract: "Documentação",
      auth: {
        session: "Sessão JWT",
        contactToken: "Token de contatos / JWT",
        partner: "JWT do parceiro",
        platform: "Chave da plataforma",
        oauth: "OAuth MCP",
        agent: "Credencial do agente",
        flow: "Validação própria do fluxo"
      },
      chapters: {
        inicio: "Visão geral",
        "primeira-mensagem": "Sua primeira mensagem",
        autenticacao: "Autenticação e acesso",
        arquivos: "Mídia e templates",
        recursos: "Mapa de recursos",
        catalogo: "Catálogo completo",
        respostas: "Respostas e paginação",
        eventos: "Eventos e integrações"
      },
      overview: {
        title: "Conecte seu sistema às conversas.",
        lead: "Conheça os recursos do Espaço Whats e o caminho entre uma chamada da sua aplicação e uma mensagem no WhatsApp.",
        start: "Enviar a primeira mensagem",
        browse: "Explorar a API",
        flowTitle: "Do seu sistema ao atendimento",
        flowDescription:
          "Selecione uma etapa para ver o formato da requisição.",
        flowLabels: [
          "Autenticar",
          "Localizar contato",
          "Abrir atendimento",
          "Enviar mensagem"
        ],
        flowDescriptions: [
          "O login retorna o JWT do usuário. Guarde também o cookie de renovação para continuar a sessão.",
          "Localize ou cadastre o destinatário na sua empresa. Guarde o id do contato retornado.",
          "Vincule contato, responsável e fila. A abertura usa a conexão padrão da empresa e retorna o id do atendimento.",
          "Envie o texto para o atendimento. Sucesso retorna HTTP 200 sem corpo; não tente ler a resposta como JSON."
        ],
        noteTitle: "Uma credencial para cada contexto",
        note: "Mensagens e atendimentos usam a sessão JWT do usuário. O token de integração de contatos funciona apenas nas operações que o indicam. A chave administrativa da plataforma e o OAuth do MCP têm escopos próprios.",
        findTitle: "Encontre o que você precisa",
        paths: [
          {
            title: "Começar pela integração",
            text: "URL da empresa, credenciais e um fluxo completo de envio.",
            chapter: "primeira-mensagem"
          },
          {
            title: "Conhecer todos os recursos",
            text: "Mensagens, contatos, campanhas, tarefas, voz, financeiro e administração.",
            chapter: "recursos"
          },
          {
            title: "Encontrar um endpoint",
            text: "Busque no catálogo completo e abra a referência da operação.",
            chapter: "catalogo"
          }
        ]
      },
      first: {
        title: "Sua primeira mensagem",
        lead: "O envio parte de um atendimento. Siga a sequência com uma empresa ativa, um usuário autorizado e uma conexão WhatsApp disponível.",
        baseTitle: "Defina a URL da sua empresa",
        baseText:
          "Use o domínio fornecido para sua empresa, seguido de /backend. Troque sua-empresa pelo seu subdomínio. Em desenvolvimento, use a URL da empresa no ambiente dev. Todos os IDs e dados abaixo são ilustrativos.",
        steps: [
          {
            title: "Autentique o usuário",
            text: "Envie e-mail, senha e, quando necessário, slug da empresa para /auth/login. Use o campo token como Bearer nas próximas chamadas. O cookie jrt permite renovar a sessão."
          },
          {
            title: "Localize ou cadastre o contato",
            text: "Use /contacts/findOrInsert com nome e número completo, incluindo DDI e DDD. Guarde o id retornado; ele será contactId na próxima etapa."
          },
          {
            title: "Abra o atendimento",
            text: "Informe contactId e o userId do responsável; queueId identifica a fila quando utilizada. O controlador usa a conexão padrão da empresa. Guarde o id retornado como ticketId."
          },
          {
            title: "Envie a mensagem",
            text: "Envie body como JSON para /messages/{ticketId}. O sucesso retorna 200 sem corpo. Na conexão oficial, use um template aprovado quando a janela de atendimento estiver fechada."
          }
        ],
        beforeTitle: "Antes de automatizar",
        before: [
          "Use um usuário com as permissões e filas adequadas à integração.",
          "Teste com um contato autorizado e evite repetir POST após um timeout sem conferir o atendimento: o envio não possui garantia de idempotência.",
          "Trate erros de sessão, assinatura e disponibilidade da conexão.",
          "Mantenha senha, token e cookies no servidor da sua integração."
        ]
      },
      authentication: {
        title: "Autenticação e acesso",
        lead: "Os recursos compartilham o backend, mas cada fluxo tem sua própria credencial. Confira o acesso na referência de cada operação.",
        rows: [
          {
            name: "Sessão do usuário",
            credential: "Authorization: Bearer <JWT>",
            scope:
              "Mensagens, atendimentos e operações autenticadas do sistema. Token obtido em /auth/login; permissões seguem o usuário e a empresa."
          },
          {
            name: "Token de contatos",
            credential: "Authorization: Bearer <TOKEN_DE_CONTATOS>",
            scope:
              "Rotas específicas de contatos marcadas no catálogo. A integração assume o administrador da empresa. Não autoriza envio de mensagens nem todas as rotas de contatos."
          },
          {
            name: "Sessão de parceiro",
            credential: "Authorization: Bearer <JWT_DO_PARCEIRO>",
            scope:
              "Portal /partner. Obtida no fluxo de login do parceiro, sem acesso às rotas autenticadas de usuários da empresa."
          },
          {
            name: "Chave da plataforma",
            credential: "X-Platform-Key: <CHAVE>",
            scope:
              "Operações administrativas protegidas em /api/platform/v1. Credencial restrita, distinta do token da empresa. Mutações exigem Idempotency-Key no formato UUID v4."
          },
          {
            name: "OAuth do MCP",
            credential: "Authorization: Bearer <TOKEN_OAUTH>",
            scope:
              "Transporte /mcp existente, com consentimento e escopos próprios. Depende de habilitação e configuração."
          },
          {
            name: "Fluxos específicos",
            credential: "Consulte a operação",
            scope:
              "Login, ativação, callbacks, webhooks e ferramentas temporárias de agente seguem validações próprias. A ausência de JWT na rota não significa acesso irrestrito."
          }
        ],
        refreshTitle: "Renove a sessão com o cookie",
        refresh:
          "POST /auth/refresh_token usa o cookie HttpOnly jrt, emitido no login. Preserve o cookie e aceite o novo token da resposta. GET /auth/me exige o JWT e esse cookie. Não fixe uma duração de token na integração: respeite a expiração recebida.",
        tenantTitle: "Empresa, perfil e disponibilidade",
        tenant:
          "Os dados são delimitados pela empresa autenticada. Perfil de administrador, acesso a filas e a grupos, assinatura, habilitação de módulo e configuração do provedor podem restringir uma operação. Alterar um ID na URL não concede acesso a outra empresa."
      },
      media: {
        title: "Mídia e templates",
        lead: "A mesma rota de mensagens recebe texto e arquivos. O formato da requisição muda conforme o conteúdo.",
        uploadTitle: "Envie arquivos como multipart/form-data",
        upload:
          "Use medias para cada arquivo e body para a legenda. Deixe o cliente HTTP gerar o Content-Type com boundary. Os limites dependem da configuração e do provedor; confira erros de tamanho e formato. O retorno de sucesso é 200 sem corpo.",
        templateTitle: "WhatsApp oficial: consulte os templates",
        template:
          "Consulte GET /tickets/{ticketId}/templates antes do envio. POST /messages/{ticketId}/template recebe name, language e parameters. O nome, o idioma e os parâmetros devem corresponder a um template disponível. Na conexão oficial, o servidor bloqueia texto livre fora da janela e retorna ERR_META_WINDOW_CLOSED. Templates não são enviados a grupos.",
        schedulesTitle: "Mídia nos agendamentos",
        schedules:
          "Agendamentos usam o campo file, e não medias. O campo payload pode conter o JSON do agendamento em uma requisição multipart. Consulte a referência de Agendamentos para prévia, variáveis, entregas e envio imediato."
      },
      resources: {
        title: "Tudo o que já está disponível no código",
        lead: "Explore os módulos do sistema. A referência indica as operações existentes; o acesso a cada recurso depende da configuração e das permissões da sua empresa.",
        open: "Abrir {{name}}",
        count: "{{count}} operações"
      },
      catalog: {
        title: "Catálogo completo",
        lead: "Busque pelo caminho da rota, pelo módulo ou pela operação. Cada resultado leva ao endpoint correspondente na referência da API.",
        coverage:
          "O catálogo inclui as rotas montadas no backend e o acesso a arquivos públicos. Contratos revisados têm exemplos e schemas; os demais descrevem os campos observados nos controladores, sem presumir tipos ou validações delegadas aos serviços."
      },
      responses: {
        title: "Respostas, erros e paginação",
        lead: "O formato varia por recurso. Use o contrato de cada operação para interpretar a resposta.",
        rows: [
          {
            code: "200 / 201 / 204",
            text: "Sucesso conforme a operação. O envio de mensagem retorna 200 sem corpo; vários cadastros também retornam 200, não 201."
          },
          {
            code: "400",
            text: "Entrada inválida ou regra de negócio. Leia error; nem todas as validações usam um código fixo."
          },
          {
            code: "401 / 403",
            text: "Credencial ausente, inválida, expirada ou acesso negado. Sessão expirada pode retornar 403 com ERR_SESSION_EXPIRED."
          },
          {
            code: "402",
            text: "Assinatura sem conformidade nas rotas que verificam essa condição: ERR_SUBSCRIPTION_EXPIRED."
          },
          {
            code: "404",
            text: "Recurso não encontrado ou indisponível para o contexto da requisição."
          },
          {
            code: "429",
            text: "Limite de requisições atingido. Aguarde e respeite os cabeçalhos de limitação recebidos."
          },
          {
            code: "500 / 503",
            text: "Falha de processamento ou dependência indisponível. Antes de repetir um envio, verifique se ele já foi processado."
          }
        ],
        errors:
          "Os erros comuns retornam { error }. A API administrativa da plataforma também pode retornar message e details. OAuth e MCP seguem os formatos dos próprios protocolos.",
        paginationTitle: "A paginação acompanha o recurso",
        pagination: [
          "Contatos: pageNumber na consulta; contacts, count e hasMore na resposta.",
          "Mensagens: nextId e minUpdatedAt; messages, count, ticket, hasMore e nextId na resposta. markAsRead=true também altera o estado de leitura.",
          "Atendimentos: filtros e nextUpdatedAt; tickets e count na resposta. Não presuma hasMore nem o mesmo cursor de mensagens.",
          "Outros módulos: consulte os parâmetros e a resposta da operação. Não existe paginação única para toda a API."
        ]
      },
      events: {
        title: "Eventos e integrações existentes",
        lead: "Além das rotas HTTP, o sistema usa eventos e integrações com provedores. Cada mecanismo tem um propósito próprio.",
        sections: [
          {
            title: "Atualizações em tempo real",
            text: "A aplicação usa Socket.IO para atualizar contatos, mensagens e atendimentos. A conexão é autenticada e trabalha com salas de empresa, usuário, fila e atendimento. Esses eventos fazem parte do funcionamento do aplicativo; não são uma API de webhooks genérica, com garantia de entrega ou reprocessamento."
          },
          {
            title: "Callbacks e webhooks dos provedores",
            text: "As rotas de recebimento Meta e de pagamento estão no catálogo. Elas usam a validação do provedor e não devem ser tratadas como endpoints livres de integração de clientes. A documentação não cria um novo webhook de saída."
          },
          {
            title: "MCP e OAuth presentes no código",
            text: "O backend já contém /mcp, metadados de descoberta e rotas OAuth. A integração é condicionada à habilitação e aos escopos da empresa. Esta referência registra esse estado atual; um futuro MCP pode ser desenvolvido separadamente, sem alterar os contratos aqui documentados."
          },
          {
            title: "Recursos administrativos",
            text: "Plataforma, parceiros, financeiro central e contexto do agente têm credenciais ou permissões próprias. Consulte esses módulos para avaliar a cobertura do sistema; sua presença no catálogo não significa liberação automática ao cliente."
          }
        ]
      }
    }
  }
};
