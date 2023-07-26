import { MessageListener } from './eventListeners/messageListener';
import { CallbackQuery, ChosenInlineResult, InlineQuery, Message, Metadata, User } from 'node-telegram-bot-api';
import { InlineListener } from './eventListeners/inlineListener';
import { ILogger } from 'js-logger';
import { createLogger } from './utils/logger/logger';
import { BotConfig } from './config/BotConfig';
import { DataBase } from './config/database/DataBase';
import TelegramBot = require('node-telegram-bot-api');
import { ExtendedMessage } from './utils/types/type';
import { CallbackQueryListener } from './eventListeners/callbackQueryListener';
import * as NodeCache from 'node-cache';

export class Bot {
    private readonly logger: ILogger = createLogger('Bot');
    private readonly db: DataBase;
    private readonly bot: TelegramBot;
    private readonly config: BotConfig;
    private readonly voiceCache = new NodeCache({
        checkperiod: 600
    });

    private botId?: number;
    private inlineHandler: InlineListener;
    private messageHandler: MessageListener;
    private callbackHandler: CallbackQueryListener;

    constructor(token: string, config: BotConfig, db: DataBase) {
        this.bot = new TelegramBot(token, { polling: true });
        this.config = config;
        this.db = db;
        this.messageHandler = new MessageListener(this);
        this.inlineHandler = new InlineListener(this);
        this.callbackHandler = new CallbackQueryListener(this);
        this.setupListeners();

        this.bot.getMe().then((user: User) => {
            this.botId = user.id;
        }).catch(err => {
            this.logger.error(err);
            throw new Error('Не удалось получить информацию о боте');
        });
    }

    getBot(): TelegramBot {
        return this.bot;
    }

    getConfig(): BotConfig {
        return this.config;
    }

    getDB(): DataBase {
        return this.db;
    }

    getBotId(): number | undefined {
        return this.botId;
    }

    getVoiceCache(): NodeCache {
        return this.voiceCache;
    }

    private setupListeners() {
        let handlerCount = 0;
        this.bot.on('message', (message: Message, metadata: Metadata) => {
            this.messageHandler.handleMessage(message as ExtendedMessage, metadata);
        });
        handlerCount++;

        this.bot.on('inline_query', async (ctx: InlineQuery) => {
            await this.inlineHandler.handleMessage(ctx);
        });
        handlerCount++;

        this.bot.on('callback_query', async (ctx: CallbackQuery) => {
            await this.callbackHandler.handleMessage(ctx);
        })

        this.logger.info(`Загружено ${handlerCount} обработчика событий`);
    }
}
