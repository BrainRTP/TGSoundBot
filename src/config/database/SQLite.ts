import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { DataBase } from './DataBase';
import { promises as fsPromises } from 'fs';
import { BotConfig } from '../BotConfig';
import { CustomVoice } from '../../utils/types/type';

const Logger = require('js-logger');

export class SQLite extends DataBase {

    private readonly db: sqlite3.Database;
    private readonly sqlConfigFilepath: string = path.resolve('src/resources/sql/');
    private readonly databaseFileName: string;

    constructor(config: BotConfig) {
        super();

        this.databaseFileName = config.getConfig()?.database.databaseName ?? 'database.db';

        this.db = new sqlite3.Database(`${this.sqlConfigFilepath}/${this.databaseFileName}`,
            sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
            (err: Error | null) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Произошла ошибка при подключении к базе данных SQLite');
                } else {
                    this.logger(Logger.INFO, 'База данных SQLite - подключена');
                }
            });
    }

    async createTable(): Promise<void> {
        let createTableSQL: string;

        await fsPromises.readFile(`${this.sqlConfigFilepath}/init.sql`, { encoding: 'utf-8' })
            .then((fileStr: string) => {
                createTableSQL = fileStr;
            })
            .catch(err => this.logger(Logger.ERROR, 'Ошибка чтения файла конфигурации', err));


        return new Promise((resolve, reject) => {
            this.queryExecute(createTableSQL)
                .then(() => resolve())
                .catch(err => reject(err));
        });
    }

    async saveVoice(voice: CustomVoice): Promise<void> {
        return new Promise((resolve, reject) => {
            const voiceName: string = voice.title;
            const voicePath: string = voice.voice_url;
            const botId: number = voice.botId;
            this.queryInsert(`INSERT INTO audio_inline (inline_type, title, voice_url, bot_id)
                              VALUES ('voice', '${voiceName}', '${voicePath}', '${botId}')`)
                .then(() => resolve())
                .catch(err => reject(err));
        });
    }

    async getAllVoices(botId: number | undefined): Promise<CustomVoice[]> {
        return new Promise((resolve, reject) => {
            this.queryAll<CustomVoice>(`SELECT *
                                        FROM audio_inline
                                        WHERE bot_id = ?`, [botId])
                .then((rows) => resolve(rows))
                .catch(err => reject(err));
        });
    }

    async getVoiceById(id: number): Promise<CustomVoice> {
        return new Promise((resolve, reject) => {
            this.queryGet<CustomVoice>(`SELECT *
                                        FROM audio_inline
                                        WHERE id = ?
                                        LIMIT (1)`, [id])
                .then((rows: CustomVoice[]) => resolve(rows[0]))
                .catch(err => reject(err));
        });
    }

    async getVoiceByTitleInclude(title: string, botId: number | undefined): Promise<CustomVoice[]> {
        return new Promise((resolve, reject) => {
            this.queryAll<CustomVoice>(`SELECT *
                                        FROM audio_inline
                                        WHERE title LIKE ?
                                          AND bot_id = ?`, [`%${title}%`, botId])
                .then((rows: CustomVoice[]) => resolve(rows))
                .catch(err => reject(err));
        });
    }

    async queryExecute<T>(sql: string, params?: any[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err: Error) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve([]);
                }
            });
        });
    }

    async queryAll<T>(sql: string, params?: any[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error, rows: T[]) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // useless. like queryAll;
    async queryGet<T>(sql: string, params?: any[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error, rows: T[]) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async queryInsert(sql: string, params?: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err: Error) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err: Error | null) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка закрытия соединения с базой данных', err);
                    reject(err);
                } else {
                    this.logger(Logger.INFO, 'Соединение с базой данных закрыто');
                    resolve();
                }
            });
        });
    }
}