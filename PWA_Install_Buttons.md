# PWA Install Buttons (Instalar App - Android / iOS)

Este documento descreve detalhadamente o comportamento dos botÃµes de instalaÃ§Ã£o do PWA presentes no projeto, partindo do arquivo principal `app/estabelecimento/index.php` e incluindo trechos relevantes encontrados em outros arquivos (`garcom/index.php`, `_layout/footer.php`, `addtohome.js`, etc.).

SumÃ¡rio
- VisÃ£o geral
- HTML / CSS relevantes
- Fluxo JavaScript (Android - `beforeinstallprompt`)
- Fluxo iOS (popup de instruÃ§Ãµes)
- Eventos importantes (`beforeinstallprompt`, `appinstalled`)
- Arquivos relacionados (manifest, service worker)
- Boas prÃ¡ticas e recomendaÃ§Ãµes
- ReferÃªncias no projeto

## VisÃ£o geral

O projeto implementa dois botÃµes visuais para facilitar que usuÃ¡rios instalem o aplicativo PWA:

- BotÃ£o Android: "Instalar App (Android)" â€” id `installButton`. Quando suportado pelo navegador (evento `beforeinstallprompt`), ele dispara o prompt nativo de instalaÃ§Ã£o.
- BotÃ£o iOS: "Instalar App (iOS)" â€” id `showInstructionsButton`. Em iOS nÃ£o Ã© possÃ­vel disparar programaticamente o prompt A2HS; o botÃ£o abre um popup (`instructionsPopup`) com instruÃ§Ãµes para adicionar Ã  tela de inÃ­cio.

O layout dos botÃµes costuma ficar dentro de um container com a classe `.install-buttons` e os botÃµes possuem classes de botÃ£o (`btn btn-primary btn-sm`, `btn btn-info btn-sm`) e styles inline para controlar exibiÃ§Ã£o.

## HTML (trechos encontrados)

- Em `app/estabelecimento/index.php` (botÃµes dentro do bloco mobile):

```html
<div class="install-buttons" style="display: flex; justify-content: center; align-items: center; margin-top: 10px; margin-bottom: 15px;">
    <button id="installButton" class="btn btn-primary btn-sm" style="margin-right: 5px; display: none;">Instalar App (Android)</button>
    <button id="showInstructionsButton" class="btn btn-info btn-sm" style="display: none;">Instalar App (iOS)</button>
</div>
```

- Existiram variaÃ§Ãµes semelhantes em outros arquivos (ex.: `garcom/index.php`, `app/estabelecimento/_layout/sidebars_BKP.php`, `index_BKP.php`).

## CSS

O projeto contÃ©m definiÃ§Ãµes visuais para `.install-buttons` (e para o estilo inline acima), mas o comportamento de exibiÃ§Ã£o Ã© controlado via JavaScript. Em projetos similares `.install-buttons` Ã© usada apenas como wrapper para alinhar os botÃµes.

## Fluxo JavaScript â€” instalaÃ§Ã£o Android (detalhado)

O fluxo principal baseado no padrÃ£o PWA A2HS (Add to Home Screen) utiliza o evento `beforeinstallprompt` do navegador e armazena o evento em uma variÃ¡vel `deferredPrompt`. Quando o usuÃ¡rio clica em `installButton`, o cÃ³digo chama `deferredPrompt.prompt()` e aguarda `deferredPrompt.userChoice`.

Trecho copiado de `app/estabelecimento/index.php` (JS dentro de `DOMContentLoaded`):

```javascript
const installButton = document.getElementById('installButton');
let deferredPrompt; // VariÃ¡vel para guardar o evento beforeinstallprompt

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('`beforeinstallprompt` event fired.');
    // O botÃ£o Ã© exibido mais adiante dependendo do modo standalone
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installButton.style.display = 'none'; // Esconde apÃ³s tentativa
        } else {
            console.log('O prompt de instalaÃ§Ã£o PWA nÃ£o estÃ¡ disponÃ­vel.');
            // Poderia adicionar uma mensagem para o usuÃ¡rio aqui
        }
    });
}

window.addEventListener('appinstalled', () => {
    if (installButton) installButton.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA foi instalado');
});

// LÃ³gica de exibiÃ§Ã£o: se nÃ£o for PWA standalone, mostra os botÃµes (Android/iOS)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
if (!isStandalone) {
    if (installButton) installButton.style.display = 'inline-block';
}

```

ObservaÃ§Ãµes do fluxo:
- `e.preventDefault()` Ã© chamado para suprimir o prompt nativo imediato e permitir exibÃ­-lo no momento desejado.
- O evento sÃ³ Ã© disparado em navegadores que suportam o A2HS (ex.: Chrome em Android). Em iOS/Safari o evento nÃ£o existe.
- ApÃ³s chamar `prompt()` vocÃª deve observar `userChoice` para captar se o usuÃ¡rio aceitou ou rejeitou.
- Sempre limpe `deferredPrompt = null` apÃ³s o uso.

### Exemplo alternativo (achado em `garcom/index.php`)

```javascript
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'inline-block';
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`UsuÃ¡rio ${outcome} a instalaÃ§Ã£o`);
        deferredPrompt = null;
    }
    installButton.style.display = 'none';
});
```

## Fluxo iOS â€” popup de instruÃ§Ãµes

iOS/Safari nÃ£o suporta `beforeinstallprompt`. Portanto a soluÃ§Ã£o adotada no projeto Ã© exibir um botÃ£o que abre um popup com instruÃ§Ãµes manuais para adicionar Ã  Tela de InÃ­cio.

Trecho do popup (HTML) em `app/estabelecimento/index.php`:

```html
<!-- Popup de InstruÃ§Ãµes iOS -->
<div id="instructionsPopup" style="display: none; position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 1050; padding: 20px; box-sizing: border-box; align-items: center; justify-content: center;">
    <div style="background-color: white; padding: 25px; border-radius: 8px; max-width: 450px; margin: 20px auto; position: relative; text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <button id="closePopupButton" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 2em; color: #888; line-height: 1;">&times;</button>
        <h4>InstruÃ§Ãµes para iOS</h4>
        <ol>
            <li>Toque no botÃ£o de <strong>Compartilhar</strong> (na barra inferior do Safari).</li>
            <li>Role para baixo e toque em "<strong>Adicionar Ã  Tela de InÃ­cio</strong>".</li>
            <li>Confirme tocando em "<strong>Adicionar</strong>".</li>
        </ol>
    </div>
</div>
```

Trecho JS que abre/fecha o popup (tambÃ©m em `app/estabelecimento/index.php`):

```javascript
const showInstructionsButton = document.getElementById('showInstructionsButton');
const instructionsPopup = document.getElementById('instructionsPopup');
const closePopupButton = document.getElementById('closePopupButton');

if (showInstructionsButton && instructionsPopup) {
    showInstructionsButton.addEventListener('click', () => {
        instructionsPopup.style.display = 'flex';
    });
}

if (closePopupButton && instructionsPopup) {
    closePopupButton.addEventListener('click', () => {
        instructionsPopup.style.display = 'none';
    });
}

// Fechar clicando fora da caixa
if (instructionsPopup) {
    instructionsPopup.addEventListener('click', (e) => {
        if (e.target === instructionsPopup) instructionsPopup.style.display = 'none';
    });
}
```

## Eventos importantes

- `beforeinstallprompt`: evento do navegador que permite adiar o prompt A2HS. Deve-se chamar `e.preventDefault()` e guardar o evento.
- `appinstalled`: evento disparado quando o app for efetivamente instalado; Ãºtil para esconder botÃµes e limpar estado.
- `deferredPrompt.prompt()`: exibe o diÃ¡logo de instalaÃ§Ã£o.
- `deferredPrompt.userChoice`: Promise que resolve com `{ outcome: 'accepted' | 'dismissed' }`.

## Arquivos relacionados no projeto

- `app/estabelecimento/index.php` â€” principal implementaÃ§Ã£o do HTML, CSS inline e JavaScript do fluxo.
- `garcom/index.php` â€” implementaÃ§Ã£o similar (registro de service worker, botÃµes e lÃ³gica A2HS).
- `app/estabelecimento/_layout/footer.php` â€” variaÃ§Ã£o de captura do evento `beforeinstallprompt` e cÃ³digo de exemplo.
- `app/estabelecimento/js/addtohome.js` â€” implementa padrÃ£o semelhante: registra SW, ouve `beforeinstallprompt` e mostra o botÃ£o `.addtohome`.
- `garcom/sw.js`, `sw2.js`, `serviceworker.js` â€” exemplos de service workers referenciados em diferentes lugares (importantes para PWA funcionar off-line e serem instalÃ¡veis).
- `manifest.json` â€” Ã© necessÃ¡rio para que o navegador considere o site um PWA instalÃ¡vel; referÃªncias ao manifest existem em `garcom/index.php` e em `login/index.php`.

## Boas prÃ¡ticas / RecomendaÃ§Ãµes

1. Exibir o botÃ£o Android (`installButton`) apenas quando `deferredPrompt` estiver disponÃ­vel. O cÃ³digo atual mostra o botÃ£o mesmo antes do evento chegar; recomenda-se habilitar/mostrar o botÃ£o somente apÃ³s o `beforeinstallprompt` ou desabilitar com tooltip explicando indisponibilidade.
2. Guardar um â€œflagâ€ local (por exemplo localStorage) para nÃ£o insistir em mostrar o botÃ£o repetidamente apÃ³s o usuÃ¡rio rejeitar/aceitar recentemente.
3. Acompanhar `appinstalled` para ocultar controles e medir a taxa de instalaÃ§Ã£o (telemetria simples via analytics).
4. Garantir que o `manifest.json` tenha propriedades obrigatÃ³rias (name, short_name, icons 192/512, start_url, display: standalone, background_color, theme_color).
5. Confirmar que o Service Worker esteja sendo registrado com sucesso antes de considerar o app pronto para instalaÃ§Ã£o (muitos navegadores demandam HTTPS e SW vÃ¡lido).

## Trechos Ãºteis adicionais (service worker registration, manifest link)

Exemplo de registro de Service Worker (encontrado em `garcom/index.php`):

```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw2.js')
            .then(registration => { console.log('ServiceWorker registrado com sucesso:', registration.scope); })
            .catch(error => { console.log('Falha ao registrar ServiceWorker:', error); });
    });
}
```

Exemplo de referÃªncia ao manifest (encontrado em `garcom/index.php` e `login/index.php`):

```html
<link rel="manifest" href="/manifest.json">
<!-- ou -->
<link rel="manifest" href="<?php just_url(); ?>/login/manifest.json" />
```

## ReferÃªncias no projeto (ocorrÃªncias localizadas)

- `app/estabelecimento/index.php` â€” botÃµes HTML e o bloco JS (ponto de partida principal).
- `garcom/index.php` â€” implementaÃ§Ã£o similar e registro do service worker.
- `app/estabelecimento/_layout/footer.php` â€” outra implementaÃ§Ã£o do `beforeinstallprompt`.
- `app/estabelecimento/_layout/sidebars_BKP.php` â€” versÃ£o backup com botÃµes e JS.
- `app/estabelecimento/js/addtohome.js` â€” script especÃ­fico para A2HS.
- `garcom/sw.js`, `sw2.js`, `serviceworker.js` â€” service workers usados em diferentes partes do projeto.
- `manifest.json` â€” ver referÃªncias em `garcom/index.php` e `login/index.php`.

## Resumo

O botÃ£o "Instalar App (Android)" usa o evento `beforeinstallprompt` para disparar o fluxo A2HS (Add to Home Screen) em navegadores que suportam essa API (principalmente Chrome e derivados em Android). O botÃ£o "Instalar App (iOS)" apenas abre um popup com instruÃ§Ãµes porque o Safari/iOS nÃ£o disponibiliza o evento nem permite disparar programaticamente a adiÃ§Ã£o Ã  tela de inÃ­cio.

Coloquei aqui os trechos de cÃ³digo relevantes e referÃªncias para facilitar manutenÃ§Ã£o e eventuais melhorias (ex.: apenas exibir o botÃ£o Android quando `deferredPrompt` estiver disponÃ­vel e adicionar flags de UX para nÃ£o incomodar usuÃ¡rios).

---

Arquivo criado automaticamente a partir da anÃ¡lise do cÃ³digo fonte: `app/estabelecimento/index.php` e arquivos relacionados.