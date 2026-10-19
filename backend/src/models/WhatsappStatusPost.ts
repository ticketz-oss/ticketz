import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  DataType,
  AllowNull,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import Whatsapp from "./Whatsapp";
import User from "./User";
import ContactList from "./ContactList";

export type StatusKind = "text" | "image" | "video";
export type StatusAudienceMode = "connection_contacts" | "contact_list";
export type StatusPostState =
  | "draft"
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "unsupported"
  | "cancelled";

// A WhatsApp Status published (or attempted) from the platform. It is kept
// apart from Messages/Tickets on purpose: a Status is not a ticket message.
// The recipient JIDs are never stored; only the audience reference is.
@Table({
  tableName: "WhatsappStatusPosts",
  indexes: [
    {
      unique: true,
      fields: ["companyId", "idempotencyKey"],
      name: "whatsapp_status_posts_company_idempotency"
    },
    { fields: ["companyId", "state"] },
    { fields: ["whatsappId", "state"] },
    { fields: ["companyId", "scheduledAt"] },
    { fields: ["companyId", "expiresAt"] }
  ]
})
class WhatsappStatusPost extends Model<WhatsappStatusPost> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Whatsapp)
  @AllowNull(false)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @ForeignKey(() => User)
  @Column
  createdByUserId: number;

  @BelongsTo(() => User)
  createdBy: User;

  @AllowNull(false)
  @Column(DataType.STRING(10))
  kind: StatusKind;

  @Column(DataType.TEXT)
  body: string;

  @Column
  mediaPath: string;

  @Column(DataType.STRING(50))
  mediaMime: string;

  @Column(DataType.STRING(9))
  backgroundColor: string;

  @Column
  font: number;

  @AllowNull(false)
  @Column(DataType.STRING(30))
  audienceMode: StatusAudienceMode;

  @ForeignKey(() => ContactList)
  @Column
  contactListId: number;

  @Column
  audienceCount: number;

  @Column
  scheduledAt: Date;

  @Default("draft")
  @AllowNull(false)
  @Column(DataType.STRING(20))
  state: StatusPostState;

  @Column
  remoteMessageId: string;

  @Column
  attemptStartedAt: Date;

  @Column
  publishedAt: Date;

  @Column
  expiresAt: Date;

  @Column(DataType.STRING(60))
  failureCode: string;

  @AllowNull(false)
  @Column(DataType.STRING(80))
  idempotencyKey: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default WhatsappStatusPost;
