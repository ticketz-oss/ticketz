import {
  Table,
  Column,
  Model,
  PrimaryKey,
  CreatedAt,
  DataType,
  UpdatedAt,
  BelongsTo
} from "sequelize-typescript";
import Message from "./Message";
import Ticket from "./Ticket";

@Table
class NotificamehubIdMapping extends Model<NotificamehubIdMapping> {
  @PrimaryKey
  @Column
  id: string;

  @Column
  messageId: string;

  @Column
  ticketId: number;

  @CreatedAt
  @Column(DataType.DATE(6))
  createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE(6))
  updatedAt: Date;

  @BelongsTo(() => Message, "messageId")
  message: Message;

  @BelongsTo(() => Ticket, "ticketId")
  ticket: Ticket;
}

export default NotificamehubIdMapping;
