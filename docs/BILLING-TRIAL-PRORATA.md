# Trial e primeira cobrança pró-rata

## Preflight somente leitura

Antes da migration, execute no PostgreSQL:

```sql
SELECT id, name, "dueDate"
FROM "Companies"
WHERE "dueDate" IS NULL
   OR "dueDate"::text !~ '^\d{4}-\d{2}-\d{2}';

SELECT "companyId", "dueDate", COUNT(*)
FROM "Invoices"
GROUP BY "companyId", "dueDate"
HAVING COUNT(*) > 1;
```

Empresas legadas recebem `trialDays = 0`, `trialEndsAt = NULL` e `dueDay` derivado de `dueDate`. Nenhuma fatura histórica é recalculada.

## Ordem de rollout

1. Fazer backup do PostgreSQL e executar o preflight.
2. Publicar a imagem do backend; o entrypoint aplica as migrations antes de iniciar.
3. Confirmar migrations, health check e logs do cron.
4. Publicar/confirmar o frontend e executar smoke test somente leitura.

## Rollback

Reverter primeiro o código. Somente depois, se não houver novos dados dependentes, executar o `down` das migrations. O rollback nunca deve alterar ou apagar faturas históricas. Faturas abertas com `txId` ou `externalRef` são preservadas pela aplicação.

## Regra financeira

O período gratuito é `[âncora, trialEndsAt)`. A primeira fatura usa `[trialEndsAt, dueDate)`, com fim exclusivo, centavos inteiros, escala 377580 e um único arredondamento half-up. Vencimentos 29–31 são ajustados ao último dia do mês sem perder a âncora original.
