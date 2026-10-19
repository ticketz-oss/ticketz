import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  DataType,
  AllowNull,
  BelongsTo,
  Default
} from "sequelize-typescript";
import Whatsapp from "./Whatsapp";

@Table({ tableName: "BaileysContacts" })
class BaileysContact extends Model {
  @PrimaryKey
  @ForeignKey(() => Whatsapp)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @PrimaryKey
  @AllowNull(false)
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

export default BaileysContact;
