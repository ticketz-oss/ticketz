---
description: Procedimento Padrão para Refletir Alterações de Código (Restart Docker)
---
Qualquer alteração feita no código (seja no backend ou no frontend) exige reiniciar os containers Docker com build para carregar as melhorias + postgres + redis + cloudflare.

Siga os passos abaixo:

1. Pare e remova os containers atuais usando o docker-compose correto:
// turbo
```bash
docker compose -f docker-compose-cloudflare.yaml down
```

2. Faça o build e suba os containers novamente:
// turbo
```bash
docker compose -f docker-compose-cloudflare.yaml up -d --build
```
