UPDATE "Contacts" SET channel = 'whatsapp_cloud' WHERE channel != 'whatsapp_cloud' AND id IN (SELECT DISTINCT t."contactId" FROM "Tickets" t JOIN "Messages" m ON m."ticketId" = t.id WHERE m.channel = 'whatsapp_cloud');
UPDATE "Contacts" SET channel = 'telegram' WHERE channel != 'telegram' AND id IN (SELECT DISTINCT t."contactId" FROM "Tickets" t JOIN "Messages" m ON m."ticketId" = t.id WHERE m.channel = 'telegram');
UPDATE "Tickets" SET channel = c.channel FROM "Contacts" c WHERE "Tickets"."contactId" = c.id AND c.channel IN ('whatsapp_cloud', 'telegram') AND "Tickets".channel != c.channel;
SELECT channel, COUNT(*) FROM "Tickets" GROUP BY channel;
SELECT channel, COUNT(*) FROM "Contacts" GROUP BY channel;
