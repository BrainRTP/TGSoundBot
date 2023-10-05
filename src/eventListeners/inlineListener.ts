// Вспомогательный класс для обработки inline запросов
import { InlineQuery, InlineQueryResultVoice } from 'node-telegram-bot-api';
import { Bot } from '../bot';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';
import { DataBase } from '../config/database/DataBase';
import { CustomVoice } from '../utils/types/type';
import TelegramBot = require('node-telegram-bot-api');
import { BotConfig } from '../config/BotConfig';

export class InlineListener {
    private readonly offset: number = 15;
    private readonly logger: ILogger = createLogger('InlineListener');
    private readonly bot: TelegramBot;
    private readonly botInstance: Bot;
    private readonly config: BotConfig;
    private readonly db: DataBase;

    constructor(botInstance: Bot) {
        this.bot = botInstance.getBot();
        this.botInstance = botInstance;
        this.config = botInstance.getConfig();
        this.db = botInstance.getDB();
    }

    public async handleMessage(ctx: InlineQuery): Promise<void> {
        const query: string = ctx.query;
        let resultAudioList: InlineQueryResultVoice[] = [];
        const isAdmin: boolean = this.config.getConfig()?.adminList.includes(ctx.from.id) ?? false;

        const offset = Number(ctx.offset);

        if (query !== '') {
            this.logger.debug(`${ctx.from.username} -> ${query}`);
            await this.db.getVoiceByTitleInclude(query, this.botInstance.getBotId(), isAdmin, this.offset, offset)
                .then((voices: CustomVoice[]) => {
                    if (voices === undefined || voices.length === 0) {
                        return;
                    }
                    resultAudioList = voices.map((voice: CustomVoice, index) => (
                        {
                            id: String(index),
                            title: voice.title,
                            voice_url: voice.voice_url,
                            type: 'voice'
                        } as InlineQueryResultVoice
                    ));
                });
        } else {
            await this.db.getAllVoices(this.botInstance.getBotId(), isAdmin, this.offset, offset)
                .then((voices: CustomVoice[]) => {
                    if (voices === undefined || voices.length === 0) {
                        return;
                    }
                    resultAudioList = voices.map((voice: CustomVoice, index) => (
                        {
                            id: String(index),
                            title: voice.title,
                            voice_url: voice.voice_url,
                            type: 'voice'
                        } as InlineQueryResultVoice
                    ));
                });
        }

        this.bot.answerInlineQuery(ctx.id, resultAudioList, {next_offset: String(offset + this.offset)})
            .catch((err) => {
                this.logger.error('err', err);
            });
    }
}

