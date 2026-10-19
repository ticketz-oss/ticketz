# Arquitetura de customizações da AC Norte

Status: fundação Git/Dokploy em implementação incremental.

## Decisão

Usar uma arquitetura híbrida:

1. `main` continua sendo a fonte do produto compartilhado e recebe redesigns,
   correções e capacidades que podem beneficiar mais de um cliente.
2. Integrações com APIs externas, automações e workers exclusivos da AC Norte
   ficam em um serviço isolado, com deploy, banco operacional, Redis, segredos e
   observabilidade próprios.
3. Mudanças que precisam entrar no backend ou frontend do Ticketz ficam em
   módulos explícitos da AC Norte e são protegidas por um gate de servidor e um
   setting do tenant. O backend é sempre a autoridade; ocultar uma tela no
   frontend não é autorização.
4. A branch longa `acnorte` existe como camada fina sobre `main`, mas
   somente para código que realmente não pode viver no produto compartilhado.
   Produção acompanha uma branch de promoção separada, `acnorte-deploy`, e nunca
   a branch de desenvolvimento diretamente.
5. Uma stack Ticketz totalmente dedicada só deve ser criada quando houver uma
   necessidade concreta de divergência de runtime ou isolamento de dados. Ela
   exige migrar o tenant para PostgreSQL, Redis e volumes próprios antes de
   executar o backend customizado.

## Por que a branch isolada não basta

O backend atual carrega todas as empresas na inicialização, inicia todas as
sessões de WhatsApp e executa filas e rotinas que consultam múltiplas empresas.
O Compose de produção possui um único PostgreSQL, Redis e conjunto de volumes.
Dois backends de branches diferentes apontando para essa mesma infraestrutura
disputariam sessões, jobs, migrations e efeitos externos de todos os tenants.

Consequentemente, é proibido conectar uma implantação `acnorte` ao banco, Redis
ou volumes da produção multi-tenant atual. Isolamento de código sem isolamento
de dados e workers é apenas aparente.

## Topologia recomendada agora

```text
main/deploy -> Ticketz compartilhado -> tenant acnorte atual
                       |
                       | webhooks assinados / API com escopo do tenant
                       v
              acnorte-automations
              - APIs de terceiros
              - jobs e agendamentos
              - idempotência e outbox
              - banco/Redis próprios
              - segredos próprios
```

O serviço `acnorte-automations` não recebe `PLATFORM_API_KEY`, porque essa chave
tem alcance de plataforma. A integração deve usar uma credencial de serviço com
escopos e `companyId` imutáveis. Enquanto essa credencial não existir, o serviço
deve limitar-se a receber eventos assinados e não pode acessar diretamente o
banco do Ticketz.

O projeto já contém bons precedentes que devem ser reutilizados:

- `Setting` por `companyId` para o switch administrável;
- allowlist imutável de servidor para recursos experimentais;
- webhook com HMAC, `X-Event-Id`, timestamp, retry e outbox;
- middleware de idempotência para mutações;
- auditoria com remoção de conteúdo sensível;
- serviço WaCalls separado e acessível apenas pela rede privada.

Para cada capacidade exclusiva, a autorização deve exigir simultaneamente:

```text
edição AC Norte no runtime
AND tenant allowlisted no servidor
AND setting do tenant habilitado
AND tenant ativo
```

Nenhuma API deve aceitar `companyId` vindo do cliente quando ele puder ser
derivado da credencial autenticada.

## Organização do código

Quando houver código dentro do Ticketz, manter o limite visível:

```text
backend/src/tenants/acnorte/
  access/
  routes/
  services/
  integrations/

frontend/src/tenants/acnorte/
  routes.js
  menu.js
  pages/

acnorte-automations/       # pacote independente ou, preferencialmente, repo próprio
  src/connectors/
  src/jobs/
  src/webhooks/
```

Regras:

- código compartilhado não importa módulos de tenant diretamente; usa uma
  interface/registro de extensões;
- módulos AC Norte podem importar o núcleo compartilhado;
- migrations de schema continuam globais, aditivas e compatíveis com rollback;
- dados iniciais exclusivos usam seed/ativação idempotente filtrada pelo slug,
  nunca um seeder global que afete novos tenants;
- segredos não ficam em `Settings`, Git, imagens ou logs;
- toda tabela nova que armazenar dados do cliente possui `companyId`, índices e
  testes de isolamento.

## Política Git

```text
upstream -> main -> acnorte -> acnorte-deploy
              \-> deploy
```

- Tudo que for genérico entra primeiro em `main`.
- `main` é mesclada em `acnorte` por merge commit após cada release global. Não
  fazer rebase/force-push da branch longa.
- Commits exclusivos usam prefixo de escopo, por exemplo
  `feat(acnorte): ...`.
- PRs de `acnorte` para `main` são proibidos por padrão; uma melhoria só volta
  ao produto depois de ser generalizada e ter removidas regras e nomes do
  cliente.
- CI de `acnorte` executa a suíte global e testes específicos do tenant.
- `acnorte-deploy` só avança para o HEAD validado de `acnorte`, seguindo o mesmo
  modelo atual `main` -> `deploy`.
- O Dokploy de homologação acompanha `acnorte`; o de produção acompanha
  `acnorte-deploy`. Auto-deploy direto de `acnorte` em produção é proibido.

Branches longas acumulam conflitos. O objetivo arquitetural é manter o delta de
`acnorte` pequeno; integrações e automações devem permanecer no serviço isolado.

## Ambientes Dokploy

| Ambiente                   | Branch             | Dados                                    | Domínio                    | Deploy             |
| -------------------------- | ------------------ | ---------------------------------------- | -------------------------- | ------------------ |
| AC Norte dev               | `acnorte`          | sintéticos                               | hostname técnico           | automático após CI |
| AC Norte staging           | candidato validado | cópia anonimizada ou conjunto controlado | hostname técnico protegido | manual             |
| AC Norte produção dedicada | `acnorte-deploy`   | somente AC Norte                         | host exato                 | promoção manual    |

Cada ambiente usa nomes de projeto, redes, PostgreSQL, Redis, volumes e arquivos
de segredo distintos. Ativar o isolamento de deployments do Dokploy. O host
exato da AC Norte deve ter prioridade sobre o wildcard da plataforma somente no
momento do cutover.

Segredos ficam em variáveis do ambiente ou provedor de secrets do Dokploy. Não
usar caminhos compartilhados como `/etc/dokploy/secrets/espaco_whats_*.env` para
o novo serviço; adotar um namespace próprio, por exemplo `acnorte_*`.

## Quando criar uma stack Ticketz dedicada

Criar a stack completa apenas se uma destas condições ocorrer:

- o frontend ou backend precisar de comportamento incompatível com outros
  tenants;
- houver exigência contratual de banco/backup isolado;
- automações precisarem de cadência ou recursos que prejudiquem a plataforma;
- releases da AC Norte precisarem de janela independente;
- o delta exclusivo continuar crescendo apesar da separação do worker.

A stack dedicada precisa de:

- inventário de todas as tabelas e arquivos relacionados ao `companyId`;
- exportador/importador transacional e repetível;
- reconciliação de IDs, sequências e chaves estrangeiras;
- migração dos uploads públicos, arquivos privados e sessão do WhatsApp;
- Redis novo sem copiar locks/jobs antigos;
- ensaio de restore, reconexão e rollback;
- janela de congelamento de escrita;
- validação de contagens e amostras antes de trocar o DNS/Traefik;
- plano para retornar o host ao wildcard se o health check falhar.

Clonar o banco inteiro e apagar os outros tenants não é um procedimento
aceitável: replica dados e segredos de terceiros para um ambiente que não
precisa deles.

## Fases

### Fase 1 — fundação sem migração

1. Confirmar o `id`, slug e domínio atual da AC Norte.
2. Criar o inventário das primeiras integrações e seus eventos.
3. Definir a credencial de serviço tenant-scoped.
4. Criar `acnorte-automations` e seu ambiente dev isolado.
5. Adicionar gates e contratos genéricos mínimos no `main`.
6. Manter `acnorte` sem divergência funcional até existir o primeiro delta
   inevitavelmente exclusivo.

### Fase 2 — fluxo de release

1. Adicionar CI para `acnorte` e testes de isolamento.
2. Criar a promoção manual para `acnorte-deploy`.
3. Criar projetos dev/staging no Dokploy com recursos e segredos próprios.
4. Automatizar PR de atualização `main` -> `acnorte` e bloquear promoção quando
   a branch estiver atrasada em relação ao último release global aprovado.

### Fase 3 — produção

Começar com o worker exclusivo conectado por contratos seguros ao tenant ainda
na plataforma compartilhada. Avaliar a stack completa dedicada somente depois
de medir o delta, a carga e a necessidade de isolamento. Se for necessária,
executar primeiro um ensaio completo de exportação/importação e rollback.

## Gates de aceite

- Um token AC Norte não lê nem altera dados de outro `companyId`.
- Desabilitar o setting ou remover a allowlist interrompe a feature sem deploy.
- Repetir webhook/job não duplica efeitos externos.
- Falha da API externa não bloqueia tickets, mensagens nem inicialização do
  Ticketz.
- Segredos e payloads pessoais não aparecem em logs, auditoria ou banco global.
- A branch `acnorte` contém o último release global aprovado antes de promover.
- Backup e restore de cada datastore foram exercitados.
- Rollback não depende de desfazer migration destrutiva.
- O source link exigido pela AGPL continua acessível na edição AC Norte.

## Pendências antes de alterar produção

- Ler no Dokploy/Hostinger os projetos, branches, domínios, redes, volumes e
  backups realmente ativos.
- Confirmar o tenant AC Norte no ambiente de produção e seu volume de dados.
- Definir a primeira integração concreta, seus escopos e efeitos externos.
- Decidir se a AC Norte exige isolamento contratual de dados desde o primeiro
  release ou se o worker isolado atende a necessidade inicial.
