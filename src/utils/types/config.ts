export interface Config {
    adminList: number[];
    database: Database;
    botToken: string;
}

interface Database {
    type: DataBaseType;
    databaseName?: string;
}

export enum DataBaseType {
    SQLITE = 'SQLITE',
    POSTGRESQL = 'POSTGRESQL'
}