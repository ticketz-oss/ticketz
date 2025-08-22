import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Whatsapp from "./Whatsapp";

@Table
export default class Wavoip extends Model<Wavoip> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.TEXT)
  token: string;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;
}
