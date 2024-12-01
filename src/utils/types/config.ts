export interface Config {
    adminList: number[];
    database: Database;
    tempFileDir: string;
}

interface Database {
    type: DataBaseType;
    databaseName?: string;
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    schema?: string;
}

export enum DataBaseType {
    SQLITE = 'SQLITE',
    POSTGRESQL = 'POSTGRESQL'
}