import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  BeforeCreate,
  BeforeUpdate,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Campaign from "./Campaign";
import ContactListItem from "./ContactListItem";
import normalizePhone from "../helpers/NormalizePhone";

@Table({ tableName: "CampaignShipping" })
class CampaignShipping extends Model<CampaignShipping> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  jobId: string;

  @Column
  number: string;

  @Column
  message: string;

  @Column
  confirmationMessage: string;

  @Column
  confirmation: boolean;

  @ForeignKey(() => ContactListItem)
  @Column
  contactId: number;

  @ForeignKey(() => Campaign)
  @Column
  campaignId: number;

  @Column
  confirmationRequestedAt: Date;

  @Column
  confirmedAt: Date;

  @Column
  deliveredAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => ContactListItem)
  contact: ContactListItem;

  @BelongsTo(() => Campaign)
  campaign: Campaign;

  @BeforeUpdate
  @BeforeCreate
  static normalizeNumber(instance: CampaignShipping): void {
    if (!instance.number) {
      return;
    }

    if (instance.number.endsWith("@lid")) {
      return;
    }

    instance.number = normalizePhone(instance.number).phone;
  }
}

export default CampaignShipping;
