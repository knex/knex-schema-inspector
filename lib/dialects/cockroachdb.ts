import { Knex } from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';
import isNil from 'lodash.isnil';

/**
 * Converts CockroachDB default value to JS
 * Eg `'example'::character varying` => `example`
 */
export function parseDefaultValue(type: string | null) {
  if (isNil(type)) return null;
  if (type.startsWith('nextval(')) return type;

  let [value, cast] = type.split('::');

  value = value.replace(/^\'([\s\S]*)\'$/, '$1');

  if (/.*json.*/.test(cast)) return JSON.parse(value);
  if (/.*(char|text).*/.test(cast)) return String(value);

  return isNaN(value as any) ? value : Number(value);
}

export default class CockroachDB implements SchemaInspector {
  knex: Knex;
  schema: string;
  explodedSchema: string[];
  database: string;

  constructor(knex: Knex) {
    this.knex = knex;
    this.database = this.knex.client.config.database;

    const config = knex.client.config;

    if (!config.searchPath) {
      this.schema = 'public';
      this.explodedSchema = [this.schema];
    } else if (typeof config.searchPath === 'string') {
      this.schema = config.searchPath;
      this.explodedSchema = [config.searchPath];
    } else {
      this.schema = config.searchPath[0];
      this.explodedSchema = config.searchPath;
    }
  }

  // CockroachDB specific
  // ===============================================================================================

  /**
   * Set the schema to be used in other methods
   */
  withSchema(schema: string) {
    this.schema = schema;
    this.explodedSchema = [this.schema];
    return this;
  }

  // Tables
  // ===============================================================================================

  /**
   * List all existing tables in the current schema/database
   */
  async tables() {
    console.log(this.knex.client);
  }

  /**
   * Get the table info for a given table. If table parameter is undefined, it will return all tables
   * in the current schema/database
   */
  tableInfo(): Promise<Table[]>;
  tableInfo(table: string): Promise<Table>;
  async tableInfo(table?: string) {}

  /**
   * Check if a table exists in the current schema/database
   */
  async hasTable(table: string) {}

  // Columns
  // ===============================================================================================

  /**
   * Get all the available columns in the current schema/database. Can be filtered to a specific table
   */
  async columns(table?: string) {}

  /**
   * Get the column info for all columns, columns in a given table, or a specific column.
   */
  columnInfo(): Promise<Column[]>;
  columnInfo(table: string): Promise<Column[]>;
  columnInfo(table: string, column: string): Promise<Column>;
  async columnInfo<T>(table?: string, column?: string) {}

  /**
   * Check if the given table contains the given column
   */
  async hasColumn(table: string, column: string) {}

  /**
   * Get the primary key column for the given table
   */
  async primary(table: string): Promise<string | null> {}

  // Foreign Keys
  // ===============================================================================================
  async foreignKeys(table?: string) {}
}
