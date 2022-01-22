import { Knex } from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { ForeignKey } from '../types/foreign-key';
import { stripQuotes } from '../utils/strip-quotes';
import isNil from 'lodash.isnil';

type RawColumn = {
  name: string;
  table: string;
  schema: string;
  data_type: string;
  is_nullable: boolean;
  generation_expression: null | string;
  default_value: null | string;
  is_generated: boolean;
  max_length: null | number;
  comment: null | string;
  numeric_precision: null | number;
  numeric_scale: null | number;
};

type Constraint = {
  type: 'f' | 'p' | 'u';
  table: string;
  column: string;
  foreign_key_schema: null | string;
  foreign_key_table: null | string;
  foreign_key_column: null | string;
  has_auto_increment: null | boolean;
};

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
    const schemaIn = this.explodedSchema.map(
      (schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`
    );

    const result = await this.knex.raw(
      `
      SELECT
        rel.relname AS name
      FROM
        pg_class rel
      WHERE
        rel.relnamespace IN (${schemaIn})
        AND rel.relkind = 'r'
      ORDER BY rel.relname
    `
    );

    return result.rows.map((row: { name: string }) => row.name);
  }

  /**
   * Get the table info for a given table. If table parameter is undefined, it will return all tables
   * in the current schema/database
   */
  tableInfo(): Promise<Table[]>;
  tableInfo(table: string): Promise<Table>;
  async tableInfo(table?: string) {
    const schemaIn = this.explodedSchema.map(
      (schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`
    );

    const bindings: any[] = [];
    if (table) bindings.push(table);

    const result = await this.knex.raw(
      `
      SELECT
        rel.relnamespace::regnamespace::text AS schema,
        rel.relname AS name,
        des.description AS comment
      FROM
        pg_class rel
      LEFT JOIN pg_description des ON rel.oid = des.objoid AND des.objsubid = 0
      WHERE
        rel.relnamespace IN (${schemaIn})
        ${table ? 'AND rel.relname = ?' : ''}
        AND rel.relkind = 'r'
      ORDER BY rel.relname
    `,
      bindings
    );

    if (table) return result.rows[0];
    return result.rows;
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
    const bindings: any[] = [];
    if (table) bindings.push(table);

    const schemaIn = this.explodedSchema.map(
      (schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`
    );

    const result = await this.knex.raw(
      `
      SELECT
        att.attname AS column,
        rel.relname AS table
      FROM
        pg_attribute att
        LEFT JOIN pg_class rel ON att.attrelid = rel.oid
      WHERE
        rel.relnamespace IN (${schemaIn})
        ${table ? 'AND rel.relname = ?' : ''}
        AND rel.relkind = 'r'
        AND att.attnum > 0
        AND NOT att.attisdropped;
    `,
      bindings
    );

    return result.rows;
  }

  /**
   * Get the column info for all columns, columns in a given table, or a specific column.
   */
  columnInfo(): Promise<Column[]>;
  columnInfo(table: string): Promise<Column[]>;
  columnInfo(table: string, column: string): Promise<Column>;
  async columnInfo<T>(table?: string, column?: string) {
    const { knex } = this;

    const bindings: any[] = [];
    if (table) bindings.push(table);
    if (column) bindings.push(column);

    const schemaIn = this.explodedSchema.map(
      (schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`
    );

    const [columns, constraints] = await Promise.all([
      knex.raw<{ rows: RawColumn[] }>(
        `
        SELECT
        	att.attname AS name,
          rel.relname AS table,
          rel.relnamespace::regnamespace::text as schema,
          att.atttypid::regtype::text AS data_type,
          NOT att.attnotnull AS is_nullable,
          CASE WHEN att.attgenerated = 's' THEN pg_get_expr(ad.adbin, ad.adrelid) ELSE null END AS generation_expression,
          CASE WHEN att.attgenerated = '' THEN pg_get_expr(ad.adbin, ad.adrelid) ELSE null END AS default_value,
          att.attgenerated = 's' AS is_generated,
          CASE
            WHEN att.atttypid IN (1042, 1043) THEN (att.atttypmod - 4)::int4
            WHEN att.atttypid IN (1560, 1562) THEN (att.atttypmod)::int4
            ELSE NULL
          END AS max_length,
          des.description AS comment,
          CASE att.atttypid
            WHEN 21 THEN 16
            WHEN 23 THEN 32
            WHEN 20 THEN 64
            WHEN 1700 THEN
              CASE WHEN atttypmod = -1 THEN NULL
                ELSE (((atttypmod - 4) >> 16) & 65535)::int4
              END
            WHEN 700 THEN 24
            WHEN 701 THEN 53
            ELSE NULL
          END AS numeric_precision,
          CASE
            WHEN atttypid IN (21, 23, 20) THEN 0
            WHEN atttypid = 1700 THEN
              CASE
                WHEN atttypmod = -1 THEN NULL
                ELSE ((atttypmod - 4) & 65535)::int4
              END
            ELSE null
          END AS numeric_scale
        FROM
          pg_attribute att
          LEFT JOIN pg_class rel ON att.attrelid = rel.oid
          LEFT JOIN pg_attrdef ad ON (att.attrelid, att.attnum) = (ad.adrelid, ad.adnum)
          LEFT JOIN pg_description des ON (att.attrelid, att.attnum) = (des.objoid, des.objsubid)
        WHERE
          rel.relnamespace IN (${schemaIn})
          ${table ? 'AND rel.relname = ?' : ''}
          ${column ? 'AND att.attname = ?' : ''}
          AND rel.relkind = 'r'
          AND att.attnum > 0
          AND NOT att.attisdropped
        ORDER BY rel.relname, att.attnum;
      `,
        bindings
      ),
      knex.raw<{ rows: Constraint[] }>(
        `
        SELECT
          con.contype AS type,
          rel.relname AS table,
          att.attname AS column,
          frel.relnamespace::regnamespace::text AS foreign_key_schema,
          frel.relname AS foreign_key_table,
          fatt.attname AS foreign_key_column,
          CASE con.contype
            WHEN 'p' THEN
              CASE 
                WHEN pg_get_serial_sequence(quote_ident(rel.relname), att.attname) != '' THEN TRUE
                ELSE FALSE
              END
            ELSE NULL
          END AS has_auto_increment
        FROM
          pg_constraint con
        LEFT JOIN pg_class rel ON con.conrelid = rel.oid
        LEFT JOIN pg_class frel ON con.confrelid = frel.oid
        LEFT JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
        LEFT JOIN pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = con.confkey[1]
        WHERE con.connamespace IN (${schemaIn})
          AND array_length(con.conkey, 1) <= 1
          AND (con.confkey IS NULL OR array_length(con.confkey, 1) = 1)
          ${table ? 'AND rel.relname = ?' : ''}
          ${column ? 'AND att.attname = ?' : ''}
        `,
        bindings
      ),
    ]);

    const parsedColumms: Column[] = columns.rows.map((col): Column => {
      const constraintsForColumn = constraints.rows.filter(
        (constraint) =>
          constraint.table === col.table && constraint.column === col.name
      );

      const foreignKeyConstraint = constraintsForColumn.find(
        (constraint) => constraint.type === 'f'
      );

      return {
        ...col,
        is_unique: constraintsForColumn.some((constraint) =>
          ['u', 'p'].includes(constraint.type)
        ),
        is_primary_key: constraintsForColumn.some(
          (constraint) => constraint.type === 'p'
        ),
        has_auto_increment: constraintsForColumn.some(
          (constraint) => constraint.has_auto_increment
        ),
        default_value: parseDefaultValue(col.default_value),
        foreign_key_schema: foreignKeyConstraint?.foreign_key_schema ?? null,
        foreign_key_table: foreignKeyConstraint?.foreign_key_table ?? null,
        foreign_key_column: foreignKeyConstraint?.foreign_key_column ?? null,
      };
    });

    if (table && column) return parsedColumms[0];
    return parsedColumms;
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
