import { Knex } from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { ForeignKey } from '../types/foreign-key';
import { stripQuotes } from '../utils/strip-quotes';
import isNil from 'lodash.isnil';

type RawTable = {
  table_name: string;
  table_schema: 'public' | string;
  table_comment: string | null;
};

type RawColumn = {
  column_name: string;
  table_name: string;
  table_schema: string;
  data_type: string;
  column_default: any | null;
  character_maximum_length: number | null;
  is_generated: 'YES' | 'NO';
  is_nullable: 'YES' | 'NO';
  is_unique: boolean;
  is_primary: boolean;
  is_identity: 'YES' | 'NO';
  generation_expression: null | string;
  numeric_precision: null | number;
  numeric_scale: null | number;
  serial: null | string;
  column_comment: string | null;
  foreign_key_schema: null | string;
  foreign_key_table: null | string;
  foreign_key_column: null | string;
};

export function rawColumnToColumn(rawColumn: RawColumn): Column {
  return {
    name: rawColumn.column_name,
    table: rawColumn.table_name,
    data_type: rawColumn.data_type,
    default_value:
      parseDefaultValue(rawColumn.column_default) ||
      parseDefaultValue(rawColumn.generation_expression),
    max_length: rawColumn.character_maximum_length,
    numeric_precision: rawColumn.numeric_precision,
    numeric_scale: rawColumn.numeric_scale,
    is_generated: rawColumn.is_generated === 'YES',
    is_nullable: rawColumn.is_nullable === 'YES',
    is_unique: rawColumn.is_unique,
    is_primary_key: rawColumn.is_primary,
    has_auto_increment:
      rawColumn.serial !== null || rawColumn.is_identity === 'YES',
    comment: rawColumn.column_comment,
    schema: rawColumn.table_schema,
    foreign_key_schema: rawColumn.foreign_key_schema,
    foreign_key_table: rawColumn.foreign_key_table,
    foreign_key_column: rawColumn.foreign_key_column,
  };
}

/**
 * Converts Postgres default value to JS
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

export default class Postgres implements SchemaInspector {
  knex: Knex;
  schema: string;
  explodedSchema: string[];

  constructor(knex: Knex) {
    this.knex = knex;
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

  // Postgres specific
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
    const records = await this.knex
      .select<{ tablename: string }[]>('tablename')
      .from('pg_catalog.pg_tables')
      .whereIn('schemaname', this.explodedSchema);
    return records.map(({ tablename }) => tablename);
  }

  /**
   * Get the table info for a given table. If table parameter is undefined, it will return all tables
   * in the current schema/database
   */
  tableInfo(): Promise<Table[]>;
  tableInfo(table: string): Promise<Table>;
  async tableInfo(table?: string) {
    const query = this.knex
      .select(
        'table_name',
        'table_schema',
        this.knex
          .select(this.knex.raw('obj_description(oid)'))
          .from('pg_class')
          .where({ relkind: 'r' })
          .andWhere({ relname: 'table_name' })
          .as('table_comment')
      )
      .from('information_schema.tables')
      .whereIn('table_schema', this.explodedSchema)
      .andWhereRaw(`"table_catalog" = current_database()`)
      .andWhere({ table_type: 'BASE TABLE' })
      .orderBy('table_name', 'asc');

    if (table) {
      const rawTable: RawTable = await query
        .andWhere({ table_name: table })
        .limit(1)
        .first();

      return {
        name: rawTable.table_name,
        schema: rawTable.table_schema,
        comment: rawTable.table_comment,
      } as Table;
    }

    const records = await query;

    return records.map((rawTable: RawTable): Table => {
      return {
        name: rawTable.table_name,
        schema: rawTable.table_schema,
        comment: rawTable.table_comment,
      };
    });
  }

  /**
   * Check if a table exists in the current schema/database
   */
  async hasTable(table: string) {
    const subquery = this.knex
      .select()
      .from('information_schema.tables')
      .whereIn('table_schema', this.explodedSchema)
      .andWhere({ table_name: table });
    const record = await this.knex
      .select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery]))
      .first();
    return record?.exists || false;
  }

  // Columns
  // ===============================================================================================

  /**
   * Get all the available columns in the current schema/database. Can be filtered to a specific table
   */
  async columns(table?: string) {
    const query = this.knex
      .select<{ table_name: string; column_name: string }[]>(
        'table_name',
        'column_name'
      )
      .from('information_schema.columns')
      .whereIn('table_schema', this.explodedSchema);

    if (table) {
      query.andWhere({ table_name: table });
    }

    const records = await query;

    return records.map(({ table_name, column_name }) => ({
      table: table_name,
      column: column_name,
    }));
  }

  /**
   * Get the column info for all columns, columns in a given table, or a specific column.
   */
  columnInfo(): Promise<Column[]>;
  columnInfo(table: string): Promise<Column[]>;
  columnInfo(table: string, column: string): Promise<Column>;
  async columnInfo<T>(table?: string, column?: string) {
    const { knex } = this;

    const query = knex
      .select(
        'c.column_name',
        'c.table_name',
        'c.data_type',
        'c.column_default',
        'c.character_maximum_length',
        'c.is_generated',
        'c.is_nullable',
        'c.numeric_precision',
        'c.numeric_scale',
        'c.table_schema',
        'c.is_identity',
        'c.generation_expression',

        knex.raw(
          'pg_get_serial_sequence(quote_ident(c.table_name), c.column_name) as serial'
        ),

        knex.raw(
          'pg_catalog.col_description(pg_class.oid, c.ordinal_position:: int) as column_comment'
        ),

        knex.raw(`COALESCE(pg.indisunique, false) as is_unique`),
        knex.raw(`COALESCE(pg.indisprimary, false) as is_primary`),

        'ffk.foreign_key_schema',
        'ffk.foreign_key_table',
        'ffk.foreign_key_column'
      )
      .from(knex.raw('information_schema.columns c'))
      .joinRaw(
        `
        LEFT JOIN pg_catalog.pg_class
          ON pg_catalog.pg_class.oid = quote_ident(c.table_name):: regclass:: oid
          AND pg_catalog.pg_class.relname = c.table_name
      `
      )
      .joinRaw(
        `
        LEFT JOIN LATERAL (
          SELECT
            pg_index.indisprimary,
            pg_index.indisunique
          FROM pg_index
          JOIN pg_attribute
            ON pg_attribute.attrelid = pg_index.indrelid
            AND pg_attribute.attnum = any(pg_index.indkey)
          WHERE pg_index.indrelid = quote_ident(c.table_name)::regclass
          AND pg_attribute.attname = c.column_name
          LIMIT 1
        ) pg ON true
      `
      )
      .joinRaw(
        `
        LEFT JOIN LATERAL (
          SELECT
            k2.table_schema AS foreign_key_schema,
            k2.table_name AS foreign_key_table,
            k2.column_name AS foreign_key_column
          FROM
            information_schema.key_column_usage k1
            JOIN information_schema.referential_constraints fk using (
              constraint_schema, constraint_name
            )
            JOIN information_schema.key_column_usage k2
              ON k2.constraint_schema = fk.unique_constraint_schema
              AND k2.constraint_name = fk.unique_constraint_name
              AND k2.ordinal_position = k1.position_in_unique_constraint
            WHERE k1.table_name = c.table_name
            AND k1.column_name = c.column_name
        ) ffk ON TRUE
      `
      )
      .whereIn('c.table_schema', this.explodedSchema)
      .orderBy(['c.table_name', 'c.ordinal_position']);

    if (table) {
      query.andWhere({ 'c.table_name': table });
    }

    if (column) {
      const rawColumn = await query
        .andWhere({ 'c.column_name': column })
        .first();

      return rawColumnToColumn(rawColumn);
    }

    const records: RawColumn[] = await query;

    return records.map(rawColumnToColumn);
  }

  /**
   * Check if the given table contains the given column
   */
  async hasColumn(table: string, column: string) {
    const subquery = this.knex
      .select()
      .from('information_schema.columns')
      .whereIn('table_schema', this.explodedSchema)
      .andWhere({
        table_name: table,
        column_name: column,
      });
    const record = await this.knex
      .select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery]))
      .first();
    return record?.exists || false;
  }

  /**
   * Get the primary key column for the given table
   */
  async primary(table: string): Promise<string> {
    const result = await this.knex
      .select('information_schema.key_column_usage.column_name')
      .from('information_schema.key_column_usage')
      .leftJoin(
        'information_schema.table_constraints',
        'information_schema.table_constraints.constraint_name',
        'information_schema.key_column_usage.constraint_name'
      )
      .whereIn(
        'information_schema.table_constraints.table_schema',
        this.explodedSchema
      )
      .andWhere({
        'information_schema.table_constraints.constraint_type': 'PRIMARY KEY',
        'information_schema.table_constraints.table_name': table,
      })
      .first();

    return result ? result.column_name : null;
  }

  // Foreign Keys
  // ===============================================================================================

  async foreignKeys(table?: string) {
    const result = await this.knex.raw<{ rows: ForeignKey[] }>(`
      SELECT
        c.conrelid::regclass::text AS "table",
        (
          SELECT
            STRING_AGG(a.attname, ','
            ORDER BY
              t.seq)
          FROM (
            SELECT
              ROW_NUMBER() OVER (ROWS UNBOUNDED PRECEDING) AS seq,
              attnum
            FROM
              UNNEST(c.conkey) AS t (attnum)) AS t
          INNER JOIN pg_attribute AS a ON a.attrelid = c.conrelid
            AND a.attnum = t.attnum) AS "column",
        tt.name AS foreign_key_table,
        (
          SELECT
            STRING_AGG(QUOTE_IDENT(a.attname), ','
            ORDER BY
              t.seq)
          FROM (
            SELECT
              ROW_NUMBER() OVER (ROWS UNBOUNDED PRECEDING) AS seq,
              attnum
            FROM
              UNNEST(c.confkey) AS t (attnum)) AS t
        INNER JOIN pg_attribute AS a ON a.attrelid = c.confrelid
          AND a.attnum = t.attnum) AS foreign_key_column,
        tt.schema AS foreign_key_schema,
        c.conname AS constraint_name,
        CASE confupdtype
        WHEN 'r' THEN
          'RESTRICT'
        WHEN 'c' THEN
          'CASCADE'
        WHEN 'n' THEN
          'SET NULL'
        WHEN 'd' THEN
          'SET DEFAULT'
        WHEN 'a' THEN
          'NO ACTION'
        ELSE
          NULL
        END AS on_update,
        CASE confdeltype
        WHEN 'r' THEN
          'RESTRICT'
        WHEN 'c' THEN
          'CASCADE'
        WHEN 'n' THEN
          'SET NULL'
        WHEN 'd' THEN
          'SET DEFAULT'
        WHEN 'a' THEN
          'NO ACTION'
        ELSE
          NULL
        END AS
        on_delete
      FROM
        pg_catalog.pg_constraint AS c
        INNER JOIN (
          SELECT
            pg_class.oid,
            QUOTE_IDENT(pg_namespace.nspname) AS SCHEMA,
            QUOTE_IDENT(pg_class.relname) AS name
          FROM
            pg_class
            INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid) AS tf ON tf.oid = c.conrelid
        INNER JOIN (
          SELECT
            pg_class.oid,
            QUOTE_IDENT(pg_namespace.nspname) AS SCHEMA,
            QUOTE_IDENT(pg_class.relname) AS name
          FROM
            pg_class
            INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid) AS tt ON tt.oid = c.confrelid
      WHERE
        c.contype = 'f';
    `);

    const rowsWithoutQuotes = result.rows.map(stripRowQuotes);

    if (table) {
      return rowsWithoutQuotes.filter((row) => row.table === table);
    }

    return rowsWithoutQuotes;

    function stripRowQuotes(row: ForeignKey): ForeignKey {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          return [key, stripQuotes(value)];
        })
      ) as ForeignKey;
    }
  }
}
