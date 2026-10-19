import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";

@Table({ tableName: "OAuthClients" })
class OAuthClient extends Model<OAuthClient> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientName: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  redirectUris: string[];

  @Default("none")
  @Column(DataType.STRING)
  tokenEndpointAuthMethod: string;

  @Default(true)
  @Column
  active: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default OAuthClient;
