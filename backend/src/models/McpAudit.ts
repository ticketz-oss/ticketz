import {
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";

@Table({ tableName: "McpAudits", updatedAt: false })
class McpAudit extends Model<McpAudit> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.UUID)
  correlationId: string;

  @Column(DataType.UUID)
  grantId: string;

  @Column
  userId: number;

  @Column
  companyId: number;

  @Column
  event: string;

  @Column
  tool: string;

  @Column(DataType.JSONB)
  filters: Record<string, unknown>;

  @Column
  recordCount: number;

  @Column
  messageCount: number;

  @Column
  durationMs: number;

  @Column
  status: string;

  @CreatedAt
  createdAt: Date;
}

export default McpAudit;
