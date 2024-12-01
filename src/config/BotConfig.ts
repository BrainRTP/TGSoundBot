import * as path from 'path';
import { Config, DataBaseType } from '../utils/types/config';
import { promises as fsPromises } from 'fs';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';

export class BotConfig {
    private readonly logger: ILogger = createLogger('BotConfig');
    private readonly configFilepath: string = path.resolve('src/resources/config.json');

    private config: Config | null = null;

    initialize(): Promise<void> {
        return new Promise((resolve, reject): void => {
            fsPromises
                .readFile(this.configFilepath, { encoding: 'utf-8' })
                .then((fileStr: string) => {
                    this.config = JSON.parse(fileStr);
                    let dbUser = process.env.DB_USER;
                    let dbPassword = process.env.DB_PASSWORD;

                    if (this.config?.database.type == DataBaseType.POSTGRESQL && dbUser && dbPassword) {
                        this.config.database.user = dbUser;
                        this.config.database.password = dbPassword;
                    }
                    resolve();
                })
                .catch((err) => {
                    this.logger.error('Ошибка чтения файла конфигурации', err);
                    reject(err);
                });
        });
    }

    getConfig(): Config | null {
        return this.config;
    }
}