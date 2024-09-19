export interface Config {
    adminList: number[];
    database: Database;
    botToken: string;
    tempFileDir: string;
}

interface Database {
    type: DataBaseType;
    databaseName?: string;
}

export enum DataBaseType {
    SQLITE = 'SQLITE',
    POSTGRESQL = 'POSTGRESQL'
}