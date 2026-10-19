import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";

import Whatsapp from "./Whatsapp";

@Table
class OutOfTicketMessage extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column(DataType.STRING)
  dataJson: string;

  @CreatedAt
  @Column(DataType.DATE(6))
  createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE(6))
  updatedAt: Date;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: string;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;
}

export default OutOfTicketMessage;
