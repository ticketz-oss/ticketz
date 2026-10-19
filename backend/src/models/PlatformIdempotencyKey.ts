import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique
} from "sequelize-typescript";

@Table({ tableName: "PlatformIdempotencyKeys", updatedAt: false })
class PlatformIdempotencyKey extends Model<PlatformIdempotencyKey> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Unique
  @Column
  key: string;

  @AllowNull(false)
  @Column
  method: string;

  @AllowNull(false)
  @Column
  path: string;

  @AllowNull(false)
  @Column(DataType.STRING(64))
  bodyHash: string;

  @Column
  statusCode: number;

  @Column(DataType.TEXT)
  responseBody: string;

  @CreatedAt
  createdAt: Date;
}

export default PlatformIdempotencyKey;
