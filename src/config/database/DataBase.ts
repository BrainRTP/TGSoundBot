import { IDatabase } from '../../utils/types/IDatabase';
import { ILogger, ILogLevel } from 'js-logger';
import { createLogger } from '../../utils/logger/logger';
import { CustomVoice } from '../../utils/types/type';

const Logger = require('js-logger');

export abstract class DataBase implements IDatabase {
    private readonly log: ILogger = createLogger('Database');

    abstract disconnect(): Promise<void>;

    abstract queryExecute<T>(sql: string, params?: any[]): Promise<T[]>;

    abstract queryAll<T>(sql: string, params?: any[]): Promise<T[]>;

    abstract queryGet<T>(sql: string, params?: any[]): Promise<T[]>;

    abstract queryInsert(sql: string, params?: any[]): Promise<void>;

    abstract getAllVoices(botId: number | undefined, isHidden: boolean, limit: number, offset: number): Promise<CustomVoice[]>;

    abstract getVoiceById(id: number): Promise<CustomVoice>;

    abstract getVoiceByTitleInclude(title: string, botId: number | undefined, isHidden: boolean, limit: number, offset: number): Promise<CustomVoice[]>;

    abstract createTable(): Promise<void>;

    abstract saveVoice(voice: CustomVoice): Promise<void>;

    protected logger(level: ILogLevel, ...message: any[]): void {
        switch (level) {
            case Logger.TRACE:
                this.log.trace(message);
                break;
            case Logger.DEBUG:
                this.log.debug(message);
                break;
            case Logger.INFO:
                this.log.info(message);
                break;
            case Logger.WARN:
                this.log.warn(message);
                break;
            case Logger.ERROR:
                this.log.error(message);
                break;
            default:
                this.log.log(message);
                break;
        }
    }
}