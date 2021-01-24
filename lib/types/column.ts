export interface Column {
  name: string;
  table: string;
  type: string;
  udt_name?: string;
  enum_values?: Array<string | number> | null;
  default_value: any | null;
  max_length: number | null;
  precision: number | null;
  scale: number | null;

  is_nullable: boolean;
  is_primary_key: boolean;
  has_auto_increment: boolean;
  foreign_key_column: string | null;
  foreign_key_table: string | null;

  // Not supported in SQLite or MSSQL
  comment?: string | null;

  // Postgres Only
  schema?: string;
  foreign_key_schema?: string | null;
}
