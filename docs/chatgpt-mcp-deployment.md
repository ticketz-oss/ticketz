# ChatGPT MCP — implantação e breaking change

## Antes do deploy

Esta versão remove, sem endpoint substituto de escrita no MVP:

- `POST /api/messages/send`;
- o Bearer token armazenado em `Whatsapps.token`;
- a fila Bull `MessageQueue` usada exclusivamente por esse endpoint.

Execute no banco de produção e registre o resultado no chamado de implantação:

```sql
SELECT w.id, w.name, w."companyId", c.name AS company
FROM "Whatsapps" w
JOIN "Companies" c ON c.id = w."companyId"
WHERE NULLIF(BTRIM(w.token), '') IS NOT NULL
ORDER BY w."companyId", w.id;
```

Cada linha representa uma integração externa potencialmente afetada. Avise os clientes encontrados e confirme explicitamente a janela antes de executar as migrações. A migração `20260813020000-remove-legacy-whatsapp-api-token` apaga a coluna e não preserva os tokens.

Relatório executado em 13/08/2026 antes da publicação inicial:

- 2 conexões afetadas;
- conexão 3, tenant 1;
- conexão 2, tenant 2;
- nenhum token ou outro segredo foi registrado neste documento.

O deploy foi autorizado pelo responsável do projeto junto com o pedido explícito de commit e push. Esse registro não substitui o aviso aos dois clientes afetados.

## Variáveis obrigatórias

Em produção, configure:

- `MCP_BASE_URL=https://mcp.seu-dominio` (resource, issuer e origem do endpoint `/mcp`);
- `MCP_PRIVATE_KEY` em PEM PKCS#8, podendo usar `\n` literais;
- `MCP_PUBLIC_KEY` em PEM SPKI, podendo usar `\n` literais;
- `MCP_KEY_ID` estável;
- `MCP_CURSOR_SECRET` aleatório e estável;
- `MCP_TIMEZONE` (padrão: `America/Rio_Branco`);
- `FRONTEND_URL` com a origem pública da interface Ticketz.

Gere o par RSA fora do servidor de aplicação e armazene-o nos secrets do Railway:

```sh
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out mcp-private.pem
openssl rsa -pubout -in mcp-private.pem -out mcp-public.pem
```

O backend recusa iniciar em produção sem as duas chaves. Não há chave da OpenAI nesta integração.

## Piloto

O piloto nasce desabilitado por tenant. Um superadministrador habilita a configuração protegida `_mcpEnabled` pelo endpoint administrativo. Habilite somente os dois tenants aprovados após concluir o checklist jurídico do plano.

```http
PUT /chatgpt/pilot/:companyId
Authorization: Bearer <JWT do superadministrador>
Content-Type: application/json

{"enabled":true}
```

Use a URL exibida em **Administração → ChatGPT** para criar uma integração Draft no Developer Mode. Valide discovery, OAuth e ferramentas primeiro no MCP Inspector e depois no ChatGPT.

## Dados expostos ao ChatGPT

As ferramentas de leitura continuam nos dois escopos já concedidos
(`conversations:read` e `reports:read`). As respostas rápidas trouxeram
`quick_messages:read` e `quick_messages:write`, e os agendamentos trazem agora
`schedules:write`:

| Ferramenta | Escopo | Conteúdo |
| --- | --- | --- |
| `get_espaco_whats_context` | `conversations:read` | Tenant, atendentes, filas, tags, datas comemorativas, variáveis de agendamento, limites e capacidades |
| `get_conversation_stats` | `reports:read` | Agregados determinísticos de conversas e mensagens |
| `get_attendant_metrics` | `reports:read` | Volume, avaliação, espera e atendimento por atendente |
| `list_conversations` | `conversations:read` | Metadados das conversas, incluindo apelido, aniversário e idioma do contato |
| `list_contacts` | `conversations:read` | Diretório de contatos com apelido, aniversário (dia/mês), idioma, tags e campos personalizados |
| `list_schedules` | `conversations:read` | Agendamentos únicos, de aniversário e de data comemorativa, com público, próxima ocorrência, modelo de mensagem e contadores de entrega |
| `read_conversation` / `read_conversations` | `conversations:read` | Texto das mensagens, notas internas e dados do contato |
| `list_quick_messages` | `quick_messages:read` | Respostas rápidas visíveis ao usuário conectado, com atalho, texto e dono |
| `create_quick_message` | `quick_messages:write` | **Escrita.** Cria uma resposta rápida em nome do usuário conectado |
| `update_quick_message` | `quick_messages:write` | **Escrita.** Edita o atalho e/ou o texto de uma resposta rápida existente |
| `preview_schedule` | `conversations:read` | Simulação de agendamento: elegíveis, excluídos, variáveis vazias, próxima ocorrência, aviso de data passada e mensagem renderizada. Nada é gravado |
| `create_schedule` | `schedules:write` | **Escrita.** Cria um agendamento `ONCE`, `BIRTHDAY` ou `COMMEMORATIVE` em nome do usuário conectado |
| `update_schedule` | `schedules:write` | **Escrita.** Edita texto, data/hora, fuso ou público de um agendamento existente |

O aniversário do contato guarda apenas dia e mês, então as respostas nunca
permitem inferir idade ou ano. A auditoria não registra o texto livre dos
filtros `contact` e `search`, nem o campo `message` das respostas rápidas, nem o
campo `body` dos agendamentos, mantendo nome, telefone, e-mail e conteúdo fora
dos registros.

`preview_schedule` fica em `conversations:read` de propósito: simular não grava
nada, e exigir escopo de escrita para uma prévia inverteria o menor privilégio.
Uma conexão só de leitura já criada passa a enxergar a simulação, mas continua
sem `create_schedule` e sem `update_schedule`.

## Escrita de respostas rápidas

Uma resposta rápida é um modelo de texto que o atendente dispara depois pelo
atalho `/` no chat: criá-la **não envia mensagem para ninguém**. Não existe
ferramenta de exclusão — remover continua sendo ação do usuário na tela.

Limites da escrita, todos herdados do que já valia na interface:

- só administradores conectam o ChatGPT (`validateAccessToken` exige
  `profile === "admin"`), então só administradores escrevem;
- a escrita alcança exatamente o que `list_quick_messages` enxerga, que é o
  mesmo `FindService` da tela — com a configuração `quickMessages` em
  `individual` (padrão), apenas as respostas do próprio usuário;
- `update_quick_message` preserva o dono original do registro;
- atalho é normalizado (sem a `/` inicial), não aceita espaços e não pode
  repetir um atalho já visível, porque a tabela não tem índice único;
- o registro nasce com `companyId` e `userId` vindos do grant, nunca do payload.

## Escrita de agendamentos

Um agendamento programa um envio futuro de WhatsApp: criá-lo **não dispara nada
na hora**. A entrega continua sob o `ScheduleMonitor` e a cadência anti-bloqueio
do tenant, exatamente como um agendamento criado na tela.

As três ferramentas são cascas finas sobre os mesmos serviços de domínio que a
tela e o REST usam (`ScheduleServices/CreateService`, `UpdateService`,
`ShowService` e o novo `PreviewService`, extraído de `ScheduleController.preview`
para que a prévia da tela e a do ChatGPT nunca divirjam). Nenhuma regra de
audiência, recorrência ou variável foi reescrita na camada MCP.

Limites e invariantes:

- só administradores conectam o ChatGPT (`validateAccessToken` exige
  `profile === "admin"`), então só administradores escrevem;
- `companyId` e `userId` vêm sempre do grant, nunca do argumento da ferramenta;
- `contact_ids` de outro tenant são **recusados** com
  `ERR_SCHEDULE_INVALID_RECIPIENT` — o `resolveAudience` compara a contagem de
  contatos elegíveis encontrados com a pedida;
- máximo de 100 contatos por chamada no modo `SELECTED`
  (`ERR_SCHEDULE_TOO_MANY_RECIPIENTS`) e 5.000 caracteres de texto
  (`ERR_SCHEDULE_MESSAGE_TOO_LONG`); o mínimo de 5 caracteres e a checagem de
  variáveis Mustache continuam sendo do domínio;
- fuso padrão é o configurado em **Agendamentos** do tenant
  (`Company.schedules.timezone`), com `MCP_TIMEZONE` como último recurso;
- **mídia não é exposta**: o modelo não envia nem recebe `mediaPath`, então não
  há como referenciar arquivo do servidor. Uma edição preserva a mídia que já
  estava no agendamento;
- **data no passado não é recusada.** O domínio aceita, a tela aceita, e o MCP
  aceita: `preview_schedule` devolve `isInPast: true` como aviso para o modelo
  repassar ao usuário. Recusar só aqui faria o ChatGPT divergir da agenda;
- o evento de socket vai para a sala do tenant
  (`company-<id>-mainchannel`), então a tela `/schedules` aberta atualiza na
  hora e o texto do agendamento não vaza para outros clientes;
- **não existe exclusão, pausa nem disparo antecipado pelo MCP.** Excluir e
  antecipar ficaram fora por decisão de produto; pausar não existe no domínio
  (o `UpdateService` grava `active: true` em toda edição e não há rota de
  pausa), então a ferramenta não oferece `active` para não prometer algo que o
  sistema não faz. Interromper um agendamento continua sendo exclusão na tela.

Editar um agendamento reconstrói as entregas pendentes e zera os contadores,
igual ao `PUT /schedules/:id` da tela. Um agendamento `ONCE` que já começou a
enviar não pode ser alterado (`ERR_SCHEDULE_ALREADY_STARTED`).

Erros estruturados que o modelo pode receber e repassar: `ERR_SCHEDULE_INVALID_MESSAGE`,
`ERR_SCHEDULE_MESSAGE_TOO_LONG`, `ERR_SCHEDULE_UNKNOWN_VARIABLE`,
`ERR_SCHEDULE_INVALID_DATE`, `ERR_SCHEDULE_DATE_REQUIRED`,
`ERR_SCHEDULE_TIME_REQUIRED`, `ERR_SCHEDULE_INVALID_TIME`,
`ERR_SCHEDULE_INVALID_TIMEZONE`, `ERR_SCHEDULE_INVALID_KIND`,
`ERR_SCHEDULE_INVALID_AUDIENCE`, `ERR_SCHEDULE_RECIPIENT_REQUIRED`,
`ERR_SCHEDULE_INVALID_RECIPIENT`, `ERR_SCHEDULE_TOO_MANY_RECIPIENTS`,
`ERR_SCHEDULE_NO_ELIGIBLE_RECIPIENTS`, `ERR_SCHEDULE_NOTHING_TO_UPDATE`,
`ERR_SCHEDULE_FIELD_NOT_APPLICABLE`, `ERR_SCHEDULE_ALREADY_STARTED`,
`ERR_COMMEMORATIVE_DATE_NOT_FOUND` e `ERR_NO_SCHEDULE_FOUND`.

### Erros das ferramentas

Um erro de domínio volta como resultado MCP com `isError: true`, o código curto
em `content[0].text` (ex.: `ERR_SCHEDULE_INVALID_RECIPIENT`) e o mesmo código em
`structuredContent.result.error` com o status HTTP. Vale para **todas** as
ferramentas, não só as de agendamento: a normalização está no `registerTool`.
Antes disso o cliente recebia `"[object Object]"`, porque o `AppError` do projeto
não estende `Error` e o SDK serializava o objeto lançado com `String()`.

O envelope fica sob a chave `result` de propósito: o cliente do SDK valida
`structuredContent` contra o `outputSchema` da ferramenta mesmo quando `isError`
é `true`, e um envelope fora do schema faria o cliente levantar erro de
protocolo, perdendo o código. Erro inesperado (bug, falha de banco) continua
subindo como falha genérica — não recebe código de domínio.

### Reconexão obrigatória

Escopo novo não é concedido retroativamente: os grants existentes guardam
apenas os escopos aprovados na hora do consentimento. Uma conexão criada antes
desta versão continua funcionando normalmente para leitura e **não precisa ser
revogada**, mas as ferramentas de escrita nem sequer aparecem no `tools/list`
dela — o registro é filtrado pelos escopos do grant, para não oferecer ao modelo
uma ferramenta que sempre falharia. `list_schedules` e `preview_schedule` seguem
em `conversations:read` e continuam disponíveis nas conexões antigas.

Para liberar a escrita, reautorize o conector em **ChatGPT → Configurações →
Conectores → Espaço Whats**, refazendo o login (slug do tenant, e-mail e senha)
na tela de consentimento. Nenhuma variável de ambiente muda nesta versão.

Escrita só é concedida quando o cliente **pede explicitamente** o escopo no
`/authorize`. Um cliente que omite o parâmetro `scope` recebe apenas os escopos
de leitura (`conversations:read`, `reports:read`, `quick_messages:read`), nunca
`quick_messages:write` nem `schedules:write` — antes o padrão era conceder tudo o
que o servidor suporta, então quem não pedia escrita saía do consentimento
podendo gravar. O `scopes_supported` da descoberta continua anunciando todos os
escopos, que é como o cliente sabe o que pode pedir.

## Retenção de auditoria

Agende diariamente no Postgres:

```sql
SELECT delete_expired_mcp_audits();
```

Isso aplica a retenção padrão de 90 dias. A auditoria não contém texto de conversa, prompt, nome, telefone, e-mail ou tokens.
