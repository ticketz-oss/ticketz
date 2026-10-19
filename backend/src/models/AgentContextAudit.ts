import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  DataType,
  CreatedAt
} from "sequelize-typescript";

@Table({ tableName: "AgentContextAudits", updatedAt: false })
class AgentContextAudit extends Model<AgentContextAudit> {
  @PrimaryKey @Default(DataType.UUIDV4) @Column(DataType.UUID) id: string;
  @Column companyId: number;
  @Column userId: number;
  @Column event: string;
  @Column module: string;
  @Column status: string;
  @Column recordCount: number;
  @Column revision: number;
  @CreatedAt createdAt: Date;
}
export default AgentContextAudit;
