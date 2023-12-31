// Вспомогательный класс для обработки inline запросов
import { InlineQuery, InlineQueryResultVoice } from 'node-telegram-bot-api';
import { Bot } from '../bot';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';
import { DataBase } from '../config/database/DataBase';
import TelegramBot = require('node-telegram-bot-api');
import { CustomVoice } from '../utils/types/type';

export class InlineListener {
    private readonly logger: ILogger = createLogger('InlineListener');
    private readonly bot: TelegramBot;
    private readonly botInstance: Bot;
    private readonly db: DataBase;

    constructor(botInstance: Bot) {
        this.bot = botInstance.getBot();
        this.botInstance = botInstance;
        this.db = botInstance.getDB();
    }

    public async handleMessage(ctx: InlineQuery): Promise<void> {
        const query: string = ctx.query;
        let resultAudioList: InlineQueryResultVoice[] = [];
        if (query !== '') {
            this.logger.debug(`${ctx.from.username} -> ${query}`);
            await this.db.getVoiceByTitleInclude(query, this.botInstance.getBotId())
                .then((voices: CustomVoice[]) => {
                    this.logger.debug('voices', voices);
                    if (voices === undefined || voices.length === 0) {
                        return;
                    }
                    resultAudioList = voices.map((voice: CustomVoice) => (
                        {
                            id: voice.id,
                            title: voice.title,
                            voice_url: voice.voice_url,
                            type: 'voice'
                        } as InlineQueryResultVoice
                    ));
                });
        } else {
            await this.db.getAllVoices(this.botInstance.getBotId())
                .then((voices: CustomVoice[]) => {
                    if (voices === undefined || voices.length === 0) {
                        return;
                    }
                    resultAudioList = voices.map((voice: CustomVoice) => (
                        {
                            id: voice.id,
                            title: voice.title,
                            voice_url: voice.voice_url,
                            type: 'voice'
                        } as InlineQueryResultVoice
                    ));
                });
        }

        this.bot.answerInlineQuery(ctx.id, resultAudioList)
            .catch((err) => {
                this.logger.error('err', err);
            });
    }
}

