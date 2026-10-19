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
import ProspeccaoLead from "./ProspeccaoLead";
import ProspeccaoSchedule from "./ProspeccaoSchedule";

@Table({ tableName: "ProspeccaoExecucoes" })
class ProspeccaoExecution extends Model<ProspeccaoExecution> {
  @PrimaryKey @AutoIncrement @Column id: number;
  @ForeignKey(() => ProspeccaoSchedule) @AllowNull @Column scheduleId: number;
  @ForeignKey(() => Company) @Column companyId: number;
  @Column localDate: string;
  @AllowNull @Column jobId: string;
  @Default("DUE") @Column status: string;
  @Default(0) @Column totalLeads: number;
  @Default(0) @Column newLeads: number;
  @AllowNull @Column errorMessage: string;
  @AllowNull @Column startedAt: Date;
  @AllowNull @Column finishedAt: Date;
  @BelongsTo(() => ProspeccaoSchedule) schedule: ProspeccaoSchedule;
  @HasMany(() => ProspeccaoLead) leads: ProspeccaoLead[];
  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default ProspeccaoExecution;
