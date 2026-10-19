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
import User from "./User";

@Table({ tableName: "AnnouncementUsers" })
class AnnouncementUser extends Model<AnnouncementUser> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Announcement)
  @Column
  announcementId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => Announcement)
  announcement: Announcement;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AnnouncementUser;
