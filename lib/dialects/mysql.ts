import Knex from 'knex';
import { SchemaInspector } from '../types/schema-inspector';
import { MySQLTable } from '../types/table';
import { MySQLColumn } from '../types/column';

export default class MySQL implements SchemaInspector {
  knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async tables() {
    type RawTable = {
      TABLE_NAME: string;
      TABLE_SCHEMA: string;
      TABLE_COMMENT: string | null;
      ENGINE: string;
      TABLE_COLLATION: string;
    };

    const records: RawTable[] = await this.knex
      .select(
        'TABLE_NAME',
        'ENGINE',
        'TABLE_SCHEMA',
        'TABLE_COLLATION',
        'TABLE_COMMENT'
      )
      .from('information_schema.tables')
      .where({ table_schema: this.knex.client.database() })
      .andWhere({ table_type: 'BASE TABLE' })
      .orderBy('TABLE_NAME', 'asc');

    return records.map(
      (rawTable): MySQLTable => {
        return {
          name: rawTable.TABLE_NAME,
          schema: rawTable.TABLE_SCHEMA,
          comment: rawTable.TABLE_COMMENT,
          collation: rawTable.TABLE_COLLATION,
          engine: rawTable.ENGINE,
        };
      }
    );
  }

  async columns(table?: string) {
    type RawColumn = {
      COLUMN_NAME: string;
      COLUMN_DEFAULT: any | null;
      DATA_TYPE: string;
      CHARACTER_MAXIMUM_LENGTH: number | null;
      IS_NULLABLE: boolean;
      COLLATION_NAME: string | null;
      COLUMN_COMMENT: string | null;
      REFERENCED_TABLE_NAME: string | null;
      REFERENCED_COLUMN_NAME: string | null;
      UPDATE_RULE: string | null;
      DELETE_RULE: string | null;

      /** @TODO Extend with other possible values */
      COLUMN_KEY: 'PRI' | null;
      EXTRA: 'auto_increment' | null;
      CONSTRAINT_NAME: 'PRIMARY' | null;
    };

    const query = this.knex
      .select(
        'c.COLUMN_NAME',
        'c.COLUMN_DEFAULT',
        'c.DATA_TYPE',
        'c.CHARACTER_MAXIMUM_LENGTH',
        'c.IS_NULLABLE',
        'c.COLUMN_KEY',
        'c.EXTRA',
        'c.COLLATION_NAME',
        'c.COLUMN_COMMENT',
        'fk.REFERENCED_TABLE_NAME',
        'fk.REFERENCED_COLUMN_NAME',
        'fk.CONSTRAINT_NAME',
        'rc.UPDATE_RULE',
        'rc.DELETE_RULE',
        'rc.MATCH_OPTION'
      )
      .from('information_schema.columns c')
      .leftJoin('INFORMATION_SCHEMA.KEY_COLUMN_USAGE fk', function () {
        this.on('fk.TABLE_NAME', '=', 'fk.TABLE_NAME')
          .andOn('fk.COLUMN_NAME', '=', 'c.COLUMN_NAME')
          .andOn('fk.CONSTRAINT_SCHEMA', '=', 'c.TABLE_SCHEMA');
      })
      .leftJoin('INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc', function () {
        this.on('rc.TABLE_NAME', '=', 'fk.TABLE_NAME')
          .andOn('rc.CONSTRAINT_NAME', '=', 'fk.CONSTRAINT_NAME')
          .andOn('rc.CONSTRAINT_SCHEMA', '=', 'fk.CONSTRAINT_SCHEMA');
      })
      .where({ 'c.table_schema': this.knex.client.database() })
      .orderBy(['c.TABLE_NAME', 'c.ORDINAL_POSITION']);

    if (table) {
      query.andWhere({ 'c.table_name': table });
    }

    const records: RawColumn[] = await query;

    return records.map(
      (rawColumn): MySQLColumn => ({
        name: rawColumn.COLUMN_NAME,
        type: rawColumn.DATA_TYPE,
        defaultValue: rawColumn.COLUMN_DEFAULT,
        maxLength: rawColumn.CHARACTER_MAXIMUM_LENGTH,
        isNullable: rawColumn.IS_NULLABLE,
        isPrimaryKey: rawColumn.CONSTRAINT_NAME === 'PRIMARY',
        hasAutoIncrement: rawColumn.EXTRA === 'auto_increment',
        foreignKeyColumn: rawColumn.REFERENCED_COLUMN_NAME,
        foreignKeyTable: rawColumn.REFERENCED_TABLE_NAME,
        onDelete: rawColumn.DELETE_RULE,
        onUpdate: rawColumn.UPDATE_RULE,
        comment: rawColumn.COLUMN_COMMENT,
      })
    );
  }
}
