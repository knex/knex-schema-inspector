import Knex from 'knex';
import { Table } from './table';
import { Column } from './column';

export interface SchemaInspector {
  knex: Knex;

  hasTable: (table: string) => Promise<boolean>;
  table: (table: string) => Promise<Table>;
  tables: () => Promise<Table[]>;
  primary: (table: string) => Promise<string>;

  column: (table: string, column: string) => Promise<Column>;
  columns: (table?: string) => Promise<Column[]>;
}

export interface SchemaInspectorConstructor {
  new (knex: Knex): SchemaInspector;
}
