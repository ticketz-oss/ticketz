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
import Company from "./Company";
import OAuthClient from "./OAuthClient";
import User from "./User";

@Table({ tableName: "OAuthGrants" })
class OAuthGrant extends Model<OAuthGrant> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => OAuthClient)
  @AllowNull(false)
  @Column(DataType.UUID)
  oauthClientId: string;

  @BelongsTo(() => OAuthClient)
  oauthClient: OAuthClient;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING))
  scopes: string[];

  @AllowNull(false)
  @Column
  tokenVersion: number;

  @Default(true)
  @Column
  active: boolean;

  @Column
  revokedAt: Date;

  @Column
  lastUsedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default OAuthGrant;
