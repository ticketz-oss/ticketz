import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Company from "./Company";
import Contact from "./Contact";
import Queue from "./Queue";
import Ticket from "./Ticket";
import User from "./User";
import VoiceConnection from "./VoiceConnection";
import Whatsapp from "./Whatsapp";

@Table
class VoiceCall extends Model<VoiceCall> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.STRING(128))
  externalCallId: string;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => VoiceConnection)
  @Column
  voiceConnectionId: number;

  @BelongsTo(() => VoiceConnection)
  voiceConnection: VoiceConnection;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @Column(DataType.JSONB)
  queueIds: number[];

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @Column(DataType.STRING(64))
  number: string;

  @Column(DataType.STRING(16))
  direction: string;

  @Column(DataType.STRING(16))
  state: "ringing" | "accepted" | "rejected" | "missed" | "ended" | "failed";

  @Column
  startedAt: Date;

  @Column
  acceptedAt: Date;

  @Column
  endedAt: Date;

  @Column
  durationSeconds: number;

  @Column(DataType.TEXT)
  error: string;

  @Column({ defaultValue: false })
  recordingEnabled: boolean;

  @Column({ defaultValue: false })
  transcriptionEnabled: boolean;

  @Column(DataType.STRING(24))
  artifactStatus: string;

  @Column(DataType.STRING)
  recordingUrl: string;

  @Column(DataType.TEXT)
  transcript: string;

  @Column(DataType.JSONB)
  transcriptSegments: Array<{
    start: number;
    end: number;
    speaker: string;
    text: string;
  }>;

  @Column(DataType.STRING(24))
  transcriptionProvider: string;

  @Column(DataType.STRING(64))
  transcriptionModel: string;

  @Column(DataType.TEXT)
  artifactError: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default VoiceCall;
