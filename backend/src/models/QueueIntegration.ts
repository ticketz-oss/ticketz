import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  Default
} from "sequelize-typescript";
import Queue from "./Queue";

@Table
class QueueIntegration extends Model<QueueIntegration> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Queue)
  @Column
  queueId: number;

  @BelongsTo(() => Queue)
  queue: Queue;

  @Column
  provider: string; // "n8n", "zapier", etc.

  @Column(DataType.JSON)
  settings: any; // Configurações específicas do provedor

  @Default(true)
  @Column
  active: boolean;

  @Column
  name: string;

  @Column
  flowId: string; // ID do fluxo no sistema externo (se aplicável)

  @Column
  webhookUrl: string; // URL para receber callbacks do sistema externo

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default QueueIntegration;
