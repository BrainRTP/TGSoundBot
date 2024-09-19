import * as path from 'path';
import { Client, QueryResultRow } from 'pg';
import { DataBase } from './DataBase';
import { BotConfig } from '../BotConfig';
import { CustomVoice } from '../../utils/types/type';
import { promises as fsPromises } from 'fs';

const Logger = require('js-logger');

export class PostgreSQL extends DataBase {
    private readonly db: Client;
    private readonly sqlConfigFilepath: string = path.resolve('src/resources/sql/');

    constructor(config: BotConfig) {
        super();

        const dbConfig = config.getConfig()?.database;

        this.db = new Client({
            user: dbConfig?.user,
            host: dbConfig?.host,
            database: dbConfig?.databaseName,
            password: dbConfig?.password,
            port: dbConfig?.port
        });

        this.db.query(`SET search_path TO ${dbConfig?.schema}`, (err: Error) => {
            if (err) {
                this.logger(Logger.ERROR, 'Ошибка установки схемы', err);
            }
        });

        this.db.connect((err: Error) => {
            if (err) {
                this.logger(Logger.ERROR, 'Ошибка подключения к базе данных PostgreSQL', err);
            } else {
                this.logger(Logger.INFO, 'База данных PostgreSQL - подключена');
            }
        });
    }

    async createTable(): Promise<void> {
        let createTableSQL: string;

        await fsPromises
            .readFile(`${this.sqlConfigFilepath}/initPostgreSQL.sql`, { encoding: 'utf-8' })
            .then((fileStr: string) => {
                createTableSQL = fileStr;
            })
            .catch((err) => this.logger(Logger.ERROR, 'Ошибка чтения файла конфигурации', err));

        return new Promise((resolve, reject) => {
            this.queryExecute(createTableSQL)
                .then(() => {
                    this.logger(Logger.INFO, 'Таблица создана');
                    resolve();
                })
                .catch((err) => reject(err));
        });
    }

    async saveVoice(voice: CustomVoice): Promise<void> {
        return new Promise((resolve, reject) => {
            const voiceName: string = voice.title;
            const voicePath: string = voice.voice_url;
            const botId: number = voice.botId;
            const isHidden: number = Number(voice.isHidden);
            this.queryInsert(
                `INSERT INTO audio_inline (inline_type, title, voice_url, bot_id, is_hidden)
                 VALUES ('voice', '${voiceName}', '${voicePath}', '${botId}', '${isHidden}')`
            )
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    async getAllVoices(
        botId: number | undefined,
        isHidden: boolean,
        limit: number,
        offset: number
    ): Promise<CustomVoice[]> {
        return new Promise((resolve, reject) => {
            this.queryAll<CustomVoice>(
                `SELECT id,
                        inline_type AS inlineType,
                        title,
                        voice_url,
                        bot_id      AS botId,
                        is_hidden   AS isHidden
                 FROM audio_inline
                 WHERE bot_id = $1 AND is_hidden = 0 OR (is_hidden = 1 AND is_hidden = $2)
                 ORDER BY title
                 LIMIT $3 OFFSET $4`,
                [botId, Number(isHidden), limit, offset]
            )
                .then((rows) => resolve(rows))
                .catch((err) => reject(err));
        });
    }

    async getVoiceById(id: number): Promise<CustomVoice> {
        return new Promise((resolve, reject) => {
            this.queryGet<CustomVoice>(
                `SELECT id,
                        inline_type AS inlineType,
                        title,
                        voice_url,
                        bot_id      AS botId,
                        is_hidden   AS isHidden
                 FROM audio_inline
                 WHERE id = $1
                 LIMIT (1)`,
                [id]
            )
                .then((rows: CustomVoice[]) => resolve(rows[0]))
                .catch((err) => reject(err));
        });
    }

    async getVoiceByTitleInclude(
        title: string,
        botId: number | undefined,
        isHidden: boolean,
        limit: number,
        offset: number
    ): Promise<CustomVoice[]> {
        return new Promise((resolve, reject) => {
            this.queryAll<CustomVoice>(
                `SELECT id,
                        inline_type AS inlineType,
                        title,
                        voice_url,
                        bot_id      AS botId,
                        is_hidden   AS isHidden
                 FROM audio_inline
                 WHERE title LIKE $1 AND bot_id = $2 AND is_hidden = 0
                    OR (is_hidden = 1 AND is_hidden = $3)
                 ORDER BY title
                 LIMIT $4 OFFSET $5`,
                [`%${title}%`, botId, Number(isHidden), limit, offset]
            )
                .then((rows: CustomVoice[]) => resolve(rows))
                .catch((err) => reject(err));
        });
    }

    async queryExecute<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.query(sql, params, (err: Error) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve([]);
                }
            });
        });
    }

    async queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.query(sql, params, (err: Error, result: QueryResultRow) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve(result.rows.map((row: T) => row as T));
                }
            });
        });
    }

    // useless. like queryAll;
    async queryGet<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.query(sql, params, (err: Error, result: QueryResultRow) => {
                if (err) {
                    this.logger(Logger.ERROR, 'Ошибка выполнения запроса', err);
                    reject(err);
                } else {
                    resolve(result.rows.map((row: T) => row as T));
                }
            });
        });
    }

    async queryInsert(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.query(sql, params, (err: Error) => {
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
            this.db.end((err: Error | null) => {
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
