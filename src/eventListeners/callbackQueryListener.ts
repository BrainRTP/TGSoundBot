// Вспомогательный класс для обработки inline запросов
import { CallbackQuery } from 'node-telegram-bot-api';
import { Bot } from '../bot';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';
import { DataBase } from '../config/database/DataBase';
import { CacheInfo, CallbackQueryInlineButtonType, CustomVoice } from '../utils/types/type';
import * as NodeCache from 'node-cache';
import TelegramBot = require('node-telegram-bot-api');
import { getReplayInlineKeyboard } from '../utils/inline/inlineKeyboard';

export class CallbackQueryListener {
    private readonly logger: ILogger = createLogger('CallbackQueryListener');
    private readonly bot: TelegramBot;
    private readonly botInstance: Bot;
    private readonly db: DataBase;
    private readonly voiceCache: NodeCache;

    constructor(botInstance: Bot) {
        this.bot = botInstance.getBot();
        this.botInstance = botInstance;
        this.db = botInstance.getDB();
        this.voiceCache = botInstance.getVoiceCache();
    }

    public async handleMessage(ctx: CallbackQuery): Promise<void> {
        if (ctx.message?.chat === undefined) {
            return;
        }

        const callbackQueryInlineButtonType = ctx.data as CallbackQueryInlineButtonType;
        const allCache = this.voiceCache.get<CacheInfo[]>(ctx.message.chat.id);
        if (allCache === undefined) {
            this.logger.error('Кэш не найден');
            return;
        }

        const messageIdQuery = ctx.message.message_id;
        const cache = allCache.find((cacheInfo: CacheInfo) => {
            return cacheInfo.messageId === messageIdQuery - 1;
        });

        if (cache === undefined || cache.customVoice === undefined) {
            this.logger.error('Не найдено голосовое сообщение в кэше');
            return;
        }

        if (callbackQueryInlineButtonType === CallbackQueryInlineButtonType.SAVE) {
            this.saveVoice(cache.customVoice)
                .then(() => {
                    this.sendCompleteMessage(ctx, messageIdQuery);
                    if (ctx.message?.chat !== undefined) {
                        this.removeFromCache(ctx, messageIdQuery, ctx.message.chat.id);
                    }
                })
                .catch((err) => {
                    this.logger.error('Ошибка при сохранении голосового сообщения', err);
                });
        } else if (callbackQueryInlineButtonType === CallbackQueryInlineButtonType.CANCEL) {
            this.sendCancelMessage(ctx, messageIdQuery);
            if (ctx.message?.chat !== undefined) {
                this.removeFromCache(ctx, messageIdQuery, ctx.message.chat.id);
            }
        } else if (callbackQueryInlineButtonType === CallbackQueryInlineButtonType.SWITCH_HIDDEN) {
            const customVoice: CustomVoice = {...cache.customVoice, isHidden: !cache.customVoice.isHidden};
            this.updateCacheCustomVoice(customVoice, ctx, messageIdQuery, ctx.message.chat.id);
            this.updateInlineKeyboard(customVoice, ctx);
        }
    }

    private updateInlineKeyboard(customVoice: CustomVoice, ctx: CallbackQuery){

        this.bot.editMessageReplyMarkup(getReplayInlineKeyboard(customVoice), {
            chat_id: ctx.message?.chat.id,
            message_id: ctx.message?.message_id
        }).catch((err) => {
            this.logger.error('Ошибка при отправке результата обработки сообщения', err);
        })
    }

    private removeFromCache(ctx: CallbackQuery, messageIdQuery: number, chatId: number) {
        if (ctx.message?.chat === undefined) {
            this.logger.error('Не найдено голосовое сообщение в кэше');
            return;
        }

        const cache = this.voiceCache.get<CacheInfo[]>(ctx.message.chat.id)?.filter((cacheInfo: CacheInfo) => cacheInfo.messageId !== messageIdQuery - 1);

        if (cache === undefined) {
            this.logger.error('Не найдено голосовое сообщение в кэше');
            return;
        }

        this.voiceCache.set<CacheInfo[]>(chatId, cache);
    }

    private updateCacheCustomVoice(customVoice: CustomVoice, ctx: CallbackQuery, messageIdQuery: number, chatId: number) {
        if (ctx.message?.chat === undefined) {
            this.logger.error('Не найдено голосовое сообщение в кэше');
            return;
        }

        const cache = this.voiceCache.get<CacheInfo[]>(ctx.message.chat.id)?.map((cacheInfo: CacheInfo) => {
            if (cacheInfo.messageId == messageIdQuery - 1) {
                return {...cacheInfo, customVoice}
            }
            return cacheInfo;
        })

        if (cache === undefined) {
            this.logger.error('Не найдено голосовое сообщение в кэше');
            return;
        }

        this.voiceCache.set<CacheInfo[]>(chatId, cache);
    }

    private sendCompleteMessage(ctx: CallbackQuery, messageIdQuery: number) {
        const completeMessage = ctx.message?.caption + '\n\n' + 'Голосовое сообщение успешно сохранено✅';
        this.bot.editMessageCaption(completeMessage, {
            chat_id: ctx.message?.chat.id,
            message_id: messageIdQuery,
            reply_markup: undefined,
            parse_mode: 'HTML'
        });
    }

    private sendCancelMessage(ctx: CallbackQuery, messageIdQuery: number) {
        const cancelMessage = ctx.message?.caption + '\n\n' + 'Сохранение голосового сообщения отменено❌';
        this.bot.editMessageCaption(cancelMessage, {
            chat_id: ctx.message?.chat.id,
            message_id: messageIdQuery,
            reply_markup: undefined,
            parse_mode: 'HTML'
        });
    }

    private async saveVoice(customVoice: CustomVoice): Promise<void> {
        await this.botInstance.getDB().saveVoice(customVoice)
            .then(() => {
                this.logger.debug(`Голосовое сообщение ${customVoice.title} успешно добавлено`);
            })
            .catch((err) => {
                this.logger.error('Ошибка при добавлении голосового сообщения', err);
            });
    }
}
