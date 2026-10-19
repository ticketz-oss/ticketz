import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  BelongsTo
} from "sequelize-typescript";
import User from "./User"; // Importação da model User

@Table
class UserSocketSession extends Model<UserSocketSession> {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User; // Associação com User
}

export default UserSocketSession;
