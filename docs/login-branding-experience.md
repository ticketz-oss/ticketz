# Login e personalização da marca

## Escopo

Nova composição do login global: o componente Sign In fornecido pelo proprietário a partir do 21st.dev foi adaptado em TypeScript e integrado ao Login real. Preserva a identidade Espaço Whats laranja, o ícone fornecido pelo proprietário e a marca configurada por tenant. O formulário aparece à esquerda e o painel da marca à direita; em telas estreitas, apenas o formulário e a marca são exibidos.

- Autenticação existente preservada: identificar e-mail por slug, senha e criação de senha no primeiro acesso.
- Google, Microsoft e Apple são botões visuais desabilitados e identificados como “em breve”; não há OAuth implementado.
- Configurações → **Marca e login** fica visível para administradores do tenant. As permissões vêm do AuthContext, não dependem da consulta de empresa. A autorização da API continua obrigatória.
- Logos light/dark, favicon, cores, nome, links e imagens existentes foram preservados.
- Novas configurações públicas por tenant: `loginHeadline` (120 caracteres), `loginDescription` (240) e `loginTemplate` (`aurora`/`minimal`). Valores vazios usam textos traduzidos. Não requer migração, pois usa a tabela Setting existente.
- Personalização tem prévia do componente real, salvamento explícito e preserva rascunhos durante refetch. Erros não aparecem como sucesso.
- Não há botão de pausa na interface. A preferência de acessibilidade `prefers-reduced-motion` reduz as animações e desativa autoplay de vídeo.
- O painel com imagem usa **Interactive Blur Reveal**: o movimento do ponteiro revela a imagem através de um desfoque WebGL2. No tema claro, a lateral usa sobreposição clara, texto escuro e a logo para fundo claro; no tema escuro, usa sobreposição escura, texto branco e a logo correspondente. A prévia do editor mantém superfície clara. Usa a imagem lateral do tenant (ou o fundo legado se não houver imagem lateral); o padrão local é `/branding/login-desert.jpg`.
- Em telas de até 767 px o painel do login não é montado; a prévia no editor continua visível com imagem estática. O template Essencial, movimento reduzido, falta de WebGL2 ou falha de carregamento não impedem o login: o efeito usa uma imagem estática como fallback. Vídeos configurados mantêm sua apresentação existente, sem efeito de desfoque interativo.

## Implementação React 17, TypeScript e Tailwind

- `frontend/src/components/ui/sign-in.tsx` contém a composição reutilizável, os campos de vidro, os slots de marca e os botões de provedores. Não contém chamadas de autenticação nem credenciais.
- `frontend/src/pages/Login/index.js` continua responsável por identificar e-mail, definir senha no primeiro acesso e autenticar. Os callbacks passam essa lógica ao componente visual; não há uma segunda implementação de login.
- `frontend/src/components/ui/sign-in.css` contém as utilidades Tailwind e estilos restritos ao componente. `frontend/src/components/LoginExperience/BrandPanel.js` fornece o painel real tanto para o login quanto para a prévia de personalização.
- `frontend/src/components/ui/demo.tsx` é um exemplo opcional para documentação, não uma rota. Não autentica, registra senhas, emite alertas ou apresenta depoimentos fictícios. O componente aceita depoimentos para reutilização futura, mas o login de produção não recebe fixtures de demonstração.
- `frontend/src/components/ui/interactive-blur-reveal.tsx` adapta o componente Hyperiux usando somente React e APIs nativas do navegador, sem nova dependência. As texturas padrão são locais (`login-desert.jpg` e `reveal-noise.png`); os recursos WebGL são liberados ao desmontar e o loop respeita a visibilidade da aba e do painel.

O frontend existente continua em React 17 + Material-UI 4 + CRA 5 + CRACO. TypeScript 4.9.5 já estava instalado; o `tsconfig.json` habilita uma adoção incremental somente para novos arquivos TypeScript em `src/components/ui`, sem converter ou verificar os módulos legados JavaScript. Os tipos React DOM são da versão principal 17.

Tailwind **3.4.19**, fixado como dependência direta, usa a integração nativa de CRA 5. O `content` analisa somente `sign-in.tsx`; Preflight está desligado e `important: ".ew-sign-in"` limita as utilidades aos descendentes desse wrapper. As variáveis HSL de tema também devem ficar nesse escopo. Não há reset Tailwind global nem alteração da aparência das outras telas Material-UI.

O diretório `src/components/ui` e `components.json` seguem a convenção de componentes shadcn/21st.dev. Trata-se de integração manual em um projeto existente, não de uma migração de stack. O alias `@/` funciona em CRACO, Jest e QA; em TypeScript, prefira imports relativos ou absolutos a partir de `src`, pois CRA não aceita `compilerOptions.paths`.

Não executar `shadcn@latest init` nem trocar React/Tailwind apenas para copiar um componente: o catálogo atual pode exigir outras versões. Revise o código e as dependências de cada componente, adapte as APIs para React 17, mantenha o escopo de CSS e amplie o `content` apenas para arquivos aprovados. A preparação manual completa está em `frontend/qa/login/TOOLCHAIN.md`.

## Referências e licenças

O componente **Background Paths**, de Kokonut UI, foi consultado no [21st.dev](https://21st.dev/@kokonutd/components/background-paths) com uma visualização gratuita e adaptado para React 17 + Framer Motion 6 já instalado. A adaptação reduz a quantidade de caminhos, usa tempos determinísticos e respeita movimento reduzido. Licença MIT em `frontend/src/components/LoginExperience/KOKONUT-LICENSE.txt`.

O código do [Sign In de EaseMize](https://21st.dev/@easemize/components/sign-in), enviado pelo proprietário, foi adaptado e está integrado em `sign-in.tsx`. As alterações incluem traduções, isolamento de Tailwind, identidade configurável, acessibilidade e os fluxos existentes de autenticação. Não foram adicionados serviços externos de autenticação. Tailwind e os tipos React DOM são as dependências diretas acrescentadas para essa integração; React não foi atualizado.

O [Interactive Blur Reveal de Hyperiux](https://21st.dev/@hyperiux/components/interactive-blur-reveal), também fornecido pelo proprietário, preserva o shader de desfoque/revelação e o rastro do ponteiro. A integração acrescenta texturas locais, fallback estático, suporte a movimento reduzido e limpeza/recuperação do contexto WebGL. A licença MIT e a atribuição estão em `frontend/src/components/ui/HYPERIUX-LICENSE.txt`. Esse efeito não acrescenta pacotes ao projeto.

Referências técnicas: [Tailwind 3 com CRA](https://v3.tailwindcss.com/docs/guides/create-react-app) e [estratégia de seletor important](https://v3.tailwindcss.com/docs/configuration#selector-strategy).

## Verificação

- Testes frontend: `cd frontend && CI=true npm test -- --watchAll=false --runInBand`.
- Tipos incrementais: `cd frontend && npm run typecheck`.
- Build real: `cd frontend && NODE_OPTIONS=--openssl-legacy-provider npm run build`.
- Instalação reproduzível: a partir de `frontend/`, `npx --yes npm@10.8.2 ci --no-audit --no-fund`. Não usar `--legacy-peer-deps` nem regenerar todo o lock com outra árvore de dependências.
- Testes backend novos são unitários, com modelos mockados; não usam banco nem os hooks destrutivos de `npm test`.
- A validação completa backend deve rodar em banco efêmero no workflow `ci-deploy.yml`.
- Prévia isolada: `cd frontend && node qa/login/serve.cjs`; porta 4319, rotas `/`, `/settings`, `/mobile` e `/mobile-small`. Importa componentes reais e bloqueia chamadas externas. Nenhuma autenticação real é feita na prévia.
- Publicação deste trabalho: apenas branch `dev`, projeto Dokploy **EspacoWhats Dev**, `teste.dev.espacowhats.com.br`. Não publicar em main, produção ou branches AC Norte.
