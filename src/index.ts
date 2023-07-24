import { Bot } from './bot';
import { createLogger } from './utils/logger/logger';
import { BotConfig } from './config/BotConfig';
import { SQLite } from './config/database/SQLite';
import { DataBase } from './config/database/DataBase';
import { DataBaseType } from './utils/types/config';
import { ILogger } from 'js-logger';

const logger: ILogger = createLogger('Main');
let database: DataBase;

const initDatabase = async (config: BotConfig): Promise<DataBase> => {
    const databaseType: DataBaseType | undefined = config.getConfig()?.database.type;
    let db: DataBase;

    switch (databaseType) {
        case 'SQLITE':
            db = new SQLite(config);
            break;
        case 'POSTGRESQL':
            throw new Error('PostgreSQL не поддерживается');
        default:
            db = new SQLite(config);
            break;
    }
    await db.createTable();

    return db;
};

const initConfig = async (): Promise<BotConfig> => {
    const config = new BotConfig();
    await config.initialize();
    return config;
};


const init = async (): Promise<void> => {
    try {
        const config: BotConfig = await initConfig();
        const db: DataBase = await initDatabase(config);

        database = db;
        const token: string | undefined = config.getConfig()?.botToken;
        if (!token) {
            throw new Error('Токен не найден');
        }
        new Bot(token, config, db);
    } catch (e) {
        logger.error(e);
    }
};

init()
    .then(() => logger.log('Голосовой бот загружен'))
    .catch(err => logger.error(err));

// Обработчик события SIGINT (Ctrl + C)
process.on('SIGINT', async () => {
    logger.info("Завершение программы...");
    if (database) {
        await database.disconnect()
    }
    process.exit(0);
});

// Обработчик события SIGTERM
process.on('SIGTERM', async () => {
    logger.info("Завершение программы...");
    if (database) {
        await database.disconnect()
    }
    process.exit(0);
});