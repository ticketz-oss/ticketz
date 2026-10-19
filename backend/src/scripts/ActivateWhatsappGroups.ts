import sequelize from "../database";

const activate = async (activationId: string): Promise<void> => {
  await sequelize.transaction(async transaction => {
    await sequelize.query(
      `
        INSERT INTO "GroupSettingSnapshots"
          ("activationId", "companyId", "checkMsgIsGroup", "groupsTab",
           "soundGroupNotifications", "createdAt", "updatedAt")
        SELECT :activationId, c.id,
          (SELECT s.value FROM "Settings" s
           WHERE s."companyId" = c.id AND s.key = 'CheckMsgIsGroup' LIMIT 1),
          (SELECT s.value FROM "Settings" s
           WHERE s."companyId" = c.id AND s.key = 'groupsTab' LIMIT 1),
          (SELECT s.value FROM "Settings" s
           WHERE s."companyId" = c.id AND s.key = 'soundGroupNotifications' LIMIT 1),
          NOW(), NOW()
        FROM "Companies" c
        WHERE NOT EXISTS (
          SELECT 1 FROM "GroupSettingSnapshots" snapshot
          WHERE snapshot."activationId" = :activationId
            AND snapshot."companyId" = c.id
        );
      `,
      { replacements: { activationId }, transaction }
    );

    await sequelize.query(
      `
        UPDATE "Settings" SET value = 'disabled', "updatedAt" = NOW()
        WHERE key = 'CheckMsgIsGroup';
        INSERT INTO "Settings" (key, value, "companyId", "createdAt", "updatedAt")
        SELECT 'CheckMsgIsGroup', 'disabled', c.id, NOW(), NOW()
        FROM "Companies" c
        WHERE NOT EXISTS (
          SELECT 1 FROM "Settings" s
          WHERE s."companyId" = c.id AND s.key = 'CheckMsgIsGroup'
        );

        UPDATE "Settings" SET value = 'enabled', "updatedAt" = NOW()
        WHERE key = 'groupsTab';
        INSERT INTO "Settings" (key, value, "companyId", "createdAt", "updatedAt")
        SELECT 'groupsTab', 'enabled', c.id, NOW(), NOW()
        FROM "Companies" c
        WHERE NOT EXISTS (
          SELECT 1 FROM "Settings" s
          WHERE s."companyId" = c.id AND s.key = 'groupsTab'
        );

        UPDATE "Tickets" t
        SET status = 'open', "userId" = NULL, "queueId" = NULL,
            chatbot = false, "unreadMessages" = 0, "updatedAt" = NOW()
        FROM "Contacts" c
        WHERE t."contactId" = c.id
          AND t."isGroup" = true
          AND c."groupMode" = 'conversation';

        UPDATE "TicketTraking" tracking
        SET expired = true, "finishedAt" = COALESCE(tracking."finishedAt", NOW()),
            "updatedAt" = NOW()
        FROM "Tickets" t
        JOIN "Contacts" c ON c.id = t."contactId"
        WHERE tracking."ticketId" = t.id
          AND t."isGroup" = true
          AND c."groupMode" = 'conversation'
          AND tracking."finishedAt" IS NULL;

        UPDATE "GroupReadStates" state
        SET "unreadCount" = 0, "lastReadAt" = NOW(), "updatedAt" = NOW()
        FROM "Tickets" t
        JOIN "Contacts" c ON c.id = t."contactId"
        WHERE state."ticketId" = t.id
          AND c."groupMode" = 'conversation';
      `,
      { transaction }
    );
  });
};

const rollback = async (activationId: string): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const snapshotCte = `
      WITH snapshots AS (
        SELECT * FROM "GroupSettingSnapshots"
        WHERE "activationId" = :activationId AND "revertedAt" IS NULL
      )
    `;

    await sequelize.query(
      `${snapshotCte}
       DELETE FROM "Settings" setting USING snapshots
       WHERE setting."companyId" = snapshots."companyId"
         AND ((setting.key = 'CheckMsgIsGroup' AND snapshots."checkMsgIsGroup" IS NULL)
           OR (setting.key = 'groupsTab' AND snapshots."groupsTab" IS NULL)
           OR (setting.key = 'soundGroupNotifications'
             AND snapshots."soundGroupNotifications" IS NULL));`,
      { replacements: { activationId }, transaction }
    );

    await sequelize.query(
      `${snapshotCte}
       UPDATE "Settings" setting
       SET value = CASE setting.key
         WHEN 'CheckMsgIsGroup' THEN snapshots."checkMsgIsGroup"
         WHEN 'groupsTab' THEN snapshots."groupsTab"
         WHEN 'soundGroupNotifications' THEN snapshots."soundGroupNotifications"
       END,
       "updatedAt" = NOW()
       FROM snapshots
       WHERE setting."companyId" = snapshots."companyId"
         AND ((setting.key = 'CheckMsgIsGroup' AND snapshots."checkMsgIsGroup" IS NOT NULL)
           OR (setting.key = 'groupsTab' AND snapshots."groupsTab" IS NOT NULL)
           OR (setting.key = 'soundGroupNotifications'
             AND snapshots."soundGroupNotifications" IS NOT NULL));`,
      { replacements: { activationId }, transaction }
    );

    await sequelize.query(
      `UPDATE "GroupSettingSnapshots"
       SET "revertedAt" = NOW(), "updatedAt" = NOW()
       WHERE "activationId" = :activationId AND "revertedAt" IS NULL;`,
      { replacements: { activationId }, transaction }
    );
  });
};

const run = async (): Promise<void> => {
  const [, , action, activationId] = process.argv;
  if (!activationId || !["activate", "rollback"].includes(action)) {
    throw new Error(
      "Usage: node dist/scripts/ActivateWhatsappGroups.js <activate|rollback> <activation-id>"
    );
  }

  if (action === "activate") {
    await activate(activationId);
  } else {
    await rollback(activationId);
  }
};

run()
  .then(() => sequelize.close())
  .catch(async error => {
    console.error(error);
    await sequelize.close();
    process.exit(1);
  });
