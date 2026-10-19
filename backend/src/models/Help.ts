import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import HelpGroup from "./HelpGroup";

/**
 * Um conteudo da Central de Ajuda: video do YouTube ou artigo escrito no Quill.
 *
 * O publico nao vive aqui — vem do grupo (HelpGroup.audience).
 */
@Table({
  tableName: "Helps"
})
class Help extends Model<Help> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @ForeignKey(() => HelpGroup)
  @Column
  groupId: number;

  @BelongsTo(() => HelpGroup)
  group: HelpGroup;

  @Column
  title: string;

  @Column
  description: string;

  // "video" | "article"
  @AllowNull(false)
  @Default("video")
  @Column
  type: string;

  // Codigo do video no YouTube, so para type = "video".
  @Column
  video: string;

  // HTML ja sanitizado (helpers/sanitizeHelpContent), so para type = "article".
  @Column(DataType.TEXT)
  content: string;

  // Duracao exibida no card do video ("06:45"), preenchida a mao.
  @Column
  duration: string;

  // Destino do botao "Assistir" quando o video nao e do YouTube. Tambem e o
  // campo que o portal do parceiro ja usava antes dos grupos.
  @Column
  link: string;

  // Posicao entre os conteudos do mesmo grupo (0..N-1).
  @AllowNull(false)
  @Default(0)
  @Column
  order: number;

  @AllowNull(false)
  @Default(true)
  @Column
  isActive: boolean;

  // Permite misturar, dentro de um card geral, tutoriais para todos e
  // tutoriais visiveis somente aos administradores.
  @AllowNull(false)
  @Default(false)
  @Column
  adminOnly: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Help;
