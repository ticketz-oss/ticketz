import {
    Table,
    Column,
    Model,
    ForeignKey,
    BelongsTo,
    DataType,
    PrimaryKey,
  } from "sequelize-typescript";
import Whatsapp from "./Whatsapp";

@Table({ timestamps: false })
class BaileysKeys extends Model<BaileysKeys> {
  @PrimaryKey
  @ForeignKey(() => Whatsapp)
  @Column(DataType.INTEGER)
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @PrimaryKey
  @Column(DataType.TEXT)
  type: string;

  @PrimaryKey
  @Column(DataType.TEXT)
  key: string;

  @Column(DataType.TEXT)
  value: string;
}

export default BaileysKeys;
