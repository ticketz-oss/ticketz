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
  BelongsToMany,
  Default,
  ForeignKey,
  HasMany
} from "sequelize-typescript";
import Company from "./Company";
import Queue from "./Queue";
import User from "./User";
import Whatsapp from "./Whatsapp";
import AnnouncementQueue from "./AnnouncementQueue";
import AnnouncementUser from "./AnnouncementUser";
import AnnouncementWhatsapp from "./AnnouncementWhatsapp";

@Table
class Announcement extends Model<Announcement> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  priority: number; //1 - alta, 2 - média, 3 - baixa

  @Column
  title: string;

  @Column(DataType.TEXT)
  text: string;

  @Column
  mediaPath: string;

  @Column
  mediaName: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @Column
  status: boolean;

  @Column
  startsAt: Date;

  @Column
  endsAt: Date;

  @Default("ALL")
  @Column
  audienceMode: "ALL" | "SEGMENTED";

  @Column(DataType.ARRAY(DataType.STRING))
  profiles: string[];

  @Default(false)
  @Column
  isGlobal: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => AnnouncementUser)
  announcementUsers: AnnouncementUser[];

  @HasMany(() => AnnouncementQueue)
  announcementQueues: AnnouncementQueue[];

  @HasMany(() => AnnouncementWhatsapp)
  announcementWhatsapps: AnnouncementWhatsapp[];

  @BelongsToMany(() => User, () => AnnouncementUser)
  users: User[];

  @BelongsToMany(() => Queue, () => AnnouncementQueue)
  queues: Queue[];

  @BelongsToMany(() => Whatsapp, () => AnnouncementWhatsapp)
  whatsapps: Whatsapp[];
}

export default Announcement;
