import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";

@Table({ tableName: "BaileysSessionContacts" })
class BaileysSessionContact extends Model<BaileysSessionContact> {
  @PrimaryKey
  @Column(DataType.UUID)
  sessionId: string;

  @PrimaryKey
  @Column(DataType.TEXT)
  contactId: string;

  @Default({})
  @AllowNull(false)
  @Column(DataType.JSONB)
  payload: Record<string, unknown>;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default BaileysSessionContact;
