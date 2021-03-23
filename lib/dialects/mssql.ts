import { Knex } from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';

type RawTable = {
  TABLE_NAME: string;
  TABLE_SCHEMA: string;
  TABLE_CATALOG: string;
};

type RawColumn = {
  table: string;
  name: string;
  data_type: string;
  max_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_nullable: 'YES' | 'NO';
  default_value: string | null;
  is_unique: 'YES' | 'NO';
  is_primary_key: 'YES' | 'NO';
  has_auto_increment: 'YES' | 'NO';
  foreign_key_table: string | null;
  foreign_key_column: string | null;
};

export default class MSSQL implements SchemaInspector {
  knex: Knex;
  _schema?: string;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  // MS SQL specific
  // ===============================================================================================

  /**
   * Set the schema to be used in other methods
   */
  withSchema(schema: string) {
    this.schema = schema;
    return this;
  }

  get schema() {
    return this._schema || 'dbo';
  }

  set schema(value: string) {
    this._schema = value;
  }

  parseDefaultValue(value: string | null) {
    if (!value) return null;

    if (value.startsWith('(') && value.endsWith(')')) {
      value = value.slice(1, -1);
    }

    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    if (Number.isNaN(Number(value))) return String(value);

    return Number(value);
  }

  // Tables
  // ===============================================================================================

  /**
   * List all existing tables in the current schema/database
   */
  async tables() {
    const records = await this.knex
      .select<{ TABLE_NAME: string }[]>('TABLE_NAME')
      .from('INFORMATION_SCHEMA.TABLES')
      .where({
        TABLE_TYPE: 'BASE TABLE',
        TABLE_CATALOG: this.knex.client.database(),
        TABLE_SCHEMA: this.schema,
      });
    return records.map(({ TABLE_NAME }) => TABLE_NAME);
  }

  /**
   * Get the table info for a given table. If table parameter is undefined, it will return all tables
   * in the current schema/database
   */
  tableInfo(): Promise<Table[]>;
  tableInfo(table: string): Promise<Table>;
  async tableInfo<T>(table?: string) {
    const query = this.knex
      .select('TABLE_NAME', 'TABLE_SCHEMA', 'TABLE_CATALOG', 'TABLE_TYPE')
      .from('information_schema.tables')
      .where({
        TABLE_CATALOG: this.knex.client.database(),
        TABLE_TYPE: 'BASE TABLE',
        TABLE_SCHEMA: this.schema,
      });

    if (table) {
      const rawTable: RawTable = await query
        .andWhere({ table_name: table })
        .first();

      return {
        name: rawTable.TABLE_NAME,
        schema: rawTable.TABLE_SCHEMA,
        catalog: rawTable.TABLE_CATALOG,
      } as T extends string ? Table : Table[];
    }

    const records: RawTable[] = await query;

    return records.map(
      (rawTable): Table => {
        return {
          name: rawTable.TABLE_NAME,
          schema: rawTable.TABLE_SCHEMA,
          catalog: rawTable.TABLE_CATALOG,
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
      .from('information_schema.tables')
      .where({
        TABLE_CATALOG: this.knex.client.database(),
        table_name: table,
        TABLE_SCHEMA: this.schema,
      })
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
      .from('INFORMATION_SCHEMA.COLUMNS')
      .where({
        TABLE_CATALOG: this.knex.client.database(),
        TABLE_SCHEMA: this.schema,
      });

    if (table) {
      query.andWhere({ TABLE_NAME: table });
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
    const dbName = this.knex.client.database();

    const query = this.knex
      .select(
        this.knex.raw(`
        [o].[name] AS [table],
        [c].[name] AS [name],
        [t].[name] AS [data_type],
        [c].[max_length] AS [max_length],
        [c].[precision] AS [numeric_precision],
        [c].[scale] AS [numeric_scale],
        CASE WHEN [c].[is_nullable] = 0 THEN
          'NO'
        ELSE
          'YES'
        END AS [is_nullable],
        object_definition ([c].[default_object_id]) AS default_value,
        CASE [i].[is_unique]
        WHEN 1 THEN
          'YES'
        ELSE
          'NO'
        END AS [is_unique],
        CASE [i].[is_primary_key]
        WHEN 1 THEN
          'YES'
        ELSE
          'NO'
        END AS [is_primary_key],
        CASE [c].[is_identity]
        WHEN 1 THEN
          'YES'
        ELSE
          'NO'
        END AS [has_auto_increment],
        OBJECT_NAME ([fk].[referenced_object_id]) AS [foreign_key_table],
        COL_NAME ([fk].[referenced_object_id],
          [fk].[referenced_column_id]) AS [foreign_key_column]`)
      )
      .from(this.knex.raw(`??.[sys].[columns] [c]`, [dbName]))
      .joinRaw(
        `JOIN [sys].[types] [t] ON [c].[user_type_id] = [t].[user_type_id]`
      )
      .joinRaw(`JOIN [sys].[tables] [o] ON [o].[object_id] = [c].[object_id]`)
      .joinRaw(`JOIN [sys].[schemas] [s] ON [s].[schema_id] = [o].[schema_id]`)
      .joinRaw(
        `LEFT JOIN [sys].[index_columns] [ic] ON [ic].[object_id] = [c].[object_id] AND [ic].[column_id] = [c].[column_id]`
      )
      .joinRaw(
        `LEFT JOIN [sys].[indexes] AS [i] ON [i].[object_id] = [c].[object_id] AND [i].[index_id] = [ic].[index_id]`
      )
      .joinRaw(
        `LEFT JOIN [sys].[foreign_key_columns] AS [fk] ON [fk].[parent_object_id] = [c].[object_id] AND [fk].[parent_column_id] = [c].[column_id]`
      )
      .where({ 's.name': this.schema });

    if (table) {
      query.andWhere({ 'o.name': table });
    }

    if (column) {
      const rawColumn: RawColumn = await query
        .andWhere({ 'c.name': column })
        .first();

      return {
        ...rawColumn,
        default_value: this.parseDefaultValue(rawColumn.default_value),
        is_unique: rawColumn.is_unique === 'YES',
        is_primary_key: rawColumn.is_primary_key === 'YES',
        is_nullable: rawColumn.is_nullable === 'YES',
        has_auto_increment: rawColumn.has_auto_increment === 'YES',
        numeric_precision: rawColumn.numeric_precision || null,
        numeric_scale: rawColumn.numeric_precision || null,
      } as Column;
    }

    const records: RawColumn[] = await query;

    return records.map(
      (rawColumn): Column => {
        return {
          ...rawColumn,
          default_value: this.parseDefaultValue(rawColumn.default_value),
          is_unique: rawColumn.is_unique === 'YES',
          is_primary_key: rawColumn.is_primary_key === 'YES',
          is_nullable: rawColumn.is_nullable === 'YES',
          has_auto_increment: rawColumn.has_auto_increment === 'YES',
          numeric_precision: rawColumn.numeric_precision || null,
          numeric_scale: rawColumn.numeric_precision || null,
        } as Column;
      }
    ) as Column[];
  }

  /**
   * Check if a table exists in the current schema/database
   */
  async hasColumn(table: string, column: string): Promise<boolean> {
    const { count } = this.knex
      .count<{ count: 0 | 1 }>({ count: '*' })
      .from('information_schema.tables')
      .where({
        TABLE_CATALOG: this.knex.client.database(),
        TABLE_NAME: table,
        COLUMN_NAME: column,
        TABLE_SCHEMA: this.schema,
      })
      .first();
    return !!count;
  }

  /**
   * Get the primary key column for the given table
   */
  async primary(table: string) {
    const results = await this.knex.raw(
      `SELECT
         Col.Column_Name
       FROM
         INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab,
         INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col
       WHERE
         Col.Constraint_Name = Tab.Constraint_Name
         AND Col.Table_Name = Tab.Table_Name
         AND Constraint_Type = 'PRIMARY KEY'
         AND Col.Table_Name = ?
         AND Tab.CONSTRAINT_SCHEMA = ?`,
      [table, this.schema]
    );

    const columnName = results.length > 0 ? results[0]['Column_Name'] : null;
    return columnName as string;
  }
}
