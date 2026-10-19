import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  Default,
  HasMany
} from "sequelize-typescript";
import Contact from "./Contact";
import Message from "./Message";

import Partner from "./Partner";
import Plan from "./Plan";
import Queue from "./Queue";
import Setting from "./Setting";
import Ticket from "./Ticket";
import TicketTraking from "./TicketTraking";
import User from "./User";
import UserRating from "./UserRating";
import Whatsapp from "./Whatsapp";
import { OpenHoursData } from "../helpers/checkOpenHours";
import TaskBoardColumn from "./TaskBoardColumn";
import TaskBoardTask from "./TaskBoardTask";

@Table
class Company extends Model<Company> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  phone: string;

  @Column
  email: string;

  @Column
  status: boolean;

  @Column
  dueDate: string;

  @Column(DataType.INTEGER)
  trialDays: number;

  @Column(DataType.DATEONLY)
  trialEndsAt: string;

  @Default("admin")
  @Column(DataType.STRING(30))
  signupSource: "admin" | "self_service" | "partner";

  @Column(DataType.DATE)
  trialStartedAt: Date;

  @Column(DataType.DATE)
  trialExpiresAt: Date;

  @Column(DataType.SMALLINT)
  dueDay: number;

  @Column
  recurrence: string;

  @Column({
    type: DataType.JSONB
  })
  schedules: OpenHoursData;

  @ForeignKey(() => Plan)
  @Column
  planId: number;

  @BelongsTo(() => Plan)
  plan: Plan;

  @Column
  language: string;

  @Column(DataType.STRING(100))
  timezone: string | null;

  @Column
  slug: string;

  @Default("normal")
  @Column(DataType.STRING)
  whatsappMode: "normal" | "meta";

  // WhatsApp Status (stories) stays off for every tenant until a super admin
  // switches it on.
  @Default(false)
  @Column(DataType.BOOLEAN)
  whatsappStatusEnabled: boolean;

  @Column
  platformStatus: string;

  @Column
  platformPreviousStatus: string;

  @Column
  platformBilling: string;

  // AI package chosen at signup on plans where AI is billed separately.
  @Column
  aiAddon: string;

  @Column
  platformPartnerRef: string;

  @Column(DataType.JSONB)
  platformLimits: Record<string, number>;

  @Column
  platformCancelledAt: Date;

  @Column(DataType.DATEONLY)
  platformDataUntil: string;

  // Parceiro que revendeu esta empresa. Nulo em vendas diretas.
  @ForeignKey(() => Partner)
  @Column
  partnerId: number;

  @BelongsTo(() => Partner)
  partner: Partner;

  // Preco negociado pelo parceiro. Quando nulo, a fatura usa o valor do plano.
  @Column(DataType.FLOAT)
  saleValue: number;

  // Preco cobrado durante o periodo inicial. Pode ser maior ou menor que o
  // saleValue; terminado o periodo, a cobranca volta para ele.
  @Column(DataType.FLOAT)
  introValue: number;

  // Duracao em meses do periodo inicial.
  @Column(DataType.INTEGER)
  introMonths: number;

  // Snapshot do que a plataforma recebe por ciclo, travado na venda.
  @Column(DataType.FLOAT)
  platformCost: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => User, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  users: User[];

  @HasMany(() => UserRating, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  userRatings: UserRating[];

  @HasMany(() => Queue, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  queues: Queue[];

  @HasMany(() => Whatsapp, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  whatsapps: Whatsapp[];

  @HasMany(() => Message, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  messages: Message[];

  @HasMany(() => Contact, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  contacts: Contact[];

  @HasMany(() => Setting, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  settings: Setting[];

  @HasMany(() => Ticket, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  tickets: Ticket[];

  @HasMany(() => TicketTraking, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  ticketTrankins: TicketTraking[];

  @HasMany(() => TaskBoardColumn, { onDelete: "CASCADE" })
  taskBoardColumns: TaskBoardColumn[];

  @HasMany(() => TaskBoardTask, { onDelete: "CASCADE" })
  taskBoardTasks: TaskBoardTask[];
}

export default Company;
