# Deploy do Espaço Whats no Dokploy

O ambiente de produção do Dokploy acompanha a branch `deploy`, nunca a branch
`main` diretamente. O workflow `Validate production candidate` executa os
testes e builds de backend e frontend e valida o Compose. Ele não altera a
branch de produção. A liberação é feita separadamente pelo workflow manual
`Release validated candidate to Dokploy`, que aceita somente o HEAD já validado
de `main`.

## Garantias do deploy

- PostgreSQL, Redis, uploads públicos e arquivos privados usam volumes
  persistentes.
- Backend e frontend têm health checks e atualização `start-first`.
- Uma atualização que não ficar saudável aciona rollback do serviço.
- Segredos ficam no ambiente do Compose no Dokploy e não são versionados.
- O domínio oficial não faz parte desta etapa. O ambiente começa em um hostname
  técnico temporário.

## Fluxo normal

1. Envie o commit para `main` e conclua backups, testes e builds.
2. Aguarde `Validate production candidate` terminar com sucesso para o HEAD de
   `main`.
3. O executor dispara `Release validated candidate to Dokploy`, informando o
   SHA completo.
4. O workflow avança `deploy`; o Dokploy mantém a versão anterior atendendo
   enquanto a nova passa pelo health check.
5. Depois de backend e frontend saudáveis, o executor realiza a ativação
   transacional específica da versão, dentro do container do backend:

   ```sh
   npm run groups:activate -- <sha-completo>
   ```

6. No checkpoint posterior ao deploy, havendo risco, a branch `deploy` volta ao
   SHA anterior e as configurações são restauradas com:

   ```sh
   npm run groups:rollback -- <sha-completo>
   ```

7. Ao encerrar o release, não pode existir build, migração, reinício ou deploy
   em andamento. A versão nova deve estar saudável ou o rollback deve ter
   terminado.

Se qualquer verificação falhar, `deploy` não é alterada e nenhuma implantação é
iniciada.

## Banco de dados

O backend executa migrações Sequelize durante a inicialização. Migrações já
publicadas não devem ser editadas; mudanças de schema devem ser aditivas e
compatíveis com a versão anterior, porque ela permanece ativa até a nova ficar
saudável.

A ativação dos grupos registra em `GroupSettingSnapshots` os valores anteriores
de `CheckMsgIsGroup`, `groupsTab` e `soundGroupNotifications`. O som nunca é
alterado pela ativação. Use o mesmo identificador (o SHA completo) na ativação e
no rollback.

Antes da primeira carga, restaure o dump com `--no-owner --no-acl`. Depois da
restauração, inicie o backend para aplicar somente as migrações ainda pendentes.

## Validação operacional

- `GET /backend/api/platform/v1/health` deve retornar `status: ok`.
- A página inicial e o login devem responder pelo hostname técnico.
- O tenant `Teste` deve abrir no hostname técnico com o prefixo `teste.`.
- A aba Grupos deve receber uma mensagem real, permitir resposta e preservar o
  isolamento entre dois usuários de filas diferentes.
- A conversão Conversa → Atendimento → Conversa deve preservar as mensagens e
  criar/encerrar o tracking somente no trecho de atendimento.
- PostgreSQL e Redis não devem publicar portas diretamente na internet.
