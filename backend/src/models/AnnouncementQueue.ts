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
import Queue from "./Queue";

@Table({ tableName: "AnnouncementQueues" })
class AnnouncementQueue extends Model<AnnouncementQueue> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Announcement)
  @Column
  announcementId: number;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @BelongsTo(() => Announcement)
  announcement: Announcement;

  @BelongsTo(() => Queue)
  queue: Queue;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default AnnouncementQueue;
