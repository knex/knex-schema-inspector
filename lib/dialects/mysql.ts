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

    const records = await this.knex.raw<RawTable[]>(
      `
        SELECT TABLE_NAME, ENGINE, TABLE_SCHEMA, TABLE_COLLATION, TABLE_COMMENT 
        FROM information_schema.tables 
        WHERE table_schema = ? 
        AND table_type = 'BASE TABLE' 
        ORDER BY TABLE_NAME ASC
        `,
      [this.knex.client.database()]
    );

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

  async columns(table: string) {
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

    const records = await this.knex.raw<RawColumn[]>(
      `
        SELECT 
            c.COLUMN_NAME,
            c.COLUMN_DEFAULT,
            c.DATA_TYPE,
            c.CHARACTER_MAXIMUM_LENGTH,
            c.IS_NULLABLE,
            c.COLUMN_KEY,
            c.EXTRA,
            c.COLLATION_NAME,
            c.COLUMN_COMMENT,
            fk.REFERENCED_TABLE_NAME,
            fk.REFERENCED_COLUMN_NAME,
            fk.CONSTRAINT_NAME,
            rc.UPDATE_RULE,
            rc.DELETE_RULE,
            rc.MATCH_OPTION
        FROM information_schema.columns c
        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE fk
            ON fk.TABLE_NAME = c.TABLE_NAME
            AND fk.COLUMN_NAME = c.COLUMN_NAME
            AND fk.CONSTRAINT_SCHEMA = c.TABLE_SCHEMA
        LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc 
            ON rc.TABLE_NAME = fk.TABLE_NAME 
            AND rc.CONSTRAINT_NAME = fk.CONSTRAINT_NAME
            AND rc.CONSTRAINT_SCHEMA = fk.CONSTRAINT_SCHEMA
        WHERE c.table_name = ? 
            AND c.table_schema = ?
        ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
        `,
      [table, this.knex.client.database()]
    );

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
