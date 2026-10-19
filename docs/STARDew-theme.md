# Tema Stardew Valley — primeira versão

O seletor **Tema** substitui a alternância claro/escuro no perfil e nas ferramentas da navegação. Oferece claro, escuro e Stardew Valley, com a logo fornecida para a terceira opção.

## Disponibilidade e preferência

- Stardew depende da empresa retornada pela sessão autenticada: `companyId === 1` (tenant Teste na produção).
- Em um subdomínio, também exige `slug === "teste"`. Nenhum valor de `localStorage.companyId` habilita o tema.
- A preferência fica em `preferredTheme:tenant:<companyId>`. O fallback público `preferredTheme` conserva apenas claro/escuro.
- Trocar empresa, sair da sessão ou abrir outro subdomínio remove imediatamente os estilos experimentais; a escolha do Teste continua salva.
- `theme.isStardew` e `html[data-theme="stardew"]` controlam componentes e estilos. `theme.mode`/`palette.type` continuam `light` ou `dark`, conforme o contrato do Material UI.

## Cobertura visual

A paleta, tipografia, formas e controles compartilhados cobrem Material UI, Radix, tabelas, menus e diálogos em portais, calendários, rich text, notificações, áudio e gráficos. Os quatro estilos do tema complementam a base com tratamentos próprios de cada área:

- Operação: painel, contatos/listas, tags, usuários, filas, canais, respostas rápidas, agendas, tarefas, informativos e ajuda.
- Conversas: atendimentos desktop/mobile, mensagens, compositor, áudio, anexos, contato, notas, histórico e chat interno.
- Automação: editor, blocos, conexões, painel lateral e simulador dos fluxos.
- Negócio: campanhas/configurações/relatórios, cobrança, financeiro, prospecção, assinaturas/checkout, configurações, voz, horários, planos e administração.

## Fontes e mensagens

Toda a interface, incluindo títulos e controles do tema Stardew, usa a fonte normal Inter. As fontes Stardew Valley Regular e ALL CAPS fornecidas pelo usuário foram retiradas da interface devido à legibilidade. Somente o conteúdo de mensagens recebe os símbolos da fonte Junimo, alinhados abaixo das letras; compor/enviar/copiar mensagens conserva o texto original.

`JunimoWhatsMarked` adapta a saída do formatador existente em uma árvore React com tags/atributos permitidos. Mantém negrito, itálico, riscado, links, listas e emojis. `JunimoText` usa símbolos decorativos em pseudo-elementos, sem duplicar o texto no DOM/clipboard; os leitores de tela recebem o texto original. Palavras longas podem quebrar em telas pequenas.

## Referências e compatibilidade

A StardewCN 0.1.0 exige React 18/19; o aplicativo usa React 17. Os elementos visuais Panel, DialogueBox, ItemSlot, LetterFrame, GoldCounter e barras foram adaptados aos controles funcionais atuais, sem instalar uma dependência com pares incompatíveis. Referência: https://kevingabeci.com/work/stardewcn e https://github.com/kevingabeci/stardewCN.

As licenças/créditos estão em `frontend/public/stardew/`. As ilustrações de fazenda e os emblemas são arte vetorial original. O tema é uma adaptação não oficial inspirada em Stardew Valley.

## Verificação

- `npm test -- --watchAll=false --runInBand` no frontend: testes existentes de telas, conversas, personalização, mídia e componentes; testes novos verificam identidade autenticada, isolamento, persistência/reload/logout e anotação de texto formatado.
- `npm run build` no frontend: produção e pré-compressão dos assets.
- Verificação visual autenticada desktop/mobile das rotas de operação, negócio, configurações e conversas; menus, troca entre os três temas e recarga da preferência.
- Publicação somente do frontend; nenhuma migração, mudança de dados de conversas ou reinício de sessões WhatsApp é necessário.

O fundo da interface do tema utiliza a imagem de fazenda fornecida pelo usuário em `public/stardew/farm-background.png`.
