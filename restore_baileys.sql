-- Restaurar tickets do Baileys: se o ticket tem um whatsappId que pertence a uma conexão Baileys, restaurar channel para 'whatsapp'
UPDATE "Tickets" SET channel = 'whatsapp'
WHERE channel = 'whatsapp_cloud'
AND "whatsappId" IN (
  SELECT id FROM "Whatsapps" WHERE channel = 'whatsapp' OR channel IS NULL
);

-- Restaurar contatos do Baileys: se o contato está associado apenas a tickets de Baileys
-- (sem tickets de whatsapp_cloud), restaurar para 'whatsapp'
UPDATE "Contacts" SET channel = 'whatsapp'
WHERE channel = 'whatsapp_cloud'
AND id NOT IN (
  SELECT DISTINCT t."contactId"
  FROM "Tickets" t
  WHERE t.channel = 'whatsapp_cloud'
);

-- Verificar resultado final
SELECT w.channel as connection_channel, t.channel as ticket_channel, COUNT(*) 
FROM "Tickets" t 
JOIN "Whatsapps" w ON t."whatsappId" = w.id
GROUP BY w.channel, t.channel
ORDER BY w.channel, t.channel;

SELECT channel, COUNT(*) FROM "Tickets" GROUP BY channel;
SELECT channel, COUNT(*) FROM "Contacts" GROUP BY channel;
