import { InlineQueryResultVoice, Message } from 'node-telegram-bot-api';

export interface CustomVoice extends Pick<InlineQueryResultVoice, 'id' | 'title' | 'voice_url'> {
    botId: number;
    isHidden: boolean;
}

export interface ExtendedMessage extends Message {
    via_bot: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
    };
    audio: Message['audio'] & {
        file_name: string;
    };
}

export enum SoundType {
    AUDIO = 'AUDIO',
    VOICE = 'VOICE',
}

export enum CallbackQueryInlineButtonType {
    SAVE = 'SAVE',
    CANCEL = 'CANCEL',
    SWITCH_HIDDEN = 'SWITCH_HIDDEN'
}

export interface SoundFile {
    filePath: string;
    fileName: string;
}

export interface CacheInfo {
    messageId: number;
    customVoice: CustomVoice;
}