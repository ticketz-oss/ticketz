# Quadro de Tarefas V2 — homologação isolada

A stack usa o project name `espaco-whats-taskboard-v2`, portas e volumes próprios. Ela não reutiliza containers, rede ou dados da stack local padrão.

## Subir

```bash
docker compose -f docker-compose-local.yaml -f docker-compose-taskboard-v2.yaml up -d --build
```

- Frontend: `http://localhost:3301/tarefas`
- Backend, via proxy same-origin: `http://localhost:3301/backend`
- Backend direto para health check: `http://localhost:8181`

O seed padrão do projeto cria o administrador local. As migrations são executadas automaticamente na inicialização do backend.

## Validar e remover

```bash
docker compose -f docker-compose-local.yaml -f docker-compose-taskboard-v2.yaml ps
curl -f http://localhost:3301/
curl -f http://localhost:8181/
docker compose -f docker-compose-local.yaml -f docker-compose-taskboard-v2.yaml down --volumes --remove-orphans
```

O último comando remove containers, volumes e rede exclusivos desta homologação.
