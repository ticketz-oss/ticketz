import {
  Table,
  Column,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
  DataType,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";

@Table({ tableName: "AgentTenantPolicies" })
class AgentTenantPolicy extends Model<AgentTenantPolicy> {
  @PrimaryKey @ForeignKey(() => Company) @Column companyId: number;
  @BelongsTo(() => Company) company: Company;
  @Default(false) @Column enabled: boolean;
  @Default({}) @Column(DataType.JSONB) modules: Record<string, boolean>;
  @Default("") @Column(DataType.TEXT) businessContext: string;
  @Default(1) @Column revision: number;
  @Column updatedById: number;
  @Default({}) @Column(DataType.JSONB) documentStatus: Record<string, unknown>;
  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
export default AgentTenantPolicy;
