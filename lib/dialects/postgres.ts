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
          /** @TODO selecting obj description like this doesn't work. Needs RAW */
          .select('obj_description(oid)')
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

  async columns(table?: string) {
    /*
      SELECT
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,

        (
          SELECT
            pg_catalog.col_description(pc.oid, c.ordinal_position:: int)
          FROM pg_catalog.pg_class pc
          WHERE pc.oid = (SELECT('"' || c.table_name || '"'):: regclass:: oid)
            AND pc.relname = c.table_name
        ) AS column_comment,

        pg_get_serial_sequence(c.table_name, c.column_name) AS serial,

        (
          SELECT 'YES'
          FROM pg_index i
          JOIN pg_attribute a
          ON a.attrelid = i.indrelid
            AND a.attnum = any(i.indkey)
          WHERE  i.indrelid = c.table_name:: regclass
            AND a.attname = c.column_name
            AND i.indisprimary                 // <<<<<<<< something missing here??
        ) AS primary,

        ffk.referenced_table_schema,
        ffk.referenced_table_name,
        ffk.referenced_column_name

      FROM information_schema.columns c

      LEFT JOIN (
        SELECT
          k1.table_schema,
          k1.table_name,
          k1.column_name,
          k2.table_schema AS referenced_table_schema,
          k2.table_name AS referenced_table_name,
          k2.column_name AS referenced_column_name
        FROM information_schema.key_column_usage k1
        JOIN information_schema.referential_constraints fk USING(constraint_schema, constraint_name)
        JOIN information_schema.key_column_usage k2
          ON k2.constraint_schema = fk.unique_constraint_schema
          AND k2.constraint_name = fk.unique_constraint_name
          AND k2.ordinal_position = k1.position_in_unique_constraint
      ) ffk

      ON ffk.table_name = c.table_name
        AND ffk.column_name = c.column_name
      WHERE c.table_name = ?
        AND c.table_catalog = ? `;
    */

    /**
     * Here's a start..
     */

    const query = this.knex
      .select(
        'c.column_name',
        'c.data_type',
        'c.character_maximum_length',
        'c.is_nullable',
        'c.column_default',

        this.knex
          .select(
            this.knex.raw(
              'pg_catalog.col_description(pc.oid, c.ordinal_position:: int)'
            )
          )
          .from('pg_catalog.pg_class pc')
          /** @todo turn into subquery? */
          .where({
            'pc.oid': `(SELECT('"' || c.table_name || '"'):: regclass:: oid)`,
          })
          .andWhere({ 'pc.relname': 'c.table_name' })
          .as('column_comment'),

        this.knex.raw(
          'pg_get_serial_sequence(c.table_name, c.column_name) as serial'
        ),

        this.knex
          .select('YES')
          .from('pg_index i')
          .join('pg_attribute a', function () {
            this.on('a.attrelid', 'i.indrelid').andOn(
              'a.attnum',
              'any(i.indkey)'
            );
          })
          .where({ 'i.indrelid': 'c.table_name:: regclass' })
          .andWhere({ 'a.attname': 'c.column_name' })
          .andWhere('i.indisprimary') // something missing here? see above
          .as('primary')
      )
      .from('information_schema.columns c')
      .leftJoin(
        function () {
          this.select(
            'k1.table_schema',
            'k1.table_name',
            'k1.column_name',
            'k2.table_schema AS referenced_table_schema',
            'k2.table_name AS referenced_table_name',
            'k2.column_name AS referenced_column_name'
          )
            .from('information_schema.key_column_usage k1')
            /** @todo this is wrong..  */
            .joinRaw(
              'join information_schema.referential_constraints fk USING(constraint_schema, constraint_name)'
            )
            .join('information_schema.key_column_usage k2', function () {
              this.on(
                'k2.constraint_schema',
                '=',
                'fk.unique_constraint_schema'
              )
                .andOn('k2.constraint_name', '=', 'fk.unique_constraint_name')
                .andOn(
                  'k2.ordinal_position',
                  '=',
                  'k1.position_in_unique_constraint'
                );
            })
            /** @todo this is different from sql, but maybe right? */
            .as('ffk');
        },
        function () {
          this.on('ffk.table_name', '=', 'c.table_name').andOn(
            'ffk.column_name',
            '=',
            'c.column_name'
          );
        }
      )
      .where({ 'c.table_catalog': this.knex.client.database() });

    if (table) {
      query.andWhere({ 'c.table_name': table });
    }

    return await query;
  }
}
