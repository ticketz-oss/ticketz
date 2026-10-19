import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  HasOne
} from "sequelize-typescript";
import ContactCustomField from "./ContactCustomField";
import Ticket from "./Ticket";
import Company from "./Company";
import Schedule from "./Schedule";
import ContactTag from "./ContactTag";
import Tag from "./Tag";
import WhatsappLidMap from "./WhatsappLidMap";
import GroupQueue from "./GroupQueue";

@Table
class Contact extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default(false)
  @Column
  nameLocked: boolean;

  @Default("")
  @Column
  nickname: string;

  @Column
  birthdayDay: number;

  @Column
  birthdayMonth: number;

  @AllowNull(false)
  @Unique
  @Column
  number: string;

  @AllowNull(false)
  @Default("")
  @Column
  email: string;

  @Default("")
  @Column
  profilePicUrl: string;

  @Default("")
  @Column
  profileHiresPictureUrl: string;

  @Default("whatsapp")
  @Column
  channel: string;

  @Default(false)
  @Column
  isGroup: boolean;

  @Column
  groupMode: "conversation" | "ticket" | null;

  @Default(false)
  @Column
  disableBot: boolean;

  @Default("available")
  @Column
  presence: string;

  @Column
  language: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => ContactCustomField)
  extraInfo: ContactCustomField[];

  @HasOne(() => WhatsappLidMap)
  whatsappLidMap: WhatsappLidMap;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Schedule, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  schedules: Schedule[];

  @HasMany(() => ContactTag)
  contactTags: ContactTag[];

  @BelongsToMany(() => Tag, () => ContactTag)
  tags: Tag[];

  @HasMany(() => GroupQueue)
  groupQueues: GroupQueue[];
}

export default Contact;
