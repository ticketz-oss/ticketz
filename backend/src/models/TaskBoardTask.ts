import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import Queue from "./Queue";
import TaskBoardColumn from "./TaskBoardColumn";
import TaskBoardEvent from "./TaskBoardEvent";
import User from "./User";

@Table({ tableName: "TaskBoardTasks" })
class TaskBoardTask extends Model<TaskBoardTask> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  title: string;

  @AllowNull(false)
  @Default("")
  @Column
  description: string;

  @AllowNull(false)
  @Default("GLOBAL")
  @Column
  targetType: "GLOBAL" | "USER" | "QUEUE";

  @ForeignKey(() => User)
  @Column
  assignedUserId: number;

  @BelongsTo(() => User, "assignedUserId")
  assignedUser: User;

  @ForeignKey(() => Queue)
  @Column
  assignedQueueId: number;

  @BelongsTo(() => Queue, "assignedQueueId")
  assignedQueue: Queue;

  @Column
  dueAt: Date;

  @AllowNull(false)
  @Default(0)
  @Column
  position: number;

  @Column
  completedAt: Date;

  @ForeignKey(() => User)
  @Column
  completedById: number;

  @BelongsTo(() => User, "completedById")
  completedBy: User;

  @ForeignKey(() => User)
  @Column
  createdById: number;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @AllowNull(false)
  @Default(0)
  @Column
  version: number;

  @AllowNull(false)
  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @AllowNull(false)
  @ForeignKey(() => TaskBoardColumn)
  @Column
  columnId: number;

  @BelongsTo(() => TaskBoardColumn)
  column: TaskBoardColumn;

  @HasMany(() => TaskBoardEvent)
  events: TaskBoardEvent[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TaskBoardTask;
