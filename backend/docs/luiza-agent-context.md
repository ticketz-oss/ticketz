# Contexto do Luiza’s Agent

## Administração

Configurações → Administração → **Luiza’s Agent**. O backend confirma `Users.super` e a empresa do usuário a cada acesso administrativo. O campo no token e a presença do botão não concedem autorização.

Cada empresa possui uma política em `AgentTenantPolicies`: agente ativo, módulos, contexto Markdown do negócio, revisão, autor e situação dos documentos. Empresas novas e políticas ainda inexistentes começam com o agente desativado; a ativação exige uma decisão do super admin no painel. Os módulos começam liberados, mas só podem ser consultados após a ativação do agente. A migration de adoção desse padrão desativa políticas criadas automaticamente, preservando escolhas já salvas por um super admin. O perfil e as visibilidades do usuário continuam limitando os dados. Alterações usam revisão para evitar sobrescrever uma edição concorrente.

## Dados e documentos

`AgentCatalog.ts` mantém tabelas, campos, buscas e módulos explicitamente permitidos. `AgentDataService.ts` é a camada de leitura utilizada pelas ferramentas e pelo gerador de documentos; consultas recebem a identidade autenticada. Não há SQL fornecido pelo modelo. As consultas MCP antigas que liberam toda a empresa não são usadas no chat.

Vinte módulos abrangem atendimentos, chat interno, tarefas, contatos, tags, agendamentos, fluxos, filas, respostas rápidas, informativos, usuários, campanhas, listas, prospecção, conexões, chamadas, relatórios, configurações, financeiro e ajuda do tenant. Campos de autenticação, sessões de WhatsApp, credenciais e payloads financeiros não estão nas projeções. Transcrições existentes de chamadas e textos registrados são consultáveis; não há OCR ou nova transcrição.

O armazenamento privado do backend contém `agent-context/global/ajuda.md` e `agent-context/tenants/<companyId>/`. Em Docker, fica no volume `backend_private`, dentro de `/usr/src/app/private`. O contexto comercial gera `negocio.md`; cada módulo possui documentação e páginas de registros com até 100 registros por arquivo. Consultas com falha produzem cobertura parcial e removem páginas antigas daquela fonte. Bloquear um módulo remove seus arquivos de dados.

Hooks após a confirmação da transação enfileiram atualizações. A reconciliação a cada cinco minutos cobre alterações que não passaram pelos hooks, inclusive SQL executado por outros serviços. Os documentos são retratos datados. As respostas operacionais consultam o banco e conferem novamente as fontes antes da entrega.

Os arquivos completos não são oferecidos ao modelo. A recuperação ao vivo filtra também contagens, buscas e relacionamentos: filas/grupos autorizados nos atendimentos; participação no chat interno, inclusive para admins; atribuições pessoais/filas das tarefas; visibilidade das respostas rápidas, informativos e ajuda. O conteúdo de registros e documentos é informação não confiável, sem autoridade para mudar as regras.

## Sessões e ferramentas

O navegador cria uma sessão opaca em `POST /agent/sessions` e envia apenas `{sessionId, message, requestId}` ao chat. O backend mantém o histórico confiável; não aceita histórico do assistente fornecido pelo navegador. A sessão pertence à empresa e ao usuário. Nova conversa, recarga ou logout iniciam outra sessão. Fechar o painel e navegar pelo aplicativo preservam a conversa na página aberta. O heartbeat renova o prazo de 30 minutos.

Históricos e capacidades ficam no Redis exclusivo `agent-redis`, sem AOF, snapshots ou volume em disco. A fila dos documentos usa o Redis operacional do sistema. Outras implantações devem definir `AGENT_REDIS_URI` apontando para uma instância igualmente temporária. Os registros permanentes de auditoria contêm apenas identificadores, eventos, revisão, módulos e quantidades; não contêm mensagens, contexto comercial ou resultados de ferramentas.

Mudanças na política, perfil, filas, participação e metadados de autorização dos registros invalidam o histórico antigo. Cada consulta de ferramenta recarrega a identidade. Respostas em andamento são descartadas se a autorização ou as fontes mudarem. O fechamento de uma sessão não pode ser desfeito pelo término tardio de uma resposta.

O worker Hermes usa um diretório temporário isolado, identificador exclusivo da conversa e somente seis ferramentas: contexto, registros, métricas, documentação de módulo, ajuda pública e contexto comercial paginado. Memória pessoal, plugins, banco de sessões Hermes, navegador, terminal, arquivos genéricos e ferramentas de escrita ficam desativados. O token temporário é vinculado à sessão/revisão e não pode seguir redirecionamentos.

As fontes da resposta identificam módulo, recurso, instante e ID da consulta. Registros retornam paginação, comprimento dos textos e cobertura. Para recuperar texto longo, consultar o mesmo ID com `offset` de texto; mensagens precisam também de `ticketId` quando o ID for composto. Resultados grandes devem ser filtrados e paginados. Ausência de registros autorizados não prova ausência em toda a empresa.

## Configuração local

O Compose local define `AGENT_REDIS_URI` e `AGENT_TOOLS_BASE_URL=http://localhost:8080`. O callback é executado pelo Hermes no Windows, portanto precisa apontar para o backend acessível pelo Windows. A porta pode ser ajustada por `BACKEND_PORT`.

A ponte utiliza `HERMES_CHAT_URL` e `HERMES_CHAT_BRIDGE_KEY` do arquivo privado `backend/.env.hermes.local`. Nunca versionar esse arquivo. `HERMES_AGENT_TOOLS_URL`, no mesmo arquivo ou ambiente do processo da ponte, deve coincidir com a URL completa do callback; o padrão é `http://localhost:8080/agent/tools`. O launcher PowerShell lê somente as variáveis aprovadas.

`docker compose -f docker-compose-local.yaml up -d --build backend agent-redis` aplica migrations. `scripts/start-local.cjs` executa seeds somente quando não existem usuários. `powershell -File backend/scripts/start-hermes-chat.ps1` inicia a ponte; uma ponte já iniciada precisa de reinício para carregar alterações nos scripts.

Orçamentos: histórico recente de até 12 mensagens e `AGENT_HISTORY_CHAR_BUDGET` (padrão 16 mil caracteres, além de resumo limitado); consultas normalmente retornam até 20 registros; o worker limita chamadas, resultados e tempo total. A velocidade depende do provedor configurado no Hermes. A classificação de assunto e a avaliação de fundamentação são verificações do modelo, sujeitas a falhas; o isolamento de dados é imposto pelo backend e pelo conjunto fechado de ferramentas.

## Validação

Rodar `npx jest --runInBand --coverage=false src/services/AgentServices/__tests__` diretamente, evitando os scripts gerais de migrations/seeds da suíte antiga. Os testes PostgreSQL são opt-in com `AGENT_SECURITY_PG_TEST=true` e conexão de teste configurada; usam tabelas temporárias numa transação e rollback, sem modificar registros reais.

Os testes cobrem IDs, buscas, contagens, cursores, mensagens compostas, recuperação de textos longos, filas/grupos, chats privados, tarefas, bloqueios de módulos, revogação, histórico, autoridade administrativa, sanitização de erros e documentos. Há testes DOM de Settings e AgentPreview e testes Python em `scripts/test-hermes-context-worker.py`. A opção `--live-model` utiliza o provedor real com um callback de dados sintéticos.

Na validação local real, o tenant Empresa 1 respondeu saudação e métricas de contatos/tarefas com fontes conferidas no banco, recusou assunto externo e recusou acesso à empresa 2. Os dados locais desses dois módulos estavam vazios; os testes PostgreSQL exercitam registros distintos e privados de dois tenants.
