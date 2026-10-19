import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique
} from "sequelize-typescript";

@Table({ tableName: "PlatformWebhookOutboxes", updatedAt: false })
class PlatformWebhookOutbox extends Model<PlatformWebhookOutbox> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Unique
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  eventId: string;

  @AllowNull(false)
  @Column
  evento: string;

  @AllowNull(false)
  @Column
  tenantId: number;

  @AllowNull(false)
  @Column(DataType.JSONB)
  payload: Record<string, unknown>;

  @AllowNull(false)
  @Default("pending")
  @Column
  status: string;

  @AllowNull(false)
  @Default(0)
  @Column
  attempts: number;

  @Column
  nextAttemptAt: Date;

  @Column(DataType.TEXT)
  lastError: string;

  @Column
  sentAt: Date;

  @CreatedAt
  createdAt: Date;
}

export default PlatformWebhookOutbox;
