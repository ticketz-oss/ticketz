import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Company from "./Company";

@Table
class ConnectionAlert extends Model<ConnectionAlert> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @AllowNull(false)
  @Column
  whatsappId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  eventType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  connectionName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  connectionChannel: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  occurredAt: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  severity: string;

  @AllowNull
  @Column(DataType.STRING)
  reason: string;

  @Default("pending")
  @Column(DataType.STRING)
  emailStatus: string;

  @AllowNull
  @Column(DataType.TEXT)
  emailError: string;

  @AllowNull
  @Column(DataType.INTEGER)
  recipientCount: number;

  @AllowNull
  @Column(DataType.DATE)
  emailedAt: Date;

  @Default(false)
  @Column
  viewed: boolean;

  @AllowNull
  @Column(DataType.DATE)
  viewedAt: Date;

  @AllowNull
  @Column(DataType.TEXT)
  metadata: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ConnectionAlert;