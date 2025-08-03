import { Table, Column, Model, Index } from "sequelize-typescript";

@Table({
  tableName: "Translations",
  timestamps: false
})
class Translation extends Model {
  @Index("index_language")
  @Column({ primaryKey: true })
  language: string;

  @Index("index_namespace")
  @Column({ primaryKey: true })
  namespace: string;

  @Index("index_key")
  @Column({ primaryKey: true })
  key: string;

  @Column
  value: string;
}

export default Translation;
