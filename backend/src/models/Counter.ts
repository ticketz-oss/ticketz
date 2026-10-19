import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  Index,
  PrimaryKey
} from "sequelize-typescript";
import Company from "./Company";

@Table({
  timestamps: false,
  paranoid: false
})
class Counter extends Model {
  @PrimaryKey
  @ForeignKey(() => Company)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  companyId: number;

  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  serie: string;

  @PrimaryKey
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  timestamp: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  value: number;

  @Index
  @Column({
    type: DataType.DATEONLY
  })
  day: Date;

  @Index
  @Column({
    type: DataType.DATE
  })
  twelve_hours: Date;

  @Index
  @Column({
    type: DataType.DATE
  })
  six_hours: Date;

  @Index
  @Column({
    type: DataType.DATE
  })
  three_hours: Date;

  @Index
  @Column({
    type: DataType.DATE
  })
  hour: Date;

  @BelongsTo(() => Company)
  company: Company;
}

export default Counter;
