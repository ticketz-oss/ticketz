import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  AutoIncrement
} from "sequelize-typescript";

import Company from "./Company";

@Table({
  tableName: "QuickPix",
  timestamps: true
})
export default class QuickPix extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  id!: string;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  companyId!: number;

  @BelongsTo(() => Company)
  company!: Company;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  key!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  pixcode!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  expiration!: Date;

  @Default(false)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN
  })
  isPaid!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata!: object | null;

  @CreatedAt
  @Column({
    type: DataType.DATE
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE
  })
  updatedAt!: Date;
}
