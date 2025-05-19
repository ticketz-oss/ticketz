import { QueryInterface, DataTypes, Transaction } from "sequelize";

async function createCounters(
  queryInterface: QueryInterface,
  transaction,
  serie: string,
  timeField: string
) {
  return queryInterface.sequelize.query(
    `
    INSERT INTO "Counters" ("companyId", "serie", "timestamp", "value")
    SELECT
      "companyId",
      '${serie}' AS "serie",
      DATE_TRUNC('hour', "${timeField}") + INTERVAL '30 minutes' * DIV(EXTRACT(MINUTE FROM "${timeField}"), 30) AS "timestamp",
      COUNT(*) AS "value"
    FROM "TicketTraking"
    WHERE "${timeField}" IS NOT NULL AND "companyId" IS NOT NULL
    GROUP BY "companyId", "timestamp";
    `,
    { transaction }
  );
}

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction: Transaction =
      await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        "Counters",
        {
          companyId: {
            type: DataTypes.INTEGER,
            references: { model: "Companies", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            allowNull: false
          },
          serie: {
            type: DataTypes.STRING,
            allowNull: false
          },
          timestamp: {
            type: DataTypes.DATE,
            allowNull: false
          },
          value: {
            type: DataTypes.INTEGER,
            allowNull: false
          }
        },
        { transaction }
      );

      await queryInterface.addConstraint("Counters", {
        fields: ["companyId", "serie", "timestamp"],
        type: "primary key",
        name: "Counters_companyid_serie_timestamp_pk",
        transaction
      });

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Counters"
        ADD COLUMN "day" DATE GENERATED ALWAYS AS (DATE("timestamp" AT TIME ZONE 'UTC')) STORED,
        ADD COLUMN "twelve_hours" TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (
          (DATE_TRUNC('day', "timestamp" AT TIME ZONE 'UTC') + INTERVAL '1 hour' * DIV(EXTRACT(HOUR FROM "timestamp" AT TIME ZONE 'UTC'), 12) * 12) AT TIME ZONE 'UTC'
        ) STORED,
        ADD COLUMN "six_hours" TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (
          (DATE_TRUNC('day', "timestamp" AT TIME ZONE 'UTC') + INTERVAL '1 hour' * DIV(EXTRACT(HOUR FROM "timestamp" AT TIME ZONE 'UTC'), 6) * 6) AT TIME ZONE 'UTC'
        ) STORED,
        ADD COLUMN "three_hours" TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (
          (DATE_TRUNC('day', "timestamp" AT TIME ZONE 'UTC') + INTERVAL '1 hour' * DIV(EXTRACT(HOUR FROM "timestamp" AT TIME ZONE 'UTC'), 3) * 3) AT TIME ZONE 'UTC'
        ) STORED,
        ADD COLUMN "hour" TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (
          DATE_TRUNC('hour', "timestamp" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
        ) STORED;
        `,
        { transaction }
      );

      await queryInterface.addIndex("Counters", ["day"], {
        name: "index_day",
        transaction
      });
      await queryInterface.addIndex("Counters", ["twelve_hours"], {
        name: "index_twelve_hours",
        transaction
      });
      await queryInterface.addIndex("Counters", ["six_hours"], {
        name: "index_six_hours",
        transaction
      });
      await queryInterface.addIndex("Counters", ["three_hours"], {
        name: "index_three_hours",
        transaction
      });
      await queryInterface.addIndex("Counters", ["hour"], {
        name: "index_hour",
        transaction
      });

      await createCounters(
        queryInterface,
        transaction,
        "ticket-create",
        "createdAt"
      );

      await createCounters(
        queryInterface,
        transaction,
        "ticket-accept",
        "startedAt"
      );

      await createCounters(
        queryInterface,
        transaction,
        "ticket-transfer",
        "queuedAt"
      );

      await createCounters(
        queryInterface,
        transaction,
        "ticket-close",
        "finishedAt"
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("Counters");
  }
};
