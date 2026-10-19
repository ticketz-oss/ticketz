import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Unique
} from "sequelize-typescript";
import User from "./User";
import Company from "./Company";

@Table({ tableName: "PushSubscriptions" })
class PushSubscription extends Model<PushSubscription> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Unique
  @AllowNull(false)
  @Column(DataType.TEXT)
  endpoint: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  p256dh: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  auth: string;

  @Column(DataType.TEXT)
  userAgent: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default PushSubscription;
