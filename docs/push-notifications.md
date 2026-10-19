# Notificações push (Web Push)

Antes desta implementação o sistema só notificava pela API `new Notification()`
da própria página. Isso limitava a notificação ao app aberto e, no iOS, nunca
funcionava: o Safari não implementa esse construtor nem dentro do PWA
instalado, e a exceção era engolida por um `catch`.

Agora o envio usa Web Push com VAPID, que entrega a notificação pelo push
service do fabricante (Apple, Google, Mozilla) mesmo com o app fechado.

## Como funciona

1. O frontend registra `/service-worker.js` e pede a permissão no clique do
   sino de notificações — o Safari exige gesto do usuário em
   `Notification.requestPermission()`.
2. Concedida a permissão, o navegador cria uma inscrição no push service e o
   frontend a envia em `POST /push/subscribe`.
3. A inscrição fica em `PushSubscriptions`, uma linha por dispositivo,
   identificada pelo `endpoint`.
4. A cada mensagem recebida, `NotifyNewMessageService` resolve os destinatários
   e `SendPushNotificationService` envia o push.
5. O service worker exibe a notificação e, no clique, foca a janela existente
   ou abre uma nova no ticket.

Quem está com o app aberto continua sendo notificado pelo websocket, como
antes. O push cobre justamente quem está com o app fechado.

## Destinatários

`NotifyNewMessageService` espelha o filtro do `NotificationsPopOver`:

- Ticket atribuído: só o responsável.
- Sem responsável, com fila: os usuários da fila.
- Sem responsável e sem fila: os admins da empresa.
- Grupo: usuários das filas do grupo mais os admins, e apenas se
  `soundGroupNotifications` estiver `enabled`.

Mensagem `fromMe` ou já lida não gera push.

O push vai para todos os destinatários, inclusive quem está com o sistema
aberto em outro aparelho. Uma primeira versão filtrava quem tinha sessão de
socket ativa para evitar alerta duplicado, mas o iOS suspende o PWA sem
disparar `disconnect`: a sessão ficava presa em `active = true` e bloqueava
todo push seguinte daquele usuário. A duplicata é resolvida no cliente — um
dispositivo com inscrição de push não exibe a notificação local, porque a
mesma mensagem já vai chegar pelo service worker.

## Conteúdo da notificação

- **Título**: nome do contato. Contato sem pushname fica gravado com o
  identificador do WhatsApp (um LID de 15 dígitos); nesse caso o título mostra
  o telefone formatado, que é bem mais legível.
- **Corpo**: primeira linha com a situação do atendimento (`Aguardando · Fila`
  ou `Em atendimento · Responsável`), segunda linha com a mensagem.
- **Tag**: id do ticket, então mensagens seguidas do mesmo contato substituem a
  notificação anterior em vez de empilhar uma por mensagem.

## Número no ícone do app

Usa a Badging API. Com o app fechado, o service worker conta as notificações
na bandeja — como a tag é o id do ticket, esse número equivale aos
atendimentos com mensagem não lida. Com o app aberto, o
`NotificationsPopOver` assume e grava a contagem real da tela.

## Configuração

O recurso só liga com o par VAPID definido no ambiente do backend:

| Variável | Conteúdo |
| --- | --- |
| `VAPID_PUBLIC_KEY` | Chave pública, entregue ao navegador |
| `VAPID_PRIVATE_KEY` | Chave privada — segredo, nunca no Git |
| `VAPID_SUBJECT` | `mailto:` ou URL `https:` de contato |

Sem elas, `isWebPushConfigured()` retorna falso, `GET /push/public-key`
responde `enabled: false` e o frontend não tenta se inscrever. Nada quebra: o
sistema volta ao comportamento de notificar só com o app aberto.

Para gerar um par novo:

```bash
node -e 'console.log(require("web-push").generateVAPIDKeys())'
```

Trocar o par invalida as inscrições existentes. O frontend detecta isso
comparando `applicationServerKey` e refaz a inscrição sozinho; no backend, os
envios às inscrições antigas falham com 403 até serem recriadas.

## Requisitos do iOS

- iOS 16.4 ou superior.
- O PWA precisa estar instalado na tela de início. No Safari em aba, o iOS não
  entrega push.
- A permissão precisa partir de um toque do usuário.

## Endpoints

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/push/public-key` | Chave pública e se o recurso está ligado |
| POST | `/push/subscribe` | Cria ou atualiza a inscrição do dispositivo |
| POST | `/push/unsubscribe` | Remove a inscrição pelo `endpoint` |

Inscrições que o push service responde com 404 ou 410 são apagadas no próprio
envio, então a tabela não acumula dispositivos que desinstalaram o app.
