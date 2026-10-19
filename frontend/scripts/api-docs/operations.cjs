const string = description => ({ type: "string", description });
const integer = description => ({ type: "integer", description });
const object = (properties, required = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: true
});
const jsonBody = (schema, example) => ({
  required: true,
  content: { "application/json": { schema, ...(example ? { example } : {}) } }
});
const jsonResponse = (description, schema, example) => ({
  description,
  content: { "application/json": { schema, ...(example ? { example } : {}) } }
});
const error = description =>
  jsonResponse(
    description,
    object({ error: string("Código ou mensagem do erro.") }, ["error"])
  );
const failures = {
  401: error("Credencial ausente ou inválida."),
  403: error("Sessão expirada, empresa inativa/suspensa ou acesso negado."),
  default: error("Erro do fluxo ou dos serviços dependentes.")
};
const contact = object({
  id: integer("ID do contato."),
  name: string("Nome."),
  number: string("Número com DDI e DDD, somente dígitos."),
  email: string("E-mail."),
  extraInfo: {
    type: "array",
    items: object({
      id: integer("ID do campo."),
      name: string("Nome do campo."),
      value: string("Valor.")
    })
  }
});
const ticket = object({
  id: integer("ID do atendimento."),
  contactId: integer("ID do contato."),
  userId: integer("Responsável."),
  queueId: integer("Fila."),
  whatsappId: integer("Conexão utilizada."),
  status: string("Estado do atendimento."),
  contact
});
const query = (name, description) => ({
  name,
  in: "query",
  schema: { type: "string" },
  description
});
const sample = (method, route, body) => [
  {
    lang: "Shell",
    label: "cURL",
    source: `curl --request ${method} \\\n  --url 'https://sua-empresa.espacowhats.com.br/backend${route}' \\\n  --header 'Authorization: Bearer SEU_TOKEN_DE_SESSAO'${body ? ` \\\n  --header 'Content-Type: application/json' \\\n  --data '${JSON.stringify(body, null, 2)}'` : ""}`
  }
];
module.exports = {
  "POST /messages/forward": {
    summary: "Encaminhar mensagem",
    description:
      "Encaminha uma mensagem existente para outro contato da mesma empresa. ticketId identifica o atendimento de origem, contactId o destinatário e messageId a mensagem. A fila precisa ser acessível ao usuário. Mensagem, contato e fila devem pertencer à empresa autenticada.",
    requestBody: jsonBody(
      object(
        {
          contactId: integer("Contato de destino."),
          ticketId: integer("Atendimento de origem."),
          messageId: string("Mensagem de origem."),
          queueId: integer("Fila de destino, quando utilizada.")
        },
        ["contactId", "ticketId", "messageId"]
      )
    ),
    responses: {
      200: { description: "Encaminhamento processado; sem corpo." },
      404: error("Mensagem, contato ou fila não encontrados."),
      ...failures
    }
  },
  "POST /messages/edit/:messageId": {
    summary: "Editar mensagem",
    description:
      "Atualiza o texto de uma mensagem conforme as regras do provedor. A implementação de edição rejeita a conexão oficial com ERR_WAPP_OFFICIAL_MODE_NOT_SUPPORTED (400). As versões anteriores ficam no histórico de edição.",
    requestBody: jsonBody(
      object({ body: string("Novo texto da mensagem.") }, ["body"])
    ),
    responses: {
      200: { description: "Mensagem atualizada; sem corpo." },
      400: error("Operação não suportada ou rejeitada pelo provedor."),
      ...failures
    }
  },
  "DELETE /messages/:messageId": {
    summary: "Excluir mensagem",
    description:
      "Solicita a exclusão da mensagem pelo serviço WhatsApp. A operação depende das regras e capacidades da conexão/provedor; não presuma que qualquer mensagem possa ser excluída. Grupos também exigem permissão de acesso.",
    responses: {
      200: { description: "Exclusão processada; sem corpo." },
      ...failures
    }
  },
  "PUT /tickets/:ticketId": {
    summary: "Atualizar ou transferir atendimento",
    description:
      "Atualiza o estado e a atribuição do atendimento. Consulte transfer-options antes de escolher destino. A alteração pode executar chatbot, mensagens de encerramento ou de transferência, conforme as configurações. Grupos em modo de conversa não aceitam esta operação de atendimento.",
    requestBody: jsonBody(
      object({
        status: string("Estado pretendido, conforme as transições permitidas."),
        userId: {
          type: "integer",
          nullable: true,
          description: "Novo responsável."
        },
        queueId: {
          type: "integer",
          nullable: true,
          description: "Fila de destino."
        },
        chatbot: { type: "boolean" },
        queueOptionId: integer("Opção de fila."),
        justClose: {
          type: "boolean",
          description:
            "Solicita encerramento simplificado conforme as regras do serviço."
        },
        whatsappId: integer(
          "Conexão de destino, sujeita à validação da transferência."
        )
      })
    ),
    responses: {
      200: jsonResponse("Atendimento atualizado.", ticket),
      ...failures
    }
  },
  "GET /tickets/:ticketId/templates": {
    summary: "Consultar janela e templates do atendimento",
    description:
      "Informa se a conexão é oficial e o estado da janela de atendimento. A lista de templates é consultada apenas quando a conexão é oficial e a janela está fechada; uma lista vazia com janela aberta não significa ausência de templates na conta.",
    responses: {
      200: jsonResponse(
        "Condição de envio e templates.",
        object({
          official: { type: "boolean" },
          window: {
            type: "object",
            description: "Estado da janela calculado pelo serviço."
          },
          templates: { type: "array", items: { type: "object" } }
        })
      ),
      ...failures
    }
  },
  "POST /auth/login": {
    summary: "Iniciar sessão",
    description:
      "Autentique um usuário da empresa. Informe slug quando necessário para resolver a empresa. Retorna token JWT e usuário, além do cookie HttpOnly jrt usado na renovação. Exemplos são fictícios; não use credenciais no frontend público de uma integração.",
    requestBody: jsonBody(
      object(
        {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          slug: string("Identificador da empresa, quando necessário.")
        },
        ["email", "password"]
      ),
      {
        email: "integracao@example.com",
        password: "SUA_SENHA",
        slug: "sua-empresa"
      }
    ),
    responses: {
      200: jsonResponse(
        "Sessão criada; preserve o cookie jrt.",
        object({
          token: string("JWT de acesso."),
          user: object({
            id: integer("ID."),
            companyId: integer("Empresa."),
            profile: string("Perfil.")
          })
        })
      ),
      ...failures
    }
  },
  "POST /auth/refresh_token": {
    summary: "Renovar sessão",
    description:
      "Requer o cookie HttpOnly jrt retornado pelo login. Renova o JWT e o cookie; o header Bearer sozinho não substitui esse cookie. No navegador use credentials: include somente em origens autorizadas pelo servidor.",
    security: [{ refreshCookie: [] }],
    responses: {
      200: jsonResponse(
        "JWT renovado.",
        object({ token: string("Novo JWT."), user: { type: "object" } })
      ),
      ...failures
    }
  },
  "DELETE /auth/logout": {
    summary: "Encerrar sessão",
    description: "Requer JWT e remove o cookie de renovação jrt da resposta.",
    responses: { 200: { description: "Sessão encerrada." }, ...failures }
  },
  "GET /auth/me": {
    summary: "Consultar usuário da sessão",
    description:
      "Requer JWT no header e cookie jrt válido; o controlador consulta o usuário pelo cookie de renovação.",
    security: [{ sessionBearer: [], refreshCookie: [] }],
    responses: {
      200: jsonResponse(
        "Dados do usuário.",
        object({
          id: integer("ID."),
          profile: string("Perfil."),
          email: string("E-mail."),
          super: { type: "boolean" },
          visibleScreens: { type: "array", items: { type: "string" } }
        })
      ),
      ...failures
    }
  },
  "GET /contacts": {
    summary: "Listar contatos",
    description:
      "Pesquisa paginada e restrita à empresa. Aceita JWT ou token de contatos. A resposta informa hasMore para a próxima página.",
    parameters: [
      query("searchParam", "Pesquisa por contato."),
      query("pageNumber", "Página, começando em 1."),
      query("isGroup", "true para grupos; false para contatos individuais.")
    ],
    responses: {
      200: jsonResponse(
        "Contatos encontrados.",
        object({
          contacts: { type: "array", items: contact },
          count: integer("Total."),
          hasMore: { type: "boolean" }
        })
      ),
      ...failures
    },
    samples: sample("GET", "/contacts?pageNumber=1")
  },
  "POST /contacts": {
    summary: "Cadastrar contato",
    description:
      "Nome e número são obrigatórios. Para contatos individuais, o serviço verifica o número no WhatsApp quando a conexão permite. Envie o número com DDI e DDD e apenas dígitos. Campos adicionais enviados no cadastro de contato individual não devem ser considerados persistidos; use a atualização de contato ou extra-info.",
    requestBody: jsonBody(
      object(
        {
          name: string("Nome do contato."),
          number: {
            type: "string",
            pattern: "^[0-9]+$",
            description: "DDI + DDD + número."
          }
        },
        ["name", "number"]
      ),
      { name: "Contato de exemplo", number: "5568999990000" }
    ),
    responses: {
      200: jsonResponse("Contato cadastrado ou resolvido.", contact),
      ...failures
    },
    samples: sample("POST", "/contacts", {
      name: "Contato de exemplo",
      number: "5568999990000"
    })
  },
  "POST /contacts/findOrInsert": {
    summary: "Localizar ou cadastrar contato",
    description:
      "Resolve um contato por nome e número dentro da empresa, usando o serviço existente de busca/cadastro.",
    requestBody: jsonBody(
      object(
        {
          name: string("Nome."),
          number: string("Número completo com DDI e DDD.")
        },
        ["name", "number"]
      ),
      { name: "Contato de exemplo", number: "5568999990000" }
    ),
    responses: { 200: jsonResponse("Contato resolvido.", contact), ...failures }
  },
  "GET /contacts/:contactId": {
    summary: "Consultar contato",
    description: "Retorna o contato pertencente à empresa autenticada.",
    responses: {
      200: jsonResponse("Contato.", contact),
      404: error("Contato não encontrado."),
      ...failures
    }
  },
  "PUT /contacts/:contactId/extra-info": {
    summary: "Substituir campos adicionais",
    description:
      "Envia a lista completa de campos adicionais desejada. Campos antigos omitidos são removidos. IDs existentes precisam pertencer ao contato e não podem estar duplicados; omita id para criar um novo campo.",
    requestBody: jsonBody(
      object(
        {
          extraInfo: {
            type: "array",
            items: object(
              {
                id: { type: "integer", minimum: 1 },
                name: { type: "string", maxLength: 100 },
                value: { type: "string", maxLength: 255 }
              },
              ["name", "value"]
            )
          }
        },
        ["extraInfo"]
      ),
      { extraInfo: [{ name: "Origem", value: "Site" }] }
    ),
    responses: {
      200: jsonResponse("Contato com campos atualizados.", contact),
      400: error("Lista inválida ou IDs incorretos."),
      404: error("Contato não encontrado."),
      ...failures
    }
  },
  "GET /tickets": {
    summary: "Listar atendimentos",
    description:
      "Retorna tickets e count. Os filtros de filas, etiquetas e usuários são arrays serializados em JSON, por exemplo queueIds=[1,2]. A visibilidade respeita as filas e o perfil do usuário. Esta resposta não usa hasMore.",
    parameters: [
      query("searchParam", "Termo de pesquisa."),
      query(
        "status",
        "Estado do atendimento: open, pending ou closed conforme o fluxo."
      ),
      query("contactId", "ID do contato."),
      query("queueIds", "Array de IDs em JSON."),
      query("tags", "Array de IDs em JSON."),
      query("users", "Array de IDs em JSON."),
      query("nextUpdatedAt", "Marcador de atualização para paginação."),
      query("minUpdatedAt", "Atualizações a partir deste marcador."),
      query(
        "showAll",
        "Solicita todos os atendimentos permitidos; não ignora as permissões."
      ),
      query("groups", "Filtro de grupos conforme o fluxo."),
      query("date", "Filtro de data."),
      query("updatedAt", "Filtro de atualização."),
      query("isSearch", "true ativa pesquisa."),
      query("withUnreadMessages", "Filtro de não lidas."),
      query("notClosed", "A presença de valor não vazio ativa o filtro."),
      query("all", "A presença de valor não vazio ativa o filtro.")
    ],
    responses: {
      200: jsonResponse(
        "Atendimentos encontrados.",
        object({
          tickets: { type: "array", items: ticket },
          count: integer("Quantidade.")
        })
      ),
      402: error("Assinatura não está em conformidade."),
      ...failures
    }
  },
  "POST /tickets": {
    summary: "Abrir atendimento",
    description:
      "Abre o atendimento com a conexão padrão da empresa. O controlador recebe contactId, userId e queueId; não seleciona conexão por whatsappId. Se já houver atendimento aberto para o mesmo responsável, o serviço pode retorná-lo. Outro atendimento aberto pode gerar ERR_OTHER_OPEN_TICKET.",
    requestBody: jsonBody(
      object(
        {
          contactId: integer("Contato da empresa."),
          userId: integer("Responsável pelo atendimento."),
          queueId: integer("Fila, quando utilizada.")
        },
        ["contactId", "userId"]
      ),
      { contactId: 123, userId: 7, queueId: 2 }
    ),
    responses: {
      200: jsonResponse("Atendimento criado ou existente.", ticket),
      402: error("Assinatura não está em conformidade."),
      ...failures
    },
    samples: sample("POST", "/tickets", {
      contactId: 123,
      userId: 7,
      queueId: 2
    })
  },
  "GET /tickets/:ticketId": {
    summary: "Consultar atendimento",
    description:
      "Consulta atendimento da empresa autenticada. Grupos também exigem permissão de acesso ao grupo.",
    responses: {
      200: jsonResponse("Atendimento.", ticket),
      402: error("Assinatura não está em conformidade."),
      ...failures
    }
  },
  "GET /messages/:ticketId": {
    summary: "Consultar mensagens do atendimento",
    description:
      "Consulta mensagens com paginação por nextId. Para marcar como lidas, envie markAsRead=true; a consulta com esse parâmetro tem efeito sobre a leitura do atendimento. Não use pageNumber nesta operação.",
    parameters: [
      query("nextId", "Cursor devolvido pela consulta anterior."),
      query(
        "markAsRead",
        "true marca mensagens como lidas; omita para consultar sem essa ação."
      ),
      query("minUpdatedAt", "Filtro de atualização incremental.")
    ],
    responses: {
      200: jsonResponse(
        "Mensagens e cursor da próxima página.",
        object({
          count: {
            ...integer("Quantidade; pode ser nula na consulta incremental."),
            nullable: true
          },
          messages: { type: "array", items: { type: "object" } },
          ticket,
          hasMore: { type: "boolean" },
          nextId: { type: "string", nullable: true }
        })
      ),
      402: error("Assinatura não está em conformidade."),
      ...failures
    },
    samples: sample("GET", "/messages/456")
  },
  "POST /messages/:ticketId": {
    summary: "Enviar texto ou mídia",
    description:
      "Envia para o contato do atendimento informado. Exige JWT de usuário: token de contatos não autoriza esta rota. Para texto, envie JSON. Para arquivos, use multipart/form-data com um ou mais campos medias e body como legenda; deixe o cliente HTTP definir o boundary. O sucesso retorna HTTP 200 sem corpo, não um objeto com ID. Na conexão oficial, texto livre exige janela de atendimento aberta; janela fechada retorna ERR_META_WINDOW_CLOSED (403). Use templates fora da janela. Não há garantia de idempotência para reenvios.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: object(
            {
              body: string("Texto da mensagem."),
              quotedMsgId: string(
                "ID opcional de mensagem do mesmo atendimento para responder."
              )
            },
            ["body"]
          ),
          example: { body: "Olá! Como podemos ajudar?" }
        },
        "multipart/form-data": {
          schema: object(
            {
              body: string("Legenda."),
              medias: {
                type: "array",
                items: { type: "string", format: "binary" }
              },
              quotedMsgId: string("ID de mensagem para resposta.")
            },
            ["medias"]
          )
        }
      }
    },
    responses: {
      200: {
        description:
          "Envio concluído no fluxo do servidor, sem corpo de resposta. Não equivale à confirmação de leitura pelo destinatário."
      },
      402: error("Assinatura não está em conformidade."),
      ...failures
    },
    samples: [
      ...sample("POST", "/messages/456", { body: "Olá! Como podemos ajudar?" }),
      {
        lang: "JavaScript",
        label: "fetch",
        source:
          "const response = await fetch(`${baseUrl}/messages/456`, {\n  method: 'POST',\n  headers: {\n    Authorization: `Bearer ${token}`,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({ body: 'Olá! Como podemos ajudar?' })\n});\nif (!response.ok) throw new Error(await response.text());\n// HTTP 200 sem corpo: não chame response.json()."
      },
      {
        lang: "Shell",
        label: "Mídia",
        source:
          "curl --request POST \\\n  --url 'https://sua-empresa.espacowhats.com.br/backend/messages/456' \\\n  --header 'Authorization: Bearer SEU_TOKEN_DE_SESSAO' \\\n  --form 'body=Confira o documento' \\\n  --form 'medias=@./documento.pdf'"
      }
    ]
  },
  "POST /messages/:ticketId/template": {
    summary: "Enviar template do WhatsApp oficial",
    description:
      "Envia template pela conexão oficial. Consulte primeiro os templates do atendimento. Templates não são enviados a grupos. A aprovação, idioma e parâmetros precisam corresponder ao template disponível.",
    requestBody: jsonBody(
      object(
        {
          name: string("Nome do template."),
          language: string("Código do idioma, por exemplo pt_BR."),
          parameters: {
            type: "array",
            items: { type: "string" },
            description:
              "Valores na ordem esperada pelo template; consulte os templates da conexão."
          }
        },
        ["name"]
      )
    ),
    responses: {
      200: { description: "Template enviado; resposta sem corpo." },
      400: error("Template inválido ou atendimento de grupo."),
      ...failures
    }
  },
  "POST /messages/react/:messageId": {
    summary: "Reagir a uma mensagem",
    description:
      "Adiciona ou remove a reação de acordo com a conexão e mensagem do atendimento.",
    requestBody: jsonBody(
      object(
        {
          ticketId: integer("Atendimento da mensagem."),
          emoji: string(
            "Emoji da reação; string vazia para remoção conforme o provedor."
          )
        },
        ["ticketId", "emoji"]
      )
    ),
    responses: {
      200: { description: "Reação processada; sem corpo." },
      ...failures
    }
  },
  "GET /messages/:messageId/history": {
    summary: "Consultar histórico de edição",
    description:
      "Retorna as versões anteriores da mensagem, em ordem de criação. A mensagem deve pertencer à empresa; grupos exigem acesso ao grupo.",
    responses: {
      200: jsonResponse(
        "Versões anteriores.",
        object({ oldMessages: { type: "array", items: { type: "object" } } })
      ),
      404: error("Mensagem não encontrada."),
      ...failures
    }
  },
  "GET /api/platform/v1/health": {
    summary: "Consultar saúde da plataforma",
    description:
      "Endpoint de saúde do serviço. Não autentica um usuário nem concede acesso às operações administrativas.",
    responses: {
      200: jsonResponse(
        "Serviço disponível.",
        object({ status: string("Estado do serviço.") }),
        { status: "ok" }
      )
    }
  },
  "POST /mcp": {
    summary: "Enviar requisição ao MCP existente",
    description:
      "Endpoint HTTP já implementado para JSON-RPC/MCP. Exige token OAuth com escopos compatíveis com a ferramenta. Não aceita o JWT comum como substituto. A disponibilidade depende da configuração e habilitação atuais. Consulte descoberta e OAuth antes de integrar; esta publicação não cria um novo servidor MCP.",
    requestBody: jsonBody(
      object(
        {
          jsonrpc: { type: "string", enum: ["2.0"] },
          id: { oneOf: [{ type: "string" }, { type: "number" }] },
          method: string("Método MCP/JSON-RPC."),
          params: { type: "object" }
        },
        ["jsonrpc", "method"]
      )
    ),
    responses: {
      200: {
        description:
          "Resposta do transporte MCP; o formato segue o protocolo e a operação."
      },
      401: error("Token OAuth ausente ou inválido."),
      403: error("Escopo insuficiente."),
      default: { description: "Erro do protocolo ou da configuração." }
    }
  }
};
