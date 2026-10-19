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
import ProspeccaoAutomation from "./ProspeccaoAutomation";
import ProspeccaoExecution from "./ProspeccaoExecution";

@Table({ tableName: "ProspeccaoAgendas" })
class ProspeccaoSchedule extends Model<ProspeccaoSchedule> {
  @PrimaryKey @AutoIncrement @Column id: number;
  @ForeignKey(() => ProspeccaoAutomation) @Column automationId: number;
  @ForeignKey(() => Company) @Column companyId: number;
  @Column time: string;
  @Column nicho: string;
  @Column countryCode: string;
  @Column countryName: string;
  @AllowNull @Column stateCode: string;
  @AllowNull @Column stateName: string;
  @AllowNull @Column cityName: string;
  @Default(10) @Column maxResults: number;
  @Column product: string;
  @Default("media") @Column tone: string;
  @Default(true) @Column onlyWhatsapp: boolean;
  @BelongsTo(() => ProspeccaoAutomation) automation: ProspeccaoAutomation;
  @HasMany(() => ProspeccaoExecution) executions: ProspeccaoExecution[];
  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default ProspeccaoSchedule;
