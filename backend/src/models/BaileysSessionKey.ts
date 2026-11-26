import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";

@Table({ timestamps: false, tableName: "BaileysSessionKeys" })
class BaileysSessionKey extends Model<BaileysSessionKey> {
  @PrimaryKey
  @Column(DataType.UUID)
  sessionId: string;

  @PrimaryKey
  @Column(DataType.TEXT)
  type: string;

  @PrimaryKey
  @Column(DataType.TEXT)
  key: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  value: string;
}

export default BaileysSessionKey;
