# Espaço Whats

Plugin oficial do Espaço Whats para ChatGPT e Codex. O pacote referencia o app
`asdk_app_6a7f43d763d8819194733163f90a8d7b`, conectado ao servidor MCP público em
`https://espacowhats.com.br/backend/mcp` com autenticação OAuth.

## Instalação pelo GitHub

Administradores de workspace podem importar este marketplace em **Configurações
do workspace → Plugins → Adicionar → Importar marketplace**:

- repositório: `https://github.com/GuiZeroUm/ticketz`;
- caminho: deixe em branco;
- branch: `main`.

Depois da importação, abra **Espaço Whats**, instale o plugin e selecione
**Conectar**. O login e o consentimento acontecem no próprio Espaço Whats.

## Segurança

O plugin não armazena chave da OpenAI. O acesso respeita o tenant, o usuário
administrador conectado e os escopos aprovados. Ações de escrita continuam
sujeitas às confirmações implementadas pelo servidor MCP.
