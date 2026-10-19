import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";

@Table
class WebPushSubscription extends Model<WebPushSubscription> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.STRING(64))
  endpointHash: string;

  @Column(DataType.TEXT)
  endpoint: string;

  @Column(DataType.TEXT)
  p256dh: string;

  @Column(DataType.TEXT)
  auth: string;

  @Column(DataType.BIGINT)
  expirationTime: number | null;

  @Column(DataType.TEXT)
  userAgent: string | null;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active: boolean;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default WebPushSubscription;
