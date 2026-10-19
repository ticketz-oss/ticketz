import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import OAuthGrant from "./OAuthGrant";

@Table({ tableName: "OAuthRefreshTokens" })
class OAuthRefreshToken extends Model<OAuthRefreshToken> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => OAuthGrant)
  @AllowNull(false)
  @Column(DataType.UUID)
  grantId: string;

  @BelongsTo(() => OAuthGrant)
  grant: OAuthGrant;

  @AllowNull(false)
  @Column(DataType.UUID)
  familyId: string;

  @AllowNull(false)
  @Column(DataType.STRING(64))
  tokenHash: string;

  @AllowNull(false)
  @Column
  expiresAt: Date;

  @AllowNull(false)
  @Column
  absoluteExpiresAt: Date;

  @Column
  usedAt: Date;

  @Column
  revokedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default OAuthRefreshToken;
