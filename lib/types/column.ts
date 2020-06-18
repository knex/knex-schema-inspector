export interface Column {
    name: string;
    dataType: string;
    isNullable: boolean;
    columnDefault: any | null;
    foreignKey: string | null;
    comment: string | null;
}

export interface MySQLColumn extends Column {
    
}

export interface PostgresColumn extends Column {

}