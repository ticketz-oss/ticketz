import { Model, Column, Table, PrimaryKey, AutoIncrement, UpdatedAt, CreatedAt, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import Company from './Company';
import User from './User';


@Table({ tableName: "Tasks" })
class Tasks extends Model<Tasks>{

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  title: string;

  @Column
  description: string;

  @Default("open")
  @Column
  status: string;

  @Default(true)
  @Column
  isPrivate: boolean;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column
  startedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

}

export default Tasks;
