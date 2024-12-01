import { InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { CallbackQueryInlineButtonType, CustomVoice } from '../types/type';

export const getReplayInlineKeyboard = (customVoice: CustomVoice): InlineKeyboardMarkup => {
    const isHiddenText = customVoice.isHidden ? 'Скрыто 🔒' : 'Открыто🔓';
    return {
        inline_keyboard: [

            [
                {
                    text: `Изменить видимость: ${isHiddenText}`,
                    callback_data: CallbackQueryInlineButtonType.SWITCH_HIDDEN
                }
            ],
            [
                { text: 'Сохранить', callback_data: CallbackQueryInlineButtonType.SAVE },
                { text: 'Отменить', callback_data: CallbackQueryInlineButtonType.CANCEL }
            ]
        ]
    };

};