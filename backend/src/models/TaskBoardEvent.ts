import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import TaskBoardColumn from "./TaskBoardColumn";
import TaskBoardTask from "./TaskBoardTask";
import User from "./User";

@Table({ tableName: "TaskBoardEvents", updatedAt: false })
class TaskBoardEvent extends Model<TaskBoardEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => TaskBoardTask)
  @Column
  taskId: number;

  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  eventType: "CREATED" | "EDITED" | "MOVED" | "COMPLETED" | "REOPENED";

  @ForeignKey(() => TaskBoardColumn)
  @Column
  fromColumnId: number;

  @ForeignKey(() => TaskBoardColumn)
  @Column
  toColumnId: number;

  @Column(DataType.JSONB)
  data: Record<string, unknown>;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => TaskBoardColumn, "fromColumnId")
  fromColumn: TaskBoardColumn;

  @BelongsTo(() => TaskBoardColumn, "toColumnId")
  toColumn: TaskBoardColumn;

  @CreatedAt
  createdAt: Date;
}

export default TaskBoardEvent;
