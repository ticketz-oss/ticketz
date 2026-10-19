import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  BelongsTo,
  ForeignKey,
  HasMany,
  Default
} from "sequelize-typescript";
import Company from "./Company";
import Contact from "./Contact";
import Ticket from "./Ticket";
import User from "./User";
import CommemorativeDate from "./CommemorativeDate";
import ScheduleAudienceContact from "./ScheduleAudienceContact";
import ScheduleDelivery from "./ScheduleDelivery";

@Table
class Schedule extends Model<Schedule> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.TEXT)
  body: string;

  @Column
  sendAt: Date;

  @Default("ONCE")
  @Column
  kind: "ONCE" | "BIRTHDAY" | "COMMEMORATIVE";

  @Default("SELECTED")
  @Column
  audienceMode: "ALL" | "SELECTED";

  @Column
  sendTime: string;

  @Column
  timezone: string;

  @Column
  nextRunAt: Date;

  @Column
  sentAt: Date;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  saveMessage: boolean;

  @Column(DataType.TEXT)
  mediaPath: string;

  @Column(DataType.TEXT)
  mediaName: string;

  @Column
  mediaType: string;

  @Default("CAPTION")
  @Column
  mediaDeliveryMode: "CAPTION" | "SEPARATE";

  @Default(0)
  @Column
  totalRecipients: number;

  @Default(0)
  @Column
  sentCount: number;

  @Default(0)
  @Column
  errorCount: number;

  @Column
  lastRunAt: Date;

  @Default(true)
  @Column
  active: boolean;

  @ForeignKey(() => CommemorativeDate)
  @Column
  commemorativeDateId: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @Column(DataType.STRING)
  status: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Contact, "contactId")
  contact: Contact;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => CommemorativeDate)
  commemorativeDate: CommemorativeDate;

  @HasMany(() => ScheduleAudienceContact)
  audienceContacts: ScheduleAudienceContact[];

  @HasMany(() => ScheduleDelivery)
  deliveries: ScheduleDelivery[];
}

export default Schedule;
