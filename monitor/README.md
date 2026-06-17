# Ticketz Monitoring Stack

Esta stack de monitoramento foi criada para coletar métricas de hardware e containers Docker.

## Componentes

- Prometheus: coleta métricas de `node-exporter` e `cAdvisor`
- Grafana: dashboard e visualização
- node-exporter: métricas do host (CPU, memória, disco)
- cAdvisor: métricas de container Docker

## Iniciar a stack

No diretório raiz do projeto:

```bash
docker compose -f docker-compose-monitor.yaml -p monitor up -d
```

Use `-p monitor` para manter esta stack isolada e evitar stacks duplicadas de monitoramento.

Se o Ticketz já estiver executando em outra stack, a monitorização de Redis/Postgres e backend exige que o monitor se conecte à mesma rede Docker. A rede utilizada por padrão é `ticketz_default`; se a sua stack tiver outro nome, defina `TICKETZ_NETWORK` antes de subir a stack.

## Endpoints

- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093
- cAdvisor: http://localhost:8082

## Dados provisionados automaticamente

O Grafana já está provisionado com:

- datasource `Prometheus`
- dashboard `Ticketz Monitor`
- dashboard `Ticketz Services`
- dashboard `Ticketz Application`
- dashboard `Ticketz Alerts`

## Backend metrics

O backend do Ticketz agora expõe `/metrics` para Prometheus, incluindo:

- contagem de empresas ativas
- conexões WebSocket ativas
- sessões WhatsApp por status e empresa
- tickets por status, por fila, sem fila, parados, sem atendente e idade do ticket mais antigo
- mensagens por direção, mensagens recentes e mensagens com erro
- estados de filas Bull (`waiting`, `active`, `failed`)
- idade do job mais antigo aguardando em cada fila
- contadores de requisições HTTP e latência

## Alertas Prometheus

Prometheus carrega regras de alerta em `monitor/prometheus.rules.yml`.

Atualmente existem regras para:

- CPU alto do host
- Memória alta do host
- Disco alto do host
- Memória alta de container Docker
- backend indisponível
- Postgres indisponível
- Redis indisponível
- taxa de erros 5xx alta
- fila de jobs acumulando
- sessões WhatsApp desconectadas
- tickets parados
- tickets sem fila
- tickets abertos ou pendentes antigos
- mensagens com erro
- jobs aguardando por tempo excessivo

O Alertmanager já está incluído, mas é necessário configurar recebedores reais no `monitor/alertmanager.yml` para envio de alertas. Existem exemplos em:

- `monitor/alertmanager.discord.example.yml`
- `monitor/alertmanager.telegram.example.yml`

Para Telegram local, use `monitor/alertmanager.local.yml` com `ALERTMANAGER_CONFIG` e mantenha as credenciais em `.env-monitor-local`. Use `.env-monitor-local.example` como base:

```env
TELEGRAM_BOT_TOKEN=token-do-bot
TELEGRAM_CHAT_ID=123456789
```

Suba o Alertmanager com:

```bash
ALERTMANAGER_CONFIG=./monitor/alertmanager.local.yml docker compose -f docker-compose-monitor.yaml -p monitor up -d --force-recreate alertmanager
```

Veja também `monitor/RUNBOOK.md` para comandos operacionais.
