export interface Config {
    adminList: number[];
    database: Database;
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