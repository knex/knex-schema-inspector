import Knex from 'knex';
import { Table } from './table';
import { Column } from './column';

export interface SchemaInspector {
  knex: Knex;

  tables: () => Promise<string[]>;
  tableInfo: <T extends string | undefined>(
    table?: T
  ) => Promise<T extends string ? Table : Table[]>;
  hasTable: (table: string) => Promise<boolean>;
  primary: (table: string) => Promise<string>;

  columns: (table?: string) => Promise<{ table: string; column: string }[]>;
  columnInfo: <T extends string | undefined>(
    table?: string,
    column?: T
  ) => Promise<T extends string ? Column : Column[]>;
  hasColumn: (table: string, column: string) => Promise<boolean>;

  // Not in MySQL
  withSchema?: (schema: string) => void;
}

export interface SchemaInspectorConstructor {
  new (knex: Knex): SchemaInspector;
}
