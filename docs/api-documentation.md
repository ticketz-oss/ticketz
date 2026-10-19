# Portal público de documentação

## Superfícies e direção

`/documentacao` é um guia em modo de leitura, com navegação lateral, sequência interativa de autenticação → contato → atendimento → mensagem, exemplos copiáveis, mapa de módulos e catálogo pesquisável. `/api` é a referência OpenAPI usando Redoc 2, compatível com React 17; abre Mensagens por padrão e permite escolher qualquer módulo ou todos. Links de operações preservam módulo e âncora.

A identidade deriva da landing existente: azul #0000ff, acento #39ace7, Roboto, superfícies #f6f8fb e texto #161d27. O tema escuro da documentação é uma preferência própria. O primeiro viewport prioriza orientação e a sequência real de integração, com exemplos explícitos; sem efeitos de cena que atrapalhem a leitura. No celular, navegação recolhível e sequência em duas colunas.

As duas páginas carregam publicamente antes da sondagem de saúde/autenticação do aplicativo. Não dependem de login, de JWT ou da configuração de uma empresa para leitura. Nenhuma chamada operacional é executada pelo portal. Links na landing tornam as páginas encontráveis. Fonte AGPL permanece acessível.

## Identidade observada na implementação

Registro de código em 13/10/2026, comparando `frontend/src/pages/Documentation` com `frontend/src/pages/LandingPage`. Esta entrega estende a identidade pública existente; as medidas abaixo descrevem esta superfície de documentação e não instituem um novo sistema visual. A conferência deste registro não incluiu navegador ou estilos computados.

| Aspecto | Evidência herdada | Adaptação do portal |
| --- | --- | --- |
| Marca e cor | `LandingPage/styles.css` e `Documentation/styles.css` declaram azul principal `#0000ff`, texto `#161d27`, texto secundário `#576574`, linhas `#dce3eb`, superfície `#f6f8fb` e papel branco. Os dois `index.js` usam `branding/espaco-whats-icon.png` e a assinatura EspaçoWhats. | A documentação conserva os valores claros padrão. O acento `#39ace7` está declarado nos dois CSS, mas não tem aplicação visual própria no CSS do portal. |
| Tipografia | As duas superfícies usam `Roboto, Arial, sans-serif`; a assinatura mantém 19px e diferencia os pesos de Espaço e Whats. | O guia usa corpo de 15px/1.7, título principal `clamp(30px, 3.2vw, 46px)` com peso 600, títulos de seção de 23px e subtítulos de 16px. Exemplos usam Consolas/Courier New. `ApiReference.js` aplica Roboto e Consolas também ao Redoc. |
| Superfícies e forma | O cabeçalho fixo durante a rolagem, as linhas discretas e as superfícies claras continuam a linguagem da landing. | A leitura usa separadores e fundos tonais, sem sombras declaradas no CSS do portal. Botões e buscas têm raio de 9px; notas e exemplos, 12px. São formas locais: o botão promocional da landing continua com raio de 40px. |
| Composição | A marca e a navegação permanecem no topo; o conteúdo mantém links para login, apresentação pública e código-fonte. | O guia tem colunas de 248px, conteúdo até 850px e contexto de 160–210px, com cabeçalho de 76px. A introdução conduz ao fluxo autenticação → contato → atendimento → mensagem. O catálogo apresenta operações em linhas e filtros; os blocos escuros separam exemplos copiáveis da prosa. |
| Responsividade | A landing já adapta navegação e conteúdo por largura; o portal preserva esse princípio. | Em 1250px, o contexto lateral desaparece; em 850px, o fluxo passa a duas colunas; em 620px, a navegação lateral fica recolhível e o conteúdo ocupa uma coluna. Os pontos de quebra próprios do Redoc permanecem configurados em `ApiReference.js`. |
| Estados e movimento | Ambas as superfícies têm link para pular ao conteúdo e contorno de foco de 3px na cor principal. | O guia usa `aria-current`, abas operáveis por setas/Home/End, aviso de cópia e estados de carga/erro. O foco tem afastamento de 4px. Apenas as mudanças de cor e borda do fluxo recebem transição de 160ms quando `prefers-reduced-motion` permite. |

**Regra de continuidade.** Manter marca, família tipográfica e papéis da paleta ao acrescentar capítulos; usar a densidade da documentação para leitura, filtros e exemplos. A composição promocional da landing não é um molde de página técnica.

**Regra de evidência.** Documentar valores e comportamentos presentes no código. Uma intenção ou um valor declarado sem uso não estabelece um padrão para futuras superfícies.

O tema escuro é uma preferência local persistida em `documentation-theme`: papel `#142236`, superfície `#101c2b`, texto `#edf2f9` e azul principal `#91bdff`. Os exemplos mantêm fundo `#101e32` nos dois temas. A referência Redoc usa ajustes próprios, inclusive azul `#80b8ff` para links no tema escuro; suas abas selecionadas definem texto `#101e32` sobre fundo `#e2ecff` para manter contraste nos dois temas. Esses valores pertencem à integração da biblioteca e não substituem a paleta global.

Nos metadados de schema, títulos `h5`, seus ícones e setas usam a cor de texto secundário do tema; as bordas usam a cor de linha. Rótulos de campos obrigatórios usam `#ff9ba5` no escuro e `#b42335` no claro, preservando o contraste dessas informações na referência.

A rolagem pública depende de `html.documentation-document` com `overflow: auto`, corpo com `overflow: visible` e `#root.documentation-root` com `position: static`, `inset: auto`, altura automática e overflow visível. Preservar esse isolamento em relação ao contêiner do aplicativo ao manter cabeçalhos e navegação com `position: sticky`.

Limites registrados, sem alteração da identidade: a landing pode substituir suas cores via `public-settings`, enquanto o portal usa a paleta padrão estática; a tonalidade clara da landing pode vir de `color-mix`, enquanto o portal usa `#eaf0ff`. Os rótulos promocionais `.lp-kicker` existentes na landing não foram promovidos a regra para a documentação. Nenhum `DESIGN.md` ou sidecar de sistema foi criado ou substituído nesta extensão.

## Conteúdo e manutenção

Dentro de `frontend/`:

```sh
npm run docs:generate
npm run docs:check
```

O gerador lê a AST TypeScript das rotas montadas a partir de `backend/src/routes/index.ts`, resolve prefixos, roteadores aninhados e middlewares de acesso, e acrescenta o serviço de arquivos públicos de `app.ts`. Ele não importa nem executa o backend. Rotas em arquivos não montados, como `webPushRoutes.ts`, não são anunciadas como disponíveis.

- `public/openapi.json`: especificação OpenAPI 3.0.3 para download e referência.
- `public/api-catalog.json`: módulos e operações usados pela busca.
- `scripts/api-docs/modules.cjs`: contexto funcional de cada módulo.
- `scripts/api-docs/operations.cjs`: contratos revisados manualmente, formatos de request/response e exemplos.
- `src/translate/languages/documentation.js`: conteúdo editorial e interface no i18n, com fallback português.

Contratos revisados documentam os fluxos centrais. As outras operações explicitam campos observados no controlador, sem inventar validações, schemas ou formatos completos delegados a serviços. Essa distinção aparece no catálogo e em `x-contract-level` da especificação. Autenticação específica do fluxo não significa endpoint público irrestrito. Referência completa de caminhos não equivale a contrato de API pública estável e versionada.

Ao mudar rotas/controladores, regenerar os artefatos e revisar os contratos afetados. A verificação na CI falha quando os artefatos divergem. A versão documental é uma data editorial, não uma promessa de versionamento dos endpoints.

## Decisões verificadas

- Mensagens usam JWT e ticketId, retornam HTTP 200 sem corpo e não têm idempotência garantida.
- Token `apiToken` é aceito apenas nas operações de contatos que incluem `apiTokenAuth`.
- Abertura de atendimento recebe contactId/userId/queueId e usa a conexão padrão.
- Renovação usa cookie jrt; GET /auth/me precisa também dele.
- Upload de mensagem usa medias; agendamento usa file/payload.
- A API administrativa usa X-Platform-Key e UUID v4 em Idempotency-Key nas mutações protegidas.
- MCP/OAuth e Socket.IO são documentados no estado atual, sem implementar ou habilitar novas integrações.

## Biblioteca

[Redoc](https://github.com/Redocly/redoc) fornece o componente React, navegação por schema e amostras de código. A série 2 declara suporte a React 17 e styled-components já usados pelo projeto. A dependência transitiva react-tabs 6 usa useId do React 18; o override restrito ao Redoc fixa react-tabs 4.3.0, que suporta React 17 e oferece os mesmos componentes de abas usados pela referência. A versão atual consultada de `@scalar/api-reference-react` exige React 18 ou 19, por isso não foi adotada. A referência carrega em chunk separado, apenas em `/api`.
