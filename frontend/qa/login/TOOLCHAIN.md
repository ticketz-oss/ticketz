# Componentes 21st.dev neste frontend

Este é um projeto existente React 17 + CRA 5 + CRACO + Material-UI 4. Não é um
projeto novo Next.js ou React 19. A adoção é incremental, sem substituir a
autenticação, o roteamento ou os estilos globais.

## Preparação já incluída

- `src/components/ui/` recebe componentes TypeScript reaproveitáveis. A pasta é
  a convenção shadcn/21st.dev e mantém a nova camada separada dos componentes
  legados em JavaScript.
- TypeScript 4.9.5 e os tipos de React 17 são preservados; os tipos de React DOM
  foram adicionados na mesma versão principal. `checkJs` fica desligado.
- Tailwind 3.4.19 é uma dependência direta fixada, compatível com a integração
  nativa de CRA 5. Não é necessário `postcss.config.js` nem Tailwind 4.
- `components.json` documenta os caminhos convencionais, sem executar uma
  inicialização destrutiva ou atualizar bibliotecas existentes.
- O alias `@/` aponta para `src/` no CRACO, Jest e preview. CRA não suporta
  `compilerOptions.paths`; por isso não há essa opção no `tsconfig.json`.
  Nos arquivos TypeScript, prefira imports relativos ou absolutos a partir de
  `src` (`components/ui/...`) para que o verificador também os resolva.

## Limites de CSS

`tailwind.config.js` analisa somente `src/components/ui/sign-in.tsx`. O reset
Preflight está desligado e todas as utilidades são limitadas pelo ancestral
`.ew-sign-in`. Use esse wrapper externo e mantenha os elementos com classes
utilitárias dentro dele; o seletor importante não estiliza o próprio wrapper.

O CSS desse componente importa `@tailwind utilities`, sem `@tailwind base`, e
define as variáveis HSL de tema somente no seu wrapper. Outros componentes e
telas Material-UI não recebem reset nem variáveis globais do novo login.

`interactive-blur-reveal.tsx` usa estilos próprios e APIs nativas WebGL2/Canvas,
sem utilidades Tailwind ou novas dependências. Não é necessário ampliar o
`content` para esse arquivo. Sua licença MIT está em `src/components/ui/HYPERIUX-LICENSE.txt`.
As texturas padrão são servidas localmente de `public/branding/`; sem WebGL2,
com movimento reduzido ou com o efeito desabilitado, a imagem estática permanece.

Não rode `shadcn@latest init` neste repositório: componentes atuais podem exigir
React ou Tailwind de outra versão. Para adicionar um novo componente, revise
suas dependências e estilos, adapte-o a React 17 e amplie o `content` apenas
para os arquivos aprovados. O arquivo `components.json` é preparação para
essa integração manual; não afirma que todo o catálogo shadcn esteja instalado.

## Instalação e validação

Execute a partir de `frontend/`:

```sh
npx --yes npm@10.8.2 ci --no-audit --no-fund
npm run typecheck
npm test -- --watchAll=false --runInBand
NODE_OPTIONS=--openssl-legacy-provider npm run build
node qa/login/serve.cjs
```

O preview serve o Login real em `http://127.0.0.1:4319/`, com dependências
externas simuladas e rede bloqueada por CSP. Ele usa o mesmo Tailwind que o
build principal. `/mobile` e `/mobile-small` enquadram esse mesmo componente
em 390 px e 320 px; `/settings` usa o editor real com dados somente em memória.

Se um Node local muito recente não tiver binário nativo para o pacote opcional
`canvas`, use uma instalação limpa com `--omit=optional` para executar o JSDOM
sem essa extensão. Não instale opcionais nativos com `--ignore-scripts`: deixar
o pacote presente sem seu binário faz o JSDOM falhar antes dos testes. Não são
necessários mocks extras nem mudanças no lock para esse ajuste local.

Referências: [Tailwind 3 com CRA](https://v3.tailwindcss.com/docs/guides/create-react-app)
e [configuração e seletor important](https://v3.tailwindcss.com/docs/configuration#selector-strategy).
