export interface Column {
  name: string;
  table: string;
  type: string;
  default_value: any | null;
  max_length: number | null;
  is_nullable: boolean;
  is_primary_key: boolean;
  has_auto_increment: boolean;
  foreign_key_column: string | null;
  foreign_key_table: string | null;
  comment: string | null;

  // Postgres Only
  schema?: string;
  foreign_key_schema?: string | null;
}
