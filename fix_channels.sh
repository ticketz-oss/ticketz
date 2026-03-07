#!/bin/sh
# Script para corrigir channels incorretos no banco de dados
psql $DATABASE_URL -c "
-- 1. Corrigir contacts cujas mensagens indicam canal WaCloud
UPDATE \"Contacts\" SET channel = 'whatsapp_cloud'
WHERE channel != 'whatsapp_cloud'
AND id IN (
  SELECT DISTINCT t.\"contactId\"
  FROM \"Tickets\" t
  JOIN \"Messages\" m ON m.\"ticketId\" = t.id
  WHERE m.channel = 'whatsapp_cloud'
);

-- 2. Corrigir contacts cujas mensagens indicam canal Telegram
UPDATE \"Contacts\" SET channel = 'telegram'
WHERE channel != 'telegram'
AND id IN (
  SELECT DISTINCT t.\"contactId\"
  FROM \"Tickets\" t
  JOIN \"Messages\" m ON m.\"ticketId\" = t.id
  WHERE m.channel = 'telegram'
);

-- 3. Corrigir tickets com channel errado baseado nos contatos
UPDATE \"Tickets\" SET channel = c.channel
FROM \"Contacts\" c
WHERE \"Tickets\".\"contactId\" = c.id
AND c.channel IN ('whatsapp_cloud', 'telegram')
AND \"Tickets\".channel != c.channel;

-- 4. Verificar resultado
SELECT channel, COUNT(*) FROM \"Tickets\" GROUP BY channel;
SELECT channel, COUNT(*) FROM \"Contacts\" GROUP BY channel;
"
