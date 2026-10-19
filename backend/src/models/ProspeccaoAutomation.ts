import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";
import Whatsapp from "./Whatsapp";
import ProspeccaoSchedule from "./ProspeccaoSchedule";

@Table({ tableName: "ProspeccaoAutomacoes" })
class ProspeccaoAutomation extends Model<ProspeccaoAutomation> {
  @PrimaryKey @AutoIncrement @Column id: number;
  @ForeignKey(() => Company) @Column companyId: number;
  @Default(false) @Column enabled: boolean;
  @AllowNull @Column enabledAt: Date;
  @ForeignKey(() => Whatsapp) @AllowNull @Column whatsappId: number;
  @ForeignKey(() => User) @AllowNull @Column userId: number;
  @Default(180) @Column minDelaySeconds: number;
  @Default(420) @Column maxDelaySeconds: number;
  @Default(30) @Column dailyLimit: number;
  @Default(false) @Column acknowledgedRisk: boolean;
  @BelongsTo(() => Company) company: Company;
  @BelongsTo(() => Whatsapp) whatsapp: Whatsapp;
  @BelongsTo(() => User) user: User;
  @HasMany(() => ProspeccaoSchedule) schedules: ProspeccaoSchedule[];
  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default ProspeccaoAutomation;
