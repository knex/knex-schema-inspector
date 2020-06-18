export interface Table {
    name: string;
    schema: string;
    comment: string | null;
}

export interface MySQLTable extends Table {
    collation: string;
    engine: string;
}

export interface PostgresTable extends Table {
    owner?: string;
}