export type ForeignKey = {
  table: string;
  column: string;
  foreign_key_table: string;
  foreign_key_column: string;
  foreign_key_schema?: string;
  constraint_name: string;
  on_update: null | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  on_delete: null | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
};
