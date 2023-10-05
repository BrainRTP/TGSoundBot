// Вспомогательный класс для обработки сообщений
import { Message, Metadata } from 'node-telegram-bot-api';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';
import { BotConfig } from '../config/BotConfig';
import { Bot } from '../bot';
import { CacheInfo, Command, CustomVoice, ExtendedMessage, SoundFile, SoundType } from '../utils/types/type';
import { randomUUID } from 'crypto';
import { WriteStream } from 'fs';
import { getReplayInlineKeyboard } from '../utils/inline/inlineKeyboard';
import * as NodeCache from 'node-cache';
import { DataBase } from '../config/database/DataBase';
import TelegramBot = require('node-telegram-bot-api');
import fs = require('fs');
import ErrnoException = NodeJS.ErrnoException;

export class MessageListener {
    private readonly logger: ILogger = createLogger('MessageListener');
    private readonly bot: TelegramBot;
    private readonly botInstance: Bot;
    private readonly config: BotConfig;
    private readonly voiceCache: NodeCache;
    private readonly db: DataBase;

    constructor(botInstance: Bot) {
        this.botInstance = botInstance;
        this.bot = botInstance.getBot();
        this.config = botInstance.getConfig();
        this.voiceCache = botInstance.getVoiceCache();
        this.db = botInstance.getDB();
    }

    public handleMessage(msg: ExtendedMessage, metadata?: Metadata) {
        const chatId: number = msg.chat.id;
        if (msg.from === undefined || msg.from.id === undefined) {
            return;
        }

        const isAudioMessage = this.checkMessageContainsAudio(msg);

        this.logger.debug(`${msg.from.username} -> [${msg.text ?? isAudioMessage ? 'audio/voice' : 'undefined'}]`);

        if (!this.config.getConfig()?.adminList.includes(msg.from.id)) {
            this.bot.sendMessage(chatId, 'Загрузка аудио доступна только админам')
                .catch((err) => {
                    this.logger.error('Ошибка отправки сообщения', err);
                });
            return;
        }

        if (isAudioMessage) {
            this.parseSoundFile(msg)
                .then((soundFile: SoundFile) => {
                    this.saveAndSendVoice(msg, soundFile);
                })
                .catch((err) => {
                    this.logger.error('Ошибка при загрузке файла', err);
                });
            return;
        }

        if (!msg.text || !msg.text.startsWith('!')) {
            return;
        }

        const command = msg.text.slice(1, msg.text.length).toUpperCase();

        switch (command) {
            case Command.LIST:
                this.sendList(chatId, false);
                break;
            case Command.LIST_SORT:
                this.sendList(chatId, true);
                break;
            default:
                return;
        }

    }

    private async sendList(chatId: number, isSorted: boolean): Promise<void> {

        let resultAudioList: CustomVoice[] = [];

        await this.db.getAllVoices(this.botInstance.getBotId(), true, 100, 0)
            .then((voices: CustomVoice[]) => {
                if (voices === undefined || voices.length === 0) {
                    return;
                }
                resultAudioList = [...voices];
                if (isSorted) {
                    resultAudioList.sort((a, b) => Number(a.id) - Number(b.id));
                }
            });

        let messageWithList = 'Список аудио:\n\n';
        let count = 1;
        resultAudioList.forEach((voice) => {
            const isHidden = Boolean(voice.isHidden) ? '(🔒)' : ''
            let messagePattern = `#${count} | id-${voice.id})  <code>${voice.title}</code> ${isHidden}\n`;
            messageWithList += messagePattern;
            count++;
        });

        this.bot.sendMessage(chatId, messageWithList, {parse_mode: 'HTML'})
            .catch((err) => {
                this.logger.error('Ошибка отправки сообщения', err);
            });
    }

    private saveAndSendVoice(msg: ExtendedMessage, soundFile: SoundFile) {
        fs.readFile(soundFile.filePath, (err: ErrnoException | null, data: Buffer) => {
            this.bot.sendVoice(msg.chat.id, data, { caption: 'test2' })
                .then(async (result: Message): Promise<void> => {
                    if (result.voice === undefined || result.voice.file_id === undefined) {
                        return;
                    }
                    const voiceId: string = result.voice.file_id;
                    const completeMessage = 'Голосовое сообщение предварительно загружено\n\n<b>Название</b>: ' + (msg.caption ?? soundFile.fileName) + '\n\n<b>id</b>: <code>' + voiceId + '</code>';

                    const customVoice: CustomVoice = this.getCustomVoice(msg, result, soundFile.fileName);

                    this.bot.editMessageCaption(completeMessage, {
                        chat_id: msg.chat.id,
                        message_id: result.message_id,
                        reply_markup: getReplayInlineKeyboard(customVoice),
                        parse_mode: 'HTML'
                    }).catch((err) => {
                        this.logger.error('Ошибка при отправке результата обработки сообщения', err);
                    });

                    const oldCache = this.voiceCache.get<CacheInfo[]>(msg.chat.id) ?? [];
                    const cacheInfo: CacheInfo = {
                        messageId: msg.message_id,
                        customVoice: customVoice
                    };

                    this.voiceCache.set<CacheInfo[]>(msg.chat.id, [
                        ...oldCache,
                        cacheInfo
                    ]);
                })
                .catch((err) => {
                    this.logger.error('Неизвестная ошибка при отправке голосового сообщения', err);
                });
        });
    }

    private getCustomVoice(originalMsg: ExtendedMessage, result: Message, fileName: string): CustomVoice {
        if (result.voice === undefined) {
            throw new Error('Невозможно получить CustomVoice из сообщения');
        }

        return {
            id: result.voice?.file_id,
            title: originalMsg.caption ?? fileName,
            voice_url: result.voice?.file_id,
            botId: this.botInstance.getBotId() ?? 0,
            isHidden: false
        };
    }

    private checkMessageContainsAudio(msg: ExtendedMessage): boolean {
        if (msg.audio !== undefined || msg.voice !== undefined || msg.via_bot !== undefined) {
            return true;
        } else {
            return false;
        }
    }

    private async parseSoundFile(msg: ExtendedMessage): Promise<SoundFile> {
        return new Promise((resolve, reject) => {
            let soundType: SoundType;
            if (msg.audio === undefined && msg.voice !== undefined && msg.via_bot === undefined) {
                soundType = SoundType.VOICE;
            } else if (msg.voice === undefined) {
                soundType = SoundType.AUDIO;
            } else {
                reject('Сообщение не содержит аудио файла');
            }

            // @ts-ignore
            const isAudio = soundType === SoundType.AUDIO;
            const customSoundName: string | undefined = msg.caption;

            const fileId: string | undefined = isAudio ? msg.audio?.file_id : msg.voice?.file_id;
            if (fileId === undefined) {
                reject('Не удалось получить id файла');
                return;
            }

            const fileName: string = isAudio ? msg.audio?.file_name.split('.')[0] : customSoundName ?? randomUUID();
            const filePath = `D:\\oggFiles\\${fileName}-${fileId}.ogg`;
            const fileIS: WriteStream = fs.createWriteStream(filePath);

            this.bot.getFileStream(fileId)
                .on('data', (chunk: any) => {
                    fileIS.write(chunk);
                })
                .on('close', () => {
                    fileIS.end();
                    resolve({ filePath, fileName });
                });
        });

    }
}
