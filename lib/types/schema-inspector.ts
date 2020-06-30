import Knex from 'knex';
import { Table } from './table';
import { Column } from './column';

export interface SchemaInspector {
  knex: Knex;

  hasTable: (table: string, schema?: string) => Promise<boolean>;
  table: (table: string, schema?: string) => Promise<Table>;
  tables: () => Promise<Table[]>;
  primary: (table: string, schema?: string) => Promise<string>;

  columns: (table?: string, schema?: string) => Promise<Column[]>;
}

export interface SchemaInspectorConstructor {
  new (knex: Knex): SchemaInspector;
}
