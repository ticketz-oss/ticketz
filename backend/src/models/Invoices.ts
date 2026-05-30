import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  HasMany,
  Unique,
  BelongsTo,
  ForeignKey
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

  // "pix" | "boleto"
  @Column
  paymentMethod: string;

  @Column
  boletoUrl: string;

  @Column
  boletoBarcode: string;

  // NFS-e
  @Column
  nfseId: string;

  @Column
  nfseUrl: string;

  @Column
  nfseStatus: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  dueDate: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;
}

export default Invoices;
