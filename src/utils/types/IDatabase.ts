import { CustomVoice } from './type';

export interface IDatabase {
    disconnect(): Promise<void>;

    queryExecute<T>(sql: string, params?: any[]): Promise<T[]>;

    queryAll<T>(sql: string, params?: any[]): Promise<T[]>;

    queryGet<T>(sql: string, params?: any[]): Promise<T[]>;

    queryInsert(sql: string, params?: any[]): Promise<void>;

    getAllVoices(botId: number | undefined, isHidden: boolean, limit: number, offset: number): Promise<CustomVoice[]>;

    getVoiceById(id: number): Promise<CustomVoice>;

    getVoiceByTitleInclude(title: string, botId: number | undefined, isHidden: boolean, limit: number, offset: number): Promise<CustomVoice[]>;

    saveVoice(voice: CustomVoice): Promise<void>;
}