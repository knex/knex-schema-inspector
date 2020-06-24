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
}

export interface MySQLColumn extends Column {}

export interface PostgresColumn extends Column {
  schema: string;
  foreignKeySchema: string | null;
}

export interface MSSQLColumn extends Column {}
