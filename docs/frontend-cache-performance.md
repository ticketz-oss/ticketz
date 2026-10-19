# Carregamento e cache do frontend

## Diagnóstico em 13/09/2026

No dev global, o GET com negociação de compressão de
`/static/js/219.5dc30904.chunk.js` transferiu 4.949.920 bytes sem
`Content-Encoding`. O servidor respondeu em aproximadamente 147 ms (TTFB),
mas isso não representa o tempo de renderização nem a velocidade dos demais
usuários. A compressão gzip desse mesmo conteúdo produz 1.286.154 bytes:
74% menos transferência, não uma promessa de 74% menos tempo de carregamento.

`/branding/login-desert.jpg` recebeu `Cache-Control: no-store`, impedindo o
reaproveitamento normal. JavaScript já tinha cache de um ano, mas a inicialização
ainda importa código de várias páginas antes do login. `loadJSON` fazia leituras
síncronas repetidas da configuração, e o splash aguardava o próximo tick de
um segundo mais 500 ms mesmo depois da montagem do React.

## Primeira etapa implementada

- O postbuild gera arquivos `.gz` para JS/CSS/SVG de `build/static`, uma vez por
  build. Não comprime configurações de runtime, respostas autenticadas ou uploads.
- Nginx negocia `gzip_static on` somente para `/static/`, com fallback gzip para
  assets textuais e resposta original para clientes sem suporte. `Vary` separa
  representações comprimidas e originais. Não há compressão nova para APIs.
- Assets com hash usam `public, max-age=31536000, immutable`; novos conteúdos têm
  novas URLs. Assets inexistentes retornam 404, não HTML nem cache longo de erro.
- Diretórios públicos de apresentação (`branding`, `whatsapp`, `vector`, `voice`)
  usam `public, no-cache`: o navegador pode armazenar, mas valida antes de reutilizar.
  ETag/Last-Modified permitem 304 sem baixar o corpo novamente. Isso evita manter
  logos antigas no mesmo endereço; não é cache imutável.
- HTML, config, manifest, APIs, sessões e `/backend/public/` não ganham cache novo.
- Config JSON válido é compartilhado apenas na memória da página. Reload/deploy
  lê novamente; falhas não ficam armazenadas.
- O splash desaparece assim que o React está montado, sem atraso do cronômetro.

Não foi instalado Redis para arquivos estáticos, CDN, service worker ou cache
compartilhado de dados de clientes. Pré-compressão no servidor e cache HTTP são
camadas diferentes. A primeira visita continua precisando baixar os arquivos,
mas comprimidos; visitas seguintes reaproveitam os recursos permitidos.

## Validação e rollout

Testes cobrem compressão reversível/determinística, mtime, preservação dos originais,
arquivos excluídos, deduplicação da configuração, retry após erro e remoção imediata
do splash. Rodar `npm test -- --watchAll=false --runInBand` e `npm run build` no frontend.

Antes de publicar, validar Nginx com a imagem de runtime e verificar HTTP real:

1. GET de JS com gzip: 200, `Content-Encoding: gzip`, `Vary: Accept-Encoding`.
2. GET com identity: conteúdo original; comparar hash após descompressão.
3. JS/CSS com hash: cache imutável; URL inexistente: 404 sem cache longo.
4. Branding: `no-cache` e ETag; GET condicional: 304.
5. HTML/config/API: sem cache público novo, incluindo autenticação e anexos.
6. Primeiro acesso, recarga, login e navegação no navegador; comparar requisições
   e bytes, sem prometer um tempo universal a partir de uma conexão local.

O rollout solicitado contempla dev global, produção global, AC Norte dev e
AC Norte produção. Promover a mesma mudança global por merges validados, sem
substituir as customizações do AC Norte nem importar dados ou sessões do dev.

### Checklist de publicação segura

1. Integrar cache e autenticação no candidato dev, mantendo os hooks `postbuild`,
   `postbuilddev` e `postwinBuild` apontando para `node scripts/precompress.cjs`.
   Rodar testes, typecheck e build antes de validar o dev no Dokploy.
2. Mesclar o candidato validado em `main`, preservando as mudanças exclusivas
   de produção (isolamento de tenants, manifestos e páginas legais). Validar o
   SHA final; usar o workflow de release vigente em `main` para promover `deploy`.
3. Antes de reiniciar produção, confirmar backups recuperáveis e guardar os IDs
   das imagens/configurações anteriores. Não executar seeds, restaurar banco do
   dev ou recriar volumes. Revisar separadamente quaisquer migrações da release;
   esta mudança de cache não exige migração de banco.
4. Mesclar a base global publicada em `acnorte`, preservando SGA, régua de cobranças,
   campos dos contatos, traduções e rotas próprias. Validar AC Norte dev e seu CI;
   promover `acnorte-deploy` pelo workflow dedicado, com o SHA validado e a base
   global como ancestral.
5. Preservar o tenant 9 como propriedade exclusiva do runtime AC Norte: backend
   geral com exclusão 9; dedicado com `TENANT_RUNTIME_COMPANY_ID=9` e
   `QUEUE_PREFIX=acnorte-production`. Manter banco/Redis/volumes atuais e a
   configuração vigente das cobranças. Nunca iniciar dois donos das mesmas
   sessões nem usar logout/reset de WhatsApp durante manutenção.
6. Após cada deploy, confirmar SHA/imagem e saúde no Dokploy, repetir as verificações
   HTTP acima e validar login, navegação, mídia e conexões existentes sem novo QR
   Code. No AC Norte, verificar também SGA/cobranças sem disparar envios reais de teste.
7. Em regressão, retornar à imagem anterior do serviço afetado, preservando dados,
   sessões e isolamento. Não usar `down -v` nem rollback destrutivo de migrações.

A próxima etapa recomendada é divisão das rotas em chunks: compressão reduz
transferência, mas não elimina execução JavaScript nem a carga de módulos
desnecessários no login.

Referências: [Nginx gzip_static](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)
e [cache HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).
