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
  HasMany,
  BelongsToMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import { hash, compare } from "bcryptjs";
import Ticket from "./Ticket";
import Queue from "./Queue";
import UserQueue from "./UserQueue";
import Company from "./Company";
import QuickMessage from "./QuickMessage";
import UserSocketSession from "./UserSocketSession"; // Importação da nova model
import GroupReadState from "./GroupReadState";

@Table
class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  email: string;

  @Column(DataType.TEXT)
  get profilePicUrl(): string | null {
    const arquivo = this.getDataValue("profilePicUrl");
    if (arquivo?.startsWith("https://")) return arquivo;
    return arquivo ? `${process.env.BACKEND_URL}/public/${arquivo}` : null;
  }

  @Column(DataType.VIRTUAL)
  password: string;

  @Column
  passwordHash: string;

  @Default(true)
  @Column
  passwordConfigured: boolean;

  @Default(0)
  @Column
  tokenVersion: number;

  @Default("admin")
  @Column
  profile: string;

  @Column(DataType.JSONB)
  visibleScreens: string[] | null;

  @Column
  super: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @BelongsToMany(() => Queue, () => UserQueue)
  queues: Queue[];

  @HasMany(() => QuickMessage, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  quickMessages: QuickMessage[];

  @HasMany(() => UserSocketSession, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE"
  })
  socketSessions: UserSocketSession[]; // Nova associação

  @HasMany(() => GroupReadState)
  groupReadStates: GroupReadState[];

  @BeforeUpdate
  @BeforeCreate
  static hashPassword = async (instance: User): Promise<void> => {
    if (instance.password) {
      instance.passwordHash = await hash(instance.password, 8);
      if (!instance.isNewRecord) {
        instance.passwordConfigured = true;
        instance.tokenVersion = (instance.tokenVersion || 0) + 1;
      }
    }
  };

  public checkPassword = async (password: string): Promise<boolean> => {
    return compare(password, this.getDataValue("passwordHash"));
  };
}

export default User;
