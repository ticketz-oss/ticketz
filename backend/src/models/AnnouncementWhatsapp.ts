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
import Announcement from "./Announcement";
import Whatsapp from "./Whatsapp";

@Table({ tableName: "AnnouncementWhatsapps" })
class AnnouncementWhatsapp extends Model<AnnouncementWhatsapp> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Announcement)
  @Column
  announcementId: number;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Announcement)
  announcement: Announcement;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AnnouncementWhatsapp;
