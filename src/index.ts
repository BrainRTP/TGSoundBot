import { Bot } from './bot';
import { createLogger } from './utils/logger/logger';
import { BotConfig } from './config/BotConfig';
import { SQLite } from './config/database/SQLite';
import { DataBase } from './config/database/DataBase';
import { DataBaseType } from './utils/types/config';
import { ILogger } from 'js-logger';
import {FileWriter} from "./utils/FileWriter";
import { config as dotenvConfig } from 'dotenv';
import { PostgreSQL } from './config/database/PostgreSQL';

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
            db = new PostgreSQL(config);
            break;
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
        dotenvConfig()
        const config: BotConfig = await initConfig();
        const db: DataBase = await initDatabase(config);

        const fileWriter = new FileWriter(config);
        database = db;
        const botToken = process.env.BOT_TOKEN;
        if (!botToken) {
            return Promise.reject(new Error('Переменная окружения BOT_TOKEN не найдена'));
        }

        new Bot(botToken, config, db, fileWriter);
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