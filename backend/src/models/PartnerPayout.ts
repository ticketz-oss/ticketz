import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  Unique,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Partner from "./Partner";
import Company from "./Company";
import Invoices from "./Invoices";

/**
 * Uma linha de comissao por fatura paga.
 *
 * Ciclo: pending -> processing -> paid
 * Desvios: awaiting_pix_key (parceiro sem chave cadastrada) e failed
 * (erro definitivo no envio, reprocessavel pelo job).
 */
@Table
class PartnerPayout extends Model<PartnerPayout> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @ForeignKey(() => Partner)
  @Column
  partnerId: number;

  @BelongsTo(() => Partner)
  partner: Partner;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  // Unico: uma fatura nunca gera duas comissoes, mesmo com replay de webhook.
  @AllowNull(false)
  @Unique
  @ForeignKey(() => Invoices)
  @Column
  invoiceId: number;

  @BelongsTo(() => Invoices)
  invoice: Invoices;

  // Valor da fatura que originou a comissao.
  @Default(0)
  @Column(DataType.FLOAT)
  baseValue: number;

  // Custo da plataforma descontado da fatura no momento do accrual.
  @Default(0)
  @Column(DataType.FLOAT)
  platformCost: number;

  @Default(0)
  @Column(DataType.FLOAT)
  amount: number;

  @Default(0)
  @Column(DataType.FLOAT)
  feeAmount: number;

  @Default(0)
  @Column(DataType.FLOAT)
  netAmount: number;

  // Snapshot do modo de repasse do parceiro no momento do accrual.
  @Default("immediate")
  @Column
  mode: string;

  @Default("pending")
  @Column
  status: string;

  @Column
  batchId: string;

  @Column
  txId: string;

  @Column
  externalId: string;

  @Column
  receiptUrl: string;

  @Column(DataType.TEXT)
  failReason: string;

  @Default(0)
  @Column
  attempts: number;

  @Column
  nextAttemptAt: Date;

  @Column
  paidAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default PartnerPayout;
