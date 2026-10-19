import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import VoiceCall from "./VoiceCall";
import Whatsapp from "./Whatsapp";

@Table
class VoiceConnection extends Model<VoiceConnection> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @Column(DataType.STRING(64))
  sessionId: string;

  @Column(DataType.STRING(24))
  state: string;

  @Column
  paired: boolean;

  @Column(DataType.TEXT)
  lastError: string;

  @HasMany(() => VoiceCall)
  calls: VoiceCall[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default VoiceConnection;
