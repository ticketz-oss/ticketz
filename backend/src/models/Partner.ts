import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  Unique,
  HasMany
} from "sequelize-typescript";
import { hash, compare } from "bcryptjs";
import Company from "./Company";
import PartnerPayout from "./PartnerPayout";

@Table
class Partner extends Model<Partner> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Unique
  @Column
  email: string;

  @Column
  phone: string;

  @Column(DataType.VIRTUAL)
  password: string;

  @Column
  passwordHash: string;

  @Default(0)
  @Column
  tokenVersion: number;

  @Default(30)
  @Column(DataType.FLOAT)
  discountPct: number;

  @Column
  pixKey: string;

  @Column
  pixKeyType: string;

  @Default("immediate")
  @Column
  payoutMode: string;

  @Column
  payoutDay: number;

  @Default(true)
  @Column
  status: boolean;

  @Column
  inviteToken: string;

  @Column
  inviteTokenExpiresAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Company)
  companies: Company[];

  @HasMany(() => PartnerPayout, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  payouts: PartnerPayout[];

  @BeforeUpdate
  @BeforeCreate
  static hashPassword = async (instance: Partner): Promise<void> => {
    if (instance.password) {
      instance.passwordHash = await hash(instance.password, 8);
      if (!instance.isNewRecord) {
        instance.tokenVersion = (instance.tokenVersion || 0) + 1;
      }
    }
  };

  public checkPassword = async (password: string): Promise<boolean> => {
    const passwordHash = this.getDataValue("passwordHash");
    if (!passwordHash) {
      return false;
    }
    return compare(password, passwordHash);
  };
}

export default Partner;
