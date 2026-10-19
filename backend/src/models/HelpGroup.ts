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
  HasMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Help from "./Help";
import Company from "./Company";

/**
 * Card de assunto da Central de Ajuda ("Chatbot", "Campanhas", ...).
 *
 * O publico (audience) e o escopo (companyId/isGlobal) vivem aqui e o conteudo
 * herda: manter os campos tambem em Help criaria duas fontes de verdade que
 * divergem.
 */
@Table({
  tableName: "HelpGroups"
})
class HelpGroup extends Model<HelpGroup> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  title: string;

  @Column(DataType.TEXT)
  subtitle: string;

  // Nome do icone MUI. A galeria curada em components/IconPicker/icons.js e a
  // unica fonte: nomes fora dela caem no fallback HelpOutline.
  @AllowNull(false)
  @Default("HelpOutline")
  @Column
  icon: string;

  // "company" (tutoriais do tenant) ou "partner" (tutoriais de revenda).
  @AllowNull(false)
  @Default("company")
  @Column
  audience: string;

  // Empresa dona do card — quem criou. Sempre preenchido, inclusive nos cards
  // globais (a convencao do projeto nao usa companyId nulo).
  @AllowNull(false)
  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  // true = material da plataforma, visivel para todas as empresas. So o super
  // admin marca; o admin do tenant so cria card da propria empresa.
  @AllowNull(false)
  @Default(false)
  @Column
  isGlobal: boolean;

  // Posicao entre os cards do mesmo publico e escopo (0..N-1).
  @AllowNull(false)
  @Default(0)
  @Column
  order: number;

  @AllowNull(false)
  @Default(true)
  @Column
  isActive: boolean;

  // Quando true, o card e todos os seus conteudos aparecem somente para
  // administradores do tenant. A checagem tambem acontece na API publica.
  @AllowNull(false)
  @Default(false)
  @Column
  adminOnly: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Help, { onDelete: "CASCADE" })
  contents: Help[];
}

export default HelpGroup;
