import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  DataType
} from "sequelize-typescript";
import Ticket from "./Ticket";
import Integration from "./Integration";

@Table
// eslint-disable-next-line no-use-before-define
class IntegrationSession extends Model<IntegrationSession> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  token: string;

  @Column
  sessionId: string;

  @Column(DataType.JSONB)
  data: unknown;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => Integration)
  @Column
  integrationId: number;

  @BelongsTo(() => Integration)
  integration: Integration;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default IntegrationSession;
