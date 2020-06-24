import Knex from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { PostgresTable } from '../types/table';
import { PostgresColumn } from '../types/column';

export default class Postgres implements SchemaInspector {
  knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async tables(schema = 'public') {
    type RawTable = {
      table_name: string;
      table_schema: 'public' | string;
      table_comment: string | null;
    };

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
      (rawTable): PostgresTable => {
        return {
          name: rawTable.table_name,
          schema: rawTable.table_schema,
          comment: rawTable.table_comment,
        };
      }
    );
  }

  async columns(table?: string, schema = 'public') {
    const { knex } = this;

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

    const records: RawColumn[] = await knex
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
      .where({ 'c.table_schema': schema });

    return records.map(
      (rawColumn): PostgresColumn => {
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
          schema: schema,
          foreignKeySchema: rawColumn.referenced_table_schema,
        };
      }
    );
  }
}
