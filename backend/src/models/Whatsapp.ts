import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  HasMany,
  Unique,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
  HasOne
} from "sequelize-typescript";
import Queue from "./Queue";
import Ticket from "./Ticket";
import WhatsappQueue from "./WhatsappQueue";
import Company from "./Company";
import Wavoip from "./Wavoip";
import { encryptSecret, decryptSecret } from "../helpers/cryptoSecret";

@Table
class Whatsapp extends Model<Whatsapp> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull
  @Unique
  @Column(DataType.TEXT)
  name: string;

  @Column(DataType.TEXT)
  session: string;

  @Column(DataType.TEXT)
  qrcode: string;

  @Column
  status: string;

  @Column
  battery: string;

  @Column
  plugged: boolean;

  @Column
  retries: number;

  @Default("")
  @Column(DataType.TEXT)
  greetingMessage: string;

  @Default("")
  @Column(DataType.TEXT)
  farewellMessage: string;

  @Default("")
  @Column(DataType.TEXT)
  complationMessage: string;

  @Default("")
  @Column(DataType.TEXT)
  outOfHoursMessage: string;

  @Default("")
  @Column(DataType.TEXT)
  ratingMessage: string;

  @Default("")
  @Column(DataType.TEXT)
  transferMessage: string;

  @Column({ defaultValue: "stable" })
  provider: string;

  @Default(false)
  @AllowNull
  @Column
  isDefault: boolean;

  @Column
  language: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @BelongsToMany(() => Queue, () => WhatsappQueue)
  queues: Array<Queue & { WhatsappQueue: WhatsappQueue }>;

  @HasMany(() => WhatsappQueue)
  whatsappQueues: WhatsappQueue[];

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column(DataType.TEXT)
  facebookUserId: string;

  @Column(DataType.TEXT)
  facebookUserToken: string;

  @Column(DataType.TEXT)
  facebookPageUserId: string;

  @Column(DataType.TEXT)
  tokenMeta: string;

  @HasOne(() => Wavoip)
  wavoip: Wavoip;

  @Column(DataType.TEXT)
  channel: string;

  // "baileys" (Web/multi-device, nao-oficial) ou "official" (WhatsApp Cloud
  // API da Meta). Sempre espelha Company.whatsappMode: nunca e escolhido
  // diretamente pelo usuario, e derivado na criacao da conexao.
  @Default("baileys")
  @Column(DataType.STRING)
  apiMode: string;

  @Column(DataType.TEXT)
  metaWabaId: string;

  @Column(DataType.TEXT)
  metaPhoneNumberId: string;

  @Column(DataType.TEXT)
  metaBusinessId: string;

  @Column(DataType.TEXT)
  get metaAccessToken(): string | null {
    const value = this.getDataValue("metaAccessToken");
    return value ? decryptSecret(value) : null;
  }

  set metaAccessToken(value: string | null) {
    this.setDataValue("metaAccessToken", value ? encryptSecret(value) : null);
  }

  @Column(DataType.DATE)
  metaTokenExpiresAt: Date;

  @Column(DataType.STRING)
  metaHealthStatus: string;

  @Column(DataType.DATE)
  metaHealthCheckedAt: Date;

  @Column(DataType.DATE)
  metaWebhookVerifiedAt: Date;
}

export default Whatsapp;
