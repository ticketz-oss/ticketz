# Módulo 1 — Branding Solution Zap
## Guia de Aplicação dos Arquivos

---

## Passo 1 — Clone o repositório Ticketz

```bash
git clone https://github.com/ticketz-oss/ticketz.git solutionzap
cd solutionzap
```

---

## Passo 2 — Copie os arquivos deste módulo

Estrutura de onde cada arquivo vai:

```
solutionzap/                                ← raiz do projeto
├── docker-compose-local.yaml               ← SUBSTITUI o original
├── .env-backend-local                      ← SUBSTITUI o original
├── .env-frontend-local                     ← SUBSTITUI o original
│
├── frontend/
│   └── public/
│       ├── manifest.json                   ← SUBSTITUI o original
│       └── vector/
│           ├── logo.svg                    ← SUBSTITUI o original
│           ├── logo-dark.svg               ← SUBSTITUI o original
│           └── favicon.svg                 ← SUBSTITUI o original
│
└── backend/
    └── src/
        └── database/
            └── seeds/
                ├── 20200904070005-create-default-company.ts   ← SUBSTITUI
                ├── 20200904070006-create-default-user.ts      ← SUBSTITUI
                └── 20200904070008-create-brand-settings.ts    ← NOVO arquivo
```

---

## Passo 3 — Suba o projeto pela primeira vez

```bash
# Na raiz do projeto (pasta solutionzap/)
docker compose -f docker-compose-local.yaml up --build -d
```

A primeira execução vai:
1. Construir as imagens Docker (~5-10 min)
2. Criar o banco de dados PostgreSQL
3. Executar as migrations
4. Executar os seeds (incluindo o branding Solution Zap)

---

## Passo 4 — Acesse o sistema

Abra no navegador: **http://localhost:3000**

Login padrão:
- **Email:** admin@solutionzap.com.br
- **Senha:** SolutionZap@2025

> ⚠️ Troque a senha imediatamente após o primeiro acesso.

---

## Passo 5 — Upload de logo pelo painel (opcional)

O sistema já vai exibir o logo SVG padrão. Se quiser fazer upload
de um logo personalizado (PNG/JPG), acesse:

**Configurações → Whitelabel → Logo Claro / Logo Escuro / Favicon**

---

## Passo 6 — Ajustar as cores pelo painel

Em **Configurações → Whitelabel**:
- Cor principal (claro): `#E65100`
- Cor principal (escuro): `#FF7043`

Estas já estão pré-configuradas pelo seed, mas podem ser ajustadas
a qualquer momento pelo painel.

---

## Comandos úteis

```bash
# Parar o projeto
docker compose -f docker-compose-local.yaml down

# Ver logs
docker compose -f docker-compose-local.yaml logs -f backend

# Recriar do zero (apaga banco!)
docker compose -f docker-compose-local.yaml down -v
docker compose -f docker-compose-local.yaml up --build -d

# Acessar o banco diretamente
docker compose -f docker-compose-local.yaml exec postgres psql -U solutionzap -d solutionzap
```

---

## Compliance AGPL

O link para o repositório do Ticketz original deve permanecer acessível
aos usuários do sistema. Ele está na tela **Sobre** (ícone de usuário
no canto superior direito → Sobre). **Não remova este link.**

Crie seu próprio fork em: https://github.com/SEU_USUARIO/solutionzap
e atualize o link na tela Sobre para apontar para o seu fork.

---

## Próximos módulos

- **Módulo 2** — Integração N8N + Flowise por empresa
- **Módulo 3** — Dashboard avançado com métricas
- **Módulo 4** — Gateway Mercado Pago para cobrança recorrente
