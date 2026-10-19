# Páginas públicas de privacidade e termos

Documentos pt-BR estáticos, independentes de React, API, cookies ou login:

- `/privacidade/` → `frontend/public/privacidade/index.html`
- `/termos/` → `frontend/public/termos/index.html`
- `/legal/legal.css` → estilo compartilhado, claro/escuro pelo sistema operacional

O build CRA copia `public/` e o Nginx existente serve esses arquivos por `try_files`.
Não adicionam bibliotecas, cookies, rastreadores nem alterações de banco. São
documentos jurídicos em português, não componentes da interface React.

## Informações fornecidas pelo responsável

- Identidade pública: Espaço Whats
- CNPJ: 61.824.588/0001-92
- Suporte e privacidade: contato@somosespaco.com.br

## Referências consultadas em 2026-09-13

- https://developers.google.com/terms/api-services-user-data-policy
- https://clerk.com/legal/dpa
- https://clerk.com/docs/guides/how-clerk-works/cookies
- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm

Os textos são uma versão inicial contextualizada, não um parecer jurídico nem
uma declaração de aprovação pelas plataformas. Solicitar revisão jurídica e
operacional, especialmente sobre: razão social completa/endereço do prestador,
bases legais por finalidade, prazos de retenção e rotação de backups, fornecedores
efetivamente contratados, mecanismos de transferência internacional e processo
de atendimento dos direitos dos titulares. Não foram inventados prazos de SLA,
multas, certificações, endereço de encarregado ou garantias de segurança absoluta.

## Dependências de autenticação

A configuração de credenciais no Clerk não implementa autorização no backend.
Antes de disponibilizar login social no sistema, validar: token no servidor,
e-mail verificado, tenant correto, usuário já cadastrado, empresa ativa, ausência
de criação automática de usuários e atualização de nome/foto apenas após acesso
autorizado. Não usar dados Google de perfil para IA/marketing. Preservar login com
senha. Apple depende da participação em Apple Developer Program; Microsoft foi
adiado a pedido do responsável.

Os links de privacidade e termos estão no rodapé da página inicial e precisam
permanecer visíveis no login social ao integrar a nova autenticação. Cadastrar as URLs canônicas no
Google e no Clerk somente após confirmar HTTP 200 público com o conteúdo correto.

## Validação

`node --test frontend/scripts/public-legal.test.cjs`

Para visualizar sem dependências: servir `frontend/public` como raiz HTTP e abrir
as duas URLs, verificando desktop, largura de 390px, links e contraste claro/escuro.
