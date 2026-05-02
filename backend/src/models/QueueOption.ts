import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull,
  HasMany,
  DataType,
  AfterFind
} from "sequelize-typescript";
import { FindOptions, QueryTypes } from "sequelize";
import Queue from "./Queue";

type TopParentQueueRow = {
  originId: number;
  topParentQueueId: number;
  topParentQueueCompanyId: number;
  topParentQueueName: string;
  topParentQueueColor: string;
};

type TopParentQueueSummary = Pick<Queue, "id" | "companyId" | "name" | "color">;

type QueueOptionFindOptions = FindOptions & {
  hooks?: boolean;
  resolveTopParentQueue?: boolean;
};

@Table
class QueueOption extends Model<QueueOption> {
  static withTopParentQueue<T extends QueueOptionFindOptions>(
    options?: T
  ): QueueOptionFindOptions {
    return {
      ...(options || {}),
      hooks: true,
      resolveTopParentQueue: true
    };
  }

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  title: string;

  @AllowNull
  @Column
  message: string;

  @AllowNull
  @Column
  option: string;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @ForeignKey(() => QueueOption)
  @Column
  parentId: number;

  @ForeignKey(() => Queue)
  @AllowNull
  @Column
  forwardQueueId: number;

  @Column
  exitChatbot: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Queue)
  queue: Queue;

  @BelongsTo(() => QueueOption, { foreignKey: "parentId" })
  parent: QueueOption;

  @BelongsTo(() => Queue, { foreignKey: "forwardQueueId" })
  forwardQueue: Queue;

  @HasMany(() => QueueOption, {
    onDelete: "DELETE",
    onUpdate: "DELETE",
    hooks: true
  })
  options: QueueOption[];

  @Column
  mediaPath: string;

  @Column
  mediaName: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue("topParentQueueId");
    }
  })
  topParentQueueId: number;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue("topParentQueue");
    }
  })
  topParentQueue: TopParentQueueSummary;

  @AfterFind
  static async resolveTopParentQueue(
    found: QueueOption | QueueOption[] | null,
    options?: QueueOptionFindOptions
  ): Promise<void> {
    if (!found || !options?.resolveTopParentQueue) {
      return;
    }

    const instances = Array.isArray(found) ? found : [found];
    const queueOptions = instances.filter(
      item => item && Number.isInteger(item.id)
    );

    if (!queueOptions.length || !this.sequelize) {
      return;
    }

    const ids = queueOptions.map(queueOption => queueOption.id);
    const rows = await this.sequelize.query<TopParentQueueRow>(
      `
      WITH RECURSIVE option_tree AS (
        SELECT
          qo.id AS "originId",
          qo."parentId",
          qo."queueId",
          0 AS depth
        FROM "QueueOptions" qo
        WHERE qo.id = ANY(ARRAY[:ids]::int[])

        UNION ALL

        SELECT
          ot."originId",
          parent."parentId",
          parent."queueId",
          ot.depth + 1 AS depth
        FROM option_tree ot
        INNER JOIN "QueueOptions" parent ON parent.id = ot."parentId"
        WHERE ot."queueId" IS NULL
          AND ot.depth < 100
      )
      SELECT DISTINCT ON (ot."originId")
        ot."originId" AS "originId",
        q.id AS "topParentQueueId",
        q."companyId" AS "topParentQueueCompanyId",
        q.name AS "topParentQueueName",
        q.color AS "topParentQueueColor"
      FROM option_tree ot
      INNER JOIN "Queues" q ON q.id = ot."queueId"
      ORDER BY ot."originId", ot.depth ASC
      `,
      {
        replacements: { ids },
        type: QueryTypes.SELECT
      }
    );

    const rowsByOriginId = new Map<number, TopParentQueueRow>(
      rows.map(row => [row.originId, row])
    );

    queueOptions.forEach(queueOption => {
      const row = rowsByOriginId.get(queueOption.id);

      if (!row) {
        queueOption.setDataValue("topParentQueueId", null);
        queueOption.setDataValue("topParentQueue", null);
        return;
      }

      queueOption.setDataValue("topParentQueueId", row.topParentQueueId);
      queueOption.setDataValue("topParentQueue", {
        id: row.topParentQueueId,
        companyId: row.topParentQueueCompanyId,
        name: row.topParentQueueName,
        color: row.topParentQueueColor
      });
    });
  }
}

export default QueueOption;
