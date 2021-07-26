import { Knex } from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { ForeignKey } from '../types/foreign-key';
import { stripQuotes } from '../utils/strip-quotes';

type RawColumn = {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_DEFAULT: any | null;
  DATA_TYPE: string;
  DATA_LENGTH: number | null;
  DATA_PRECISION: number | null;
  DATA_SCALE: number | null;
  NULLABLE: 'Y' | 'N';
  COLUMN_COMMENT: string | null;
  REFERENCED_TABLE_NAME: string | null;
  REFERENCED_COLUMN_NAME: string | null;
  CONSTRAINT_TYPE: 'P' | 'U' | 'R' | null;
  VIRTUAL_COLUMN: 'YES' | 'NO';
  IDENTITY_COLUMN: 'YES' | 'NO';
};

export function rawColumnToColumn(rawColumn: RawColumn): Column {
  return {
    name: rawColumn.COLUMN_NAME,
    table: rawColumn.TABLE_NAME,
    data_type: rawColumn.DATA_TYPE,
    default_value: stripQuotes(rawColumn.DATA_DEFAULT),
    max_length: rawColumn.DATA_LENGTH,
    numeric_precision: rawColumn.DATA_PRECISION,
    numeric_scale: rawColumn.DATA_SCALE,
    is_generated: rawColumn.VIRTUAL_COLUMN === 'YES',
    is_nullable: rawColumn.NULLABLE === 'Y',
    is_unique: rawColumn.CONSTRAINT_TYPE === 'U',
    is_primary_key: rawColumn.CONSTRAINT_TYPE === 'P',
    has_auto_increment: rawColumn.IDENTITY_COLUMN === 'YES',
    foreign_key_column: rawColumn.REFERENCED_COLUMN_NAME,
    foreign_key_table: rawColumn.REFERENCED_TABLE_NAME,
    comment: rawColumn.COLUMN_COMMENT,
  };
}

export default class oracleDB implements SchemaInspector {
  knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  // Tables
  // ===============================================================================================

  /**
   * List all existing tables in the current schema/database
   */
  async tables(): Promise<string[]> {
    const records = await this.knex
      .select<Table[]>('TABLE_NAME as name')
      .from('USER_TABLES');
    return records.map(({ name }) => name);
  }

  /**
   * Get the table info for a given table. If table parameter is undefined, it will return all tables
   * in the current schema/database
   */
  tableInfo(): Promise<Table[]>;
  tableInfo(table: string): Promise<Table>;
  async tableInfo<T>(table?: string) {
    const query = this.knex
      .select<Table[]>('TABLE_NAME as name')
      .from('USER_TABLES');

    if (table) {
      return await query.andWhere({ TABLE_NAME: table }).first();
    }

    return await query;
  }

  /**
   * Check if a table exists in the current schema/database
   */
  async hasTable(table: string): Promise<boolean> {
    const result = await this.knex
      .count<{ count: 0 | 1 }>({ count: '*' })
      .from('USER_TABLES')
      .where({ TABLE_NAME: table })
      .first();
    return !!result?.count;
  }

  // Columns
  // ===============================================================================================

  /**
   * Get all the available columns in the current schema/database. Can be filtered to a specific table
   */
  async columns(table?: string) {
    const query = this.knex
      .select<{ table: string; column: string }[]>(
        'TABLE_NAME as table',
        'COLUMN_NAME as column'
      )
      .from('USER_TAB_COLS');

    if (table) {
      query.where({ TABLE_NAME: table });
    }

    return await query;
  }

  /**
   * Get the column info for all columns, columns in a given table, or a specific column.
   */
  columnInfo(): Promise<Column[]>;
  columnInfo(table: string): Promise<Column[]>;
  columnInfo(table: string, column: string): Promise<Column>;
  async columnInfo<T>(table?: string, column?: string) {
    const query = this.knex
      .with(
        'uc',
        this.knex.raw(`
          SELECT /*+ materialize */ DISTINCT
            "uc"."TABLE_NAME",
            "ucc"."COLUMN_NAME",
            "uc"."CONSTRAINT_NAME",
            "uc"."CONSTRAINT_TYPE",
            "uc"."R_CONSTRAINT_NAME"
          FROM "USER_CONSTRAINTS" "uc"
            INNER JOIN "USER_CONS_COLUMNS" "ucc" ON "uc"."CONSTRAINT_NAME" = "ucc"."CONSTRAINT_NAME"
            AND "uc"."CONSTRAINT_TYPE" IN ('P', 'U', 'R')
        `)
      )
      .select<RawColumn[]>(
        'c.TABLE_NAME',
        'c.COLUMN_NAME',
        'c.DATA_DEFAULT',
        'c.DATA_TYPE',
        'c.DATA_LENGTH',
        'c.DATA_PRECISION',
        'c.DATA_SCALE',
        'c.NULLABLE',
        'c.IDENTITY_COLUMN',
        'c.VIRTUAL_COLUMN',
        'cm.COMMENTS as COLUMN_COMMENT',
        'ct.CONSTRAINT_TYPE',
        'fk.TABLE_NAME as REFERENCED_TABLE_NAME',
        'fk.COLUMN_NAME as REFERENCED_COLUMN_NAME'
      )
      .from('USER_TAB_COLS as c')
      .leftJoin('USER_COL_COMMENTS as cm', {
        'c.TABLE_NAME': 'cm.TABLE_NAME',
        'c.COLUMN_NAME': 'cm.COLUMN_NAME',
      })
      .leftJoin('uc as ct', {
        'c.TABLE_NAME': 'ct.TABLE_NAME',
        'c.COLUMN_NAME': 'ct.COLUMN_NAME',
      })
      .leftJoin('uc as fk', 'ct.R_CONSTRAINT_NAME', 'fk.CONSTRAINT_NAME');

    if (table) {
      query.where({ 'c.TABLE_NAME': table });
    }

    if (column) {
      const [rawColumn] = await query
        .andWhere({
          'c.COLUMN_NAME': column,
        })
        // NOTE: .first() is signifigantly slower on this query
        .andWhereRaw('rownum = 1');

      return rawColumnToColumn(rawColumn);
    }

    const records: RawColumn[] = await query;

    return records.map(rawColumnToColumn);
  }

  /**
   * Check if a table exists in the current schema/database
   */
  async hasColumn(table: string, column: string): Promise<boolean> {
    const result = await this.knex
      .count<{ count: 0 | 1 }>({ count: '*' })
      .from('USER_TAB_COLS')
      .where({
        TABLE_NAME: table,
        COLUMN_NAME: column,
      })
      .first();
    return !!result?.count;
  }

  /**
   * Get the primary key column for the given table
   */
  async primary(table: string): Promise<string> {
    const result = await this.knex
      .select('cc.COLUMN_NAME')
      .from('USER_CONSTRAINTS as uc')
      .join(
        'USER_CONS_COLUMNS as cc',
        'uc.CONSTRAINT_NAME',
        'cc.CONSTRAINT_NAME'
      )
      .where({
        'uc.TABLE_NAME': table,
        'uc.CONSTRAINT_TYPE': 'P',
      })
      .first();

    return result?.COLUMN_NAME ?? null;
  }

  // Foreign Keys
  // ===============================================================================================

  async foreignKeys(table?: string): Promise<ForeignKey[]> {
    const query = this.knex
      .with(
        'ucc',
        this.knex.raw(
          'SELECT /*+ materialize */ "TABLE_NAME", "COLUMN_NAME", "CONSTRAINT_NAME" FROM "USER_CONS_COLUMNS"'
        )
      )
      .select<ForeignKey[]>(
        'uc.TABLE_NAME as table',
        'cc.COLUMN_NAME as column',
        'rcc.TABLE_NAME as foreign_key_table',
        'rcc.COLUMN_NAME as foreign_key_column',
        'uc.CONSTRAINT_NAME as constraint_name',
        this.knex.raw('NULL as "on_update"'),
        'uc.DELETE_RULE as on_delete'
      )
      .from('USER_CONSTRAINTS as uc')
      .leftJoin('ucc as cc', 'uc.CONSTRAINT_NAME', 'cc.CONSTRAINT_NAME')
      .leftJoin('ucc as rcc', 'uc.R_CONSTRAINT_NAME', 'rcc.CONSTRAINT_NAME')
      .where({ 'uc.CONSTRAINT_TYPE': 'R' });

    if (table) {
      query.andWhere({ 'uc.TABLE_NAME': table });
    }

    return await query;
  }
}
