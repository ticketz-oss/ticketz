# Atendimento, chat interno e imagens de perfil

A central reúne mensagens, notas internas, contexto, transferência, agendamento, etiquetas, histórico e arquivos carregados. As ações usam os endpoints existentes. A pesquisa e a impressão abrangem as mensagens já carregadas; role a conversa para trazer páginas anteriores.

O chat interno usa a mesma estrutura visual, com participantes, avatares, arquivos e separadores de dia. Enter envia; Shift + Enter insere uma linha. O texto permanece na caixa se o envio falhar. As respostas HTTP e eventos de socket são reconciliados pelo ID da mensagem.

## Fotos

Em Perfil ou Usuários → Editar, selecione Alterar foto e salve. Aceita JPG, PNG e WebP até 5 MB e 16 megapixels; o backend normaliza para WebP de 256 × 256. Atendentes editam a própria foto; administradores podem editar usuários da empresa, seguindo a autorização existente para superadministradores.

A migração `20260912190000-add-user-profile-picture` adiciona `Users.profilePicUrl`. Os arquivos ficam em `public/avatars/<companyId>/`. A nova foto é persistida antes de excluir a anterior. Falha na gravação remove o arquivo novo e conserva o antigo; remover a foto também exclui seu arquivo.

O componente `AvatarUsuario` resolve os arquivos de avatar usando o backend configurado no frontend. Em tenants, a foto usa o proxy `/backend` do domínio atual, mesmo quando a API informa uma URL absoluta com o domínio principal. Prévias locais continuam usando sua URL de blob.

Logos clara/escura, favicon, imagem lateral, fundo do login e prévia de links ficam em `public/branding/<companyId>/`. Cada substituição atualiza a configuração dentro de uma transação e só então remove a imagem anterior. Arquivos ainda usados por outra configuração são preservados. Limpar a imagem nas configurações também libera seu arquivo. URLs novas evitam cache antigo no navegador.

## Execução e verificação

- Stack local: `docker compose -f docker-compose-local.yaml up -d`.
- Frontend: dentro de `frontend`, `NODE_OPTIONS=--openssl-legacy-provider npm start`.
- Build frontend: dentro de `frontend`, `NODE_OPTIONS=--openssl-legacy-provider npm run build`.
- Testes frontend: dentro de `frontend`, `CI=true npm test -- --watchAll=false --runInBand`.
- Build backend: dentro de `backend`, `npm run build`.
- Testes das imagens: dentro de `backend`, `npx jest --runInBand --coverage=false FotoUsuarioService FotoUsuarioController brandingFiles SubstituirImagem`.
- O deploy Docker executa as migrações. Fora dele, compile o backend e execute `npm run db:migrate` antes de iniciar o servidor.

A validação visual local utiliza dados fictícios; não envia mensagens para contatos reais. O destino de publicação é exclusivamente a branch `dev` e o ambiente `teste.dev.espacowhats.com.br`.
