import {
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
import Schedule from "./Schedule";

@Table({ tableName: "CommemorativeDates" })
class CommemorativeDate extends Model<CommemorativeDate> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default("FIXED_DATE")
  @Column
  ruleType: "FIXED_DATE" | "NTH_WEEKDAY";

  @Column
  month: number;

  @Column
  day: number;

  @Column
  weekday: number;

  @Column
  ordinal: number;

  @Default(true)
  @Column
  active: boolean;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Schedule)
  schedules: Schedule[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default CommemorativeDate;
