# Ticketz Monitoring Runbook

## Daily checks

- Prometheus targets: `http://localhost:9090/targets`
- Prometheus alerts: `http://localhost:9090/alerts`
- Grafana dashboards:
  - `Ticketz Application`
  - `Ticketz Services`
  - `Ticketz Monitor`
  - `Ticketz Alerts`

## Common alerts

### BackendDown

Check whether the backend container is running and whether migrations finished.

```bash
docker compose -f docker-compose-local.yaml ps backend
docker compose -f docker-compose-local.yaml logs --tail=120 backend
```

### PostgresDown

Check Postgres and the exporter.

```bash
docker compose -f docker-compose-local.yaml ps postgres
docker compose -f docker-compose-monitor.yaml -p monitor logs --tail=120 postgres-exporter
```

### RedisDown

Check Redis and the exporter.

```bash
docker compose -f docker-compose-local.yaml ps redis
docker compose -f docker-compose-monitor.yaml -p monitor logs --tail=120 redis-exporter
```

### TicketzWhatsappDisconnected

Open Ticketz and verify the WhatsApp connection status. If needed, restart only the backend after checking logs.

```bash
docker compose -f docker-compose-local.yaml logs --tail=160 backend
```

### TicketzQueueBacklog or TicketzOldQueueJob

Check queue metrics first, then backend logs. A growing backlog usually means message sending, scheduling, Redis, or an external provider is slow/failing.

```bash
curl -s http://localhost:8080/metrics | grep -E 'ticketz_queue_(waiting|active|failed|delayed|oldest)'
docker compose -f docker-compose-local.yaml logs --tail=160 backend
```

### TicketzTicketsWithoutQueue

Check routing rules, queue configuration and recent incoming tickets. Tickets without queue for long periods usually indicate missing queue assignment or bot/menu routing issues.

### TicketzOldOpenTicket

Check the affected company and queue in the `Ticketz Application` dashboard using the `Company` and `Queue` filters.

### TicketzMessageErrors

Check failed outbound/inbound message processing in backend logs.

```bash
docker compose -f docker-compose-local.yaml logs --tail=200 backend
```

## Apply monitor changes

```bash
ALERTMANAGER_CONFIG=./monitor/alertmanager.local.yml docker compose -f docker-compose-monitor.yaml -p monitor up -d --force-recreate alertmanager
docker compose -f docker-compose-monitor.yaml -p monitor restart prometheus grafana
```

## Apply backend metric changes

```bash
docker compose -f docker-compose-local.yaml build backend
docker compose -f docker-compose-local.yaml up -d --force-recreate backend
```
