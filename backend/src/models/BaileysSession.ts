import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";

@Table
class BaileysSession extends Model<BaileysSession> {
  @PrimaryKey
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  whatsappId: number;

  @Column(DataType.TEXT)
  credentials: string;

  @Column(DataType.DATE)
  retiredAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default BaileysSession;
