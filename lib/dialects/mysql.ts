import Knex from 'knex';
import { SchemaInspector, Column, MySQLTable } from '../types';

type RawTable = {
    TABLE_NAME: string;
    TABLE_SCHEMA: string;
    TABLE_COMMENT: string | null;
    ENGINE: string;
    TABLE_COLLATION: string;
}

export default class MySQL implements SchemaInspector {
    knex: Knex;

    constructor(knex: Knex) {
        this.knex = knex;
    }

    async tables() {
        const records = await this.knex.raw(`
            SELECT TABLE_NAME, ENGINE, TABLE_SCHEMA, TABLE_COLLATION, TABLE_COMMENT 
            FROM information_schema.tables 
            WHERE table_schema = ? 
            AND table_type = 'BASE TABLE' 
            ORDER BY TABLE_NAME ASC
        `, [this.knex.client.database()]);

        return records.map((rawTable: RawTable): MySQLTable => {
            return {
                name: rawTable.TABLE_NAME,
                schema: rawTable.TABLE_SCHEMA,
                comment: rawTable.TABLE_COMMENT,
            }
        })
    }

    async columns(table: string) {
        return [] as Column[];
    }
}