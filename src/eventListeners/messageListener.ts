// Вспомогательный класс для обработки сообщений
import { Message, Metadata } from 'node-telegram-bot-api';
import { ILogger } from 'js-logger';
import { createLogger } from '../utils/logger/logger';
import { BotConfig } from '../config/BotConfig';
import { Bot } from '../bot';
import { CustomVoice, ExtendedMessage, SoundFile, SoundType } from '../utils/types/type';
import { randomUUID } from 'crypto';
import { WriteStream } from 'fs';
import TelegramBot = require('node-telegram-bot-api');
import fs = require('fs');
import ErrnoException = NodeJS.ErrnoException;

export class MessageListener {
    private readonly logger: ILogger = createLogger('MessageListener');
    private readonly bot: TelegramBot;
    private readonly botInstance: Bot;
    private readonly config: BotConfig;

    constructor(botInstance: Bot) {
        this.botInstance = botInstance;
        this.bot = botInstance.getBot();
        this.config = botInstance.getConfig();
    }

    public handleMessage(msg: ExtendedMessage, metadata?: Metadata) {
        const chatId: number = msg.chat.id;
        if (msg.from === undefined || msg.from.id === undefined) {
            return;
        }

        this.logger.debug(`${msg.from.username} -> [${msg.text}]`);

        if (!this.config.getConfig()?.adminList.includes(msg.from.id)) {
            this.bot.sendMessage(chatId, 'Загрузка аудио доступна только админам')
                .catch((err) => {
                    this.logger.error('Ошибка отправки сообщения', err);
                });
            return;
        }

        this.parseSoundFile(msg)
            .then((soundFile: SoundFile) => {
                this.saveAndSendVoice(msg, soundFile);
            })
            .catch((err) => {
                this.logger.error('Ошибка при загрузке файла', err);
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
                    const completeMessage = `Голосовое сообщение успешно загружено\n\nНазвание: ${msg.caption ?? soundFile.fileName} \n\nid: ${voiceId}`;

                    this.saveVoice(msg, result, soundFile.fileName)
                        .then(() => {
                            this.bot.editMessageCaption(completeMessage, {
                                chat_id: msg.chat.id,
                                message_id: result.message_id
                            }).catch((err) => {
                                this.logger.error('Ошибка при отправке голосового сообщения', err);
                            });
                        })
                        .catch((err) => {
                            this.logger.error('Ошибка при сохранении голосового сообщения', err);
                        });
                })
                .catch((err) => {
                    this.logger.error('Неизвестная ошибка при отправке голосового сообщения', err);
                });
        });
    }

    private async saveVoice(originalMsg: ExtendedMessage, result: Message, fileName: string): Promise<void> {
        if (result.voice === undefined || result.voice.file_id === undefined) {
            return;
        }

        const voice: CustomVoice = {
            id: result.voice?.file_id,
            title: originalMsg.caption ?? fileName,
            voice_url: result.voice?.file_id,
            botId: this.botInstance.getBotId() ?? 0
        };

        await this.botInstance.getDB().saveVoice(voice)
            .then(() => {
                this.logger.debug(`Голосовое сообщение ${voice.title} успешно добавлено`);
            })
            .catch((err) => {
                this.logger.error('Ошибка при добавлении голосового сообщения', err);
            });
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
