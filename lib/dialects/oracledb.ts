import { Knex } from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { ForeignKey } from '../types/foreign-key';

type RawTable = {
  TABLE_NAME: string;
};

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
  CONSTRAINT_TYPE: 'P' | 'U' | null;
  VIRTUAL_COLUMN: 'YES' | 'NO';
  IDENTITY_COLUMN: 'YES' | 'NO';
};

export function rawColumnToColumn(rawColumn: RawColumn): Column {
  return {
    name: rawColumn.COLUMN_NAME,
    table: rawColumn.TABLE_NAME,
    data_type: rawColumn.DATA_TYPE,
    default_value: rawColumn.DATA_DEFAULT,
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
  async tables() {
    const records = await this.knex
      .select<{ TABLE_NAME: string }[]>('TABLE_NAME')
      .from('USER_TABLES');
    return records.map(({ TABLE_NAME }) => TABLE_NAME);
  }

  /**
   * Get the table info for a given table. If table parameter is undefined, it will return all tables
   * in the current schema/database
   */
  tableInfo(): Promise<Table[]>;
  tableInfo(table: string): Promise<Table>;
  async tableInfo<T>(table?: string) {
    const query = this.knex.select('TABLE_NAME').from('USER_TABLES');

    if (table) {
      const rawTable: RawTable = await query
        .andWhere({ TABLE_NAME: table })
        .first();

      return {
        name: rawTable.TABLE_NAME,
      } as T extends string ? Table : Table[];
    }

    const records: RawTable[] = await query;

    return records.map(
      (rawTable): Table => {
        return {
          name: rawTable.TABLE_NAME,
        };
      }
    ) as T extends string ? Table : Table[];
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
    return (result && result.count === 1) || false;
  }

  // Columns
  // ===============================================================================================

  /**
   * Get all the available columns in the current schema/database. Can be filtered to a specific table
   */
  async columns(table?: string) {
    const query = this.knex
      .select<{ TABLE_NAME: string; COLUMN_NAME: string }[]>(
        'TABLE_NAME',
        'COLUMN_NAME'
      )
      .from('USER_TAB_COLS');

    if (table) {
      query.where({ TABLE_NAME: table });
    }

    const records = await query;

    return records.map(({ TABLE_NAME, COLUMN_NAME }) => ({
      table: TABLE_NAME,
      column: COLUMN_NAME,
    }));
  }

  /**
   * Get the column info for all columns, columns in a given table, or a specific column.
   */
  columnInfo(): Promise<Column[]>;
  columnInfo(table: string): Promise<Column[]>;
  columnInfo(table: string, column: string): Promise<Column>;
  async columnInfo<T>(table?: string, column?: string) {
    const query = this.knex
      .select(
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
        'pk.CONSTRAINT_TYPE',
        'fk.REFERENCED_TABLE_NAME',
        'fk.REFERENCED_COLUMN_NAME'
      )
      .from('USER_TAB_COLS as c')
      .leftJoin('USER_COL_COMMENTS as cm', {
        'c.TABLE_NAME': 'cm.TABLE_NAME',
        'c.COLUMN_NAME': 'cm.COLUMN_NAME',
      })
      .leftJoin(
        this.knex
          .select('uc.CONSTRAINT_TYPE', 'uc.TABLE_NAME', 'cc.COLUMN_NAME')
          .from('USER_CONSTRAINTS as uc')
          .join(
            'USER_CONS_COLUMNS as cc',
            'uc.CONSTRAINT_NAME',
            'cc.CONSTRAINT_NAME'
          )
          .whereIn('uc.CONSTRAINT_TYPE', ['P', 'U'])
          .as('pk'),
        {
          'c.TABLE_NAME': 'pk.TABLE_NAME',
          'c.COLUMN_NAME': 'pk.COLUMN_NAME',
        }
      )
      .leftJoin(
        this.knex
          .select(
            'uc.TABLE_NAME',
            'cc.COLUMN_NAME',
            'rc.TABLE_NAME as REFERENCED_TABLE_NAME',
            'rc.COLUMN_NAME as REFERENCED_COLUMN_NAME'
          )
          .from('USER_CONSTRAINTS as uc')
          .as('uc')
          .join(
            'USER_CONS_COLUMNS as cc',
            'uc.CONSTRAINT_NAME',
            'cc.CONSTRAINT_NAME'
          )
          .join(
            'USER_CONS_COLUMNS as rc',
            'uc.R_CONSTRAINT_NAME',
            'rc.CONSTRAINT_NAME'
          )
          .where('uc.CONSTRAINT_TYPE', 'R')
          .as('fk'),
        {
          'c.TABLE_NAME': 'fk.TABLE_NAME',
          'c.COLUMN_NAME': 'fk.COLUMN_NAME',
        }
      );

    if (table) {
      query.where({ 'c.TABLE_NAME': table });
    }

    if (column) {
      const rawColumn: RawColumn = await query
        .andWhere({ 'c.COLUMN_NAME': column })
        .first();

      return rawColumnToColumn(rawColumn);
    }

    const records: RawColumn[] = await query;

    return records.map(rawColumnToColumn);
  }

  /**
   * Check if a table exists in the current schema/database
   */
  async hasColumn(table: string, column: string): Promise<boolean> {
    const { count } = this.knex
      .count<{ count: 0 | 1 }>({ count: '*' })
      .from('USER_TAB_COLS')
      .where({
        TABLE_NAME: table,
        COLUMN_NAME: column,
      })
      .first();
    return !!count;
  }

  /**
   * Get the primary key column for the given table
   */

  async primary(table: string): Promise<string> {
    const result = await this.knex
      .select('cc.COLUMN_NAME')
      .from('USER_CONSTRAINTS as uc')
      .leftJoin(
        'USER_CONS_COLUMNS as cc',
        'uc.CONSTRAINT_NAME',
        'cc.CONSTRAINT_NAME'
      )
      .where({
        'uc.CONSTRAINT_TYPE': 'P',
        'uc.TABLE_NAME': table,
      })
      .first();
    return result ? result.COLUMN_NAME : null;
  }

  // Foreign Keys
  // ===============================================================================================

  async foreignKeys(table?: string) {
    const result = await this.knex.raw<ForeignKey[]>(`
      SELECT
        ucc. "TABLE_NAME" AS "table",
        ucc. "COLUMN_NAME" AS "column",
        rucc. "TABLE_NAME" AS "foreign_key_table",
        rucc. "COLUMN_NAME" AS "foreign_key_column",
        uc. "CONSTRAINT_NAME" AS "constraint_name",
        NULL AS "on_update",
        uc. "DELETE_RULE" AS "on_delete"
      FROM
        USER_CONSTRAINTS uc
        LEFT JOIN USER_CONS_COLUMNS ucc ON uc. "CONSTRAINT_NAME" = ucc. "CONSTRAINT_NAME"
        LEFT JOIN USER_CONS_COLUMNS rucc ON uc. "R_CONSTRAINT_NAME" = rucc. "CONSTRAINT_NAME"
      WHERE
        uc. "CONSTRAINT_TYPE" = 'R'
    `);

    if (table) {
      return result?.filter((row) => row.table === table);
    }

    return result;
  }
}
