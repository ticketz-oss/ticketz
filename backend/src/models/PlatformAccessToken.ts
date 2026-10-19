import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";

@Table({ tableName: "PlatformAccessTokens", updatedAt: false })
class PlatformAccessToken extends Model<PlatformAccessToken> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING(64))
  tokenHash: string;

  @AllowNull(false)
  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column
  userId: number;

  @AllowNull(false)
  @Default("sso")
  @Column
  kind: string;

  @Column
  motivo: string;

  @Column
  ator: string;

  @AllowNull(false)
  @Column
  expiresAt: Date;

  @Column
  usedAt: Date;

  @CreatedAt
  createdAt: Date;
}

export default PlatformAccessToken;
