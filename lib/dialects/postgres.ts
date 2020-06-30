import Knex from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { Table } from '../types/table';
import { Column } from '../types/column';

type RawTable = {
  table_name: string;
  table_schema: 'public' | string;
  table_comment: string | null;
};

type RawColumn = {
  column_name: string;
  table_name: string;
  data_type: string;
  column_default: any | null;
  character_maximum_length: number | null;
  is_nullable: 'YES' | 'NO';
  is_primary: null | 'YES';
  serial: null | string;
  column_comment: string | null;
  referenced_table_schema: null | string;
  referenced_table_name: null | string;
  referenced_column_name: null | string;
};

export default class Postgres implements SchemaInspector {
  knex: Knex;
  schema: string;

  constructor(knex: Knex) {
    this.knex = knex;
    this.schema = 'public';
  }

  withSchema(schema: string) {
    this.schema = schema;
    return this;
  }

  async hasTable(table: string) {
    const subquery = this.knex
      .select()
      .from('information_schema.tables')
      .where({ table_name: table, table_schema: this.schema });
    const record = await this.knex
      .select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery]))
      .first();
    return record?.exists || false;
  }

  async table(table: string) {
    const rawTable: RawTable = await this.knex
      .select(
        'table_name',
        'table_schema',
        this.knex
          .select(this.knex.raw('obj_description(oid)'))
          .from('pg_class')
          .where({ relkind: 'r' })
          .andWhere({ relname: 'table_name ' })
          .as('table_comment')
      )
      .from('information_schema.tables')
      .where({ table_schema: this.schema })
      .andWhere({ table_catalog: this.knex.client.database() })
      .andWhere({ table_type: 'BASE TABLE' })
      .andWhere({ table_name: table })
      .first();

    return {
      name: rawTable.table_name,
      schema: rawTable.table_schema,
      comment: rawTable.table_comment,
    };
  }

  async tables(schema = 'public') {
    const records: RawTable[] = await this.knex
      .select(
        'table_name',
        'table_schema',
        this.knex
          .select(this.knex.raw('obj_description(oid)'))
          .from('pg_class')
          .where({ relkind: 'r' })
          .andWhere({ relname: 'table_name ' })
          .as('table_comment')
      )
      .from('information_schema.tables')
      .where({ table_schema: schema })
      .andWhere({ table_catalog: this.knex.client.database() })
      .andWhere({ table_type: 'BASE TABLE' })
      .orderBy('table_name', 'asc');

    return records.map(
      (rawTable): Table => {
        return {
          name: rawTable.table_name,
          schema: rawTable.table_schema,
          comment: rawTable.table_comment,
        };
      }
    );
  }

  async primary(table: string): Promise<string> {
    const { column_name } = await this.knex
      .select('information_schema.key_column_usage.column_name')
      .from('information_schema.key_column_usage')
      .leftJoin(
        'information_schema.table_constraints',
        'information_schema.table_constraints.constraint_name',
        'information_schema.key_column_usage.constraint_name'
      )
      .where({
        'information_schema.table_constraints.constraint_type': 'PRIMARY KEY',
        'information_schema.table_constraints.table_name': table,
        'information_schema.table_constraints.table_schema': this.schema,
      })
      .first();

    return column_name;
  }

  async column(table: string, column: string) {
    const { knex } = this;

    const rawColumn: RawColumn = await knex
      .select(
        'c.column_name',
        'c.table_name',
        'c.data_type',
        'c.column_default',
        'c.character_maximum_length',
        'c.is_nullable',

        knex
          .select(knex.raw(`'YES'`))
          .from('pg_index')
          .join('pg_attribute', function () {
            this.on('pg_attribute.attrelid', '=', 'pg_index.indrelid').andOn(
              knex.raw('pg_attribute.attnum = any(pg_index.indkey)')
            );
          })
          .whereRaw('pg_index.indrelid = c.table_name::regclass')
          .andWhere(knex.raw('pg_attribute.attname = c.column_name'))
          .andWhere(knex.raw('pg_index.indisprimary'))
          .as('is_primary'),

        knex
          .select(
            knex.raw(
              'pg_catalog.col_description(pg_catalog.pg_class.oid, c.ordinal_position:: int)'
            )
          )
          .from('pg_catalog.pg_class')
          .whereRaw(
            `pg_catalog.pg_class.oid = (select('"' || c.table_name || '"'):: regclass:: oid)`
          )
          .andWhere({ 'pg_catalog.pg_class.relname': 'c.table_name' })
          .as('column_comment'),

        knex.raw(
          'pg_get_serial_sequence(c.table_name, c.column_name) as serial'
        ),

        'ffk.referenced_table_schema',
        'ffk.referenced_table_name',
        'ffk.referenced_column_name'
      )
      .from(knex.raw('information_schema.columns c'))
      .joinRaw(
        `
        LEFT JOIN (
          SELECT 
            k1.table_schema, 
            k1.table_name, 
            k1.column_name, 
            k2.table_schema AS referenced_table_schema, 
            k2.table_name AS referenced_table_name, 
            k2.column_name AS referenced_column_name 
          FROM 
            information_schema.key_column_usage k1 
            JOIN information_schema.referential_constraints fk using (
              constraint_schema, constraint_name
            ) 
            JOIN information_schema.key_column_usage k2 ON k2.constraint_schema = fk.unique_constraint_schema 
            AND k2.constraint_name = fk.unique_constraint_name 
            AND k2.ordinal_position = k1.position_in_unique_constraint
        ) ffk ON ffk.table_name = c.table_name 
        AND ffk.column_name = c.column_name 
      `
      )
      .where({
        'c.table_schema': this.schema,
        'c.table_name': table,
        'c.column_name': column,
      })
      .limit(1)
      .first();

    return {
      name: rawColumn.column_name,
      table: rawColumn.table_name,
      type: rawColumn.data_type,
      defaultValue: rawColumn.column_default,
      maxLength: rawColumn.character_maximum_length,
      isNullable: rawColumn.is_nullable === 'YES',
      isPrimaryKey: rawColumn.is_primary === 'YES',
      hasAutoIncrement: rawColumn.serial !== null,
      foreignKeyColumn: rawColumn.referenced_column_name,
      foreignKeyTable: rawColumn.referenced_table_name,
      comment: rawColumn.column_comment,
      schema: this.schema,
      foreignKeySchema: rawColumn.referenced_table_schema,
    };
  }

  async columns(table?: string) {
    const { knex } = this;

    const query = knex
      .select(
        'c.column_name',
        'c.table_name',
        'c.data_type',
        'c.column_default',
        'c.character_maximum_length',
        'c.is_nullable',

        knex
          .select(knex.raw(`'YES'`))
          .from('pg_index')
          .join('pg_attribute', function () {
            this.on('pg_attribute.attrelid', '=', 'pg_index.indrelid').andOn(
              knex.raw('pg_attribute.attnum = any(pg_index.indkey)')
            );
          })
          .whereRaw('pg_index.indrelid = c.table_name::regclass')
          .andWhere(knex.raw('pg_attribute.attname = c.column_name'))
          .andWhere(knex.raw('pg_index.indisprimary'))
          .as('is_primary'),

        knex
          .select(
            knex.raw(
              'pg_catalog.col_description(pg_catalog.pg_class.oid, c.ordinal_position:: int)'
            )
          )
          .from('pg_catalog.pg_class')
          .whereRaw(
            `pg_catalog.pg_class.oid = (select('"' || c.table_name || '"'):: regclass:: oid)`
          )
          .andWhere({ 'pg_catalog.pg_class.relname': 'c.table_name' })
          .as('column_comment'),

        knex.raw(
          'pg_get_serial_sequence(c.table_name, c.column_name) as serial'
        ),

        'ffk.referenced_table_schema',
        'ffk.referenced_table_name',
        'ffk.referenced_column_name'
      )
      .from(knex.raw('information_schema.columns c'))
      .joinRaw(
        `
        LEFT JOIN (
          SELECT 
            k1.table_schema, 
            k1.table_name, 
            k1.column_name, 
            k2.table_schema AS referenced_table_schema, 
            k2.table_name AS referenced_table_name, 
            k2.column_name AS referenced_column_name 
          FROM 
            information_schema.key_column_usage k1 
            JOIN information_schema.referential_constraints fk using (
              constraint_schema, constraint_name
            ) 
            JOIN information_schema.key_column_usage k2 ON k2.constraint_schema = fk.unique_constraint_schema 
            AND k2.constraint_name = fk.unique_constraint_name 
            AND k2.ordinal_position = k1.position_in_unique_constraint
        ) ffk ON ffk.table_name = c.table_name 
        AND ffk.column_name = c.column_name 
      `
      )
      .where({ 'c.table_schema': this.schema });

    if (table) {
      query.andWhere({ 'c.table_name': table });
    }

    const records: RawColumn[] = await query;

    return records.map(
      (rawColumn): Column => {
        return {
          name: rawColumn.column_name,
          table: rawColumn.table_name,
          type: rawColumn.data_type,
          defaultValue: rawColumn.column_default,
          maxLength: rawColumn.character_maximum_length,
          isNullable: rawColumn.is_nullable === 'YES',
          isPrimaryKey: rawColumn.is_primary === 'YES',
          hasAutoIncrement: rawColumn.serial !== null,
          foreignKeyColumn: rawColumn.referenced_column_name,
          foreignKeyTable: rawColumn.referenced_table_name,
          comment: rawColumn.column_comment,
          schema: this.schema,
          foreignKeySchema: rawColumn.referenced_table_schema,
        };
      }
    );
  }
}
