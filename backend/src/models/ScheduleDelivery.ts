import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Contact from "./Contact";
import Schedule from "./Schedule";

@Table({ tableName: "ScheduleDeliveries" })
class ScheduleDelivery extends Model<ScheduleDelivery> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Schedule)
  @Column
  scheduleId: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @Column
  occurrenceKey: string;

  @Column
  scheduledAt: Date;

  @Column
  queuedAt: Date;

  @Column
  sentAt: Date;

  @Column
  status: "PENDING" | "QUEUED" | "SENT" | "ERROR" | "SKIPPED";

  @Column
  errorMessage: string;

  @Column
  contactName: string;

  @Column
  contactNumber: string;

  @BelongsTo(() => Schedule)
  schedule: Schedule;

  @BelongsTo(() => Contact)
  contact: Contact;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ScheduleDelivery;
