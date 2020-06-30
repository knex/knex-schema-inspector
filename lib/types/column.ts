export interface Column {
  name: string;
  table: string;
  type: string;
  defaultValue: any | null;
  maxLength: number | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  hasAutoIncrement: boolean;
  foreignKeyColumn: string | null;
  foreignKeyTable: string | null;
  comment: string | null;

  // Postgres Only
  schema?: string;
  foreignKeySchema?: string | null;
}
