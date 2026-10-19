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
import TaskBoardTask from "./TaskBoardTask";

@Table({ tableName: "TaskBoardColumns" })
class TaskBoardColumn extends Model<TaskBoardColumn> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  title: string;

  @Column
  color: string;

  @AllowNull(false)
  @Default(0)
  @Column
  position: number;

  @AllowNull(false)
  @Default(false)
  @Column
  isDone: boolean;

  @AllowNull(false)
  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => TaskBoardTask)
  tasks: TaskBoardTask[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TaskBoardColumn;
