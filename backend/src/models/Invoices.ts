import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  DataType
} from "sequelize-typescript";
import Company from "./Company";

@Table({ tableName: "Invoices" })
class Invoices extends Model<Invoices> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  detail: string;

  @Column
  status: string;

  @Column
  value: number;

  @Column
  currency: string;

  @Column
  txId: string;

  @Column
  payGw: string;

  @Column
  payGwData: string;

  @Column
  externalRef: string;

  @Column
  origem: string;

  @Column(DataType.STRING(7))
  competencia: string;

  @Column
  ciclo: string;

  @Column
  forma: string;

  @Column(DataType.TEXT)
  linkPagamento: string;

  @Column
  paidAt: Date;

  @Column
  platformOverdueNotifiedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  dueDate: string;

  @Column
  billingType: "regular" | "initial_prorata";

  @Column(DataType.DATEONLY)
  periodStart: string;

  @Column(DataType.DATEONLY)
  periodEnd: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;
}

export default Invoices;
