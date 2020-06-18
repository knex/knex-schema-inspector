import Knex from 'knex';
import { Table, MySQLTable, PostgresTable } from './table';
import { Column, MySQLColumn, PostgresColumn } from './column';

export interface SchemaInspector {
  knex: Knex;
  tables: () => Promise<Table[] | MySQLTable[] | PostgresTable[]>;
  columns: (table: string) => Promise<Column[]>;
}

export interface SchemaInspectorConstructor {
  new (knex: Knex): SchemaInspector;
}
