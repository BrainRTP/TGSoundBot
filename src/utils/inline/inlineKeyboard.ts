import { InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { CallbackQueryInlineButtonType } from '../types/type';

export const getReplayInlineKeyboard = (): InlineKeyboardMarkup => {
    return {
        inline_keyboard: [
            [
                { text: 'Сохранить', callback_data: CallbackQueryInlineButtonType.SAVE },
                { text: 'Отменить', callback_data: CallbackQueryInlineButtonType.CANCEL }
            ]
        ]
    };

};