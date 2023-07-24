import * as path from 'path';
import { Config } from '../utils/types/config';
import { promises as fsPromises } from 'fs';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';

export class BotConfig {
    private readonly logger: ILogger = createLogger('BotConfig');
    private readonly configFilepath: string = path.resolve('src/resources/config.json');

    private config: Config | null = null;

    initialize(): Promise<void> {
        return new Promise((resolve, reject): void => {
            fsPromises.readFile(this.configFilepath, { encoding: 'utf-8' })
                .then((fileStr: string) => {
                    this.config = JSON.parse(fileStr);
                    resolve();
                })
                .catch(err => {
                    this.logger.error('Ошибка чтения файла конфигурации', err);
                    reject(err);
                });
        });
    }

    getConfig(): Config | null {
        return this.config;
    }
}