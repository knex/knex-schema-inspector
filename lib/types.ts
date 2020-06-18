import Knex from 'knex';

export type Table = {
    name: string;
    schema: string;
    kind: string;
    comment: string | null;
    estimatedRow: number;
    totalSize: number;
    dataSize: number;
    indexSize: number;

    // PostgreSQL Only
    owner?: string;

    // MySQL Only
    charset?: string;
    collation?: string;
    engine?: string;
}

export type Column = {
    name: string;
    dataType: string;
    isNullable: boolean;
    columnDefault: any | null;
    foreignKey: string | null;
    comment: string | null;

    // PostgreSQL Only
    check?: string | null;

    // MySQL Only
    extra?: string | null;
}

export interface SchemaInspector {
    knex: Knex;
    tables: () => Promise<Table[]>;
    columns: (table: string) => Promise<Column[]>;
}

export interface SchemaInspectorConstructor {
    new (knex: Knex): SchemaInspector;
}