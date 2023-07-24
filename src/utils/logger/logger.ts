import { ILogLevel } from 'js-logger';

const Logger = require('js-logger');

Logger.useDefaults({
    defaultLevel: Logger.DEBUG,
    formatter: function(messages: any, context: any) {
        const logFormat = `${formatDate(new Date())} [${context.level.name}] [${context.name}]`;
        messages.unshift(logFormat);
    }
});

const formatDate = (date: Date): string => {
    const hours: string = date.getHours().toString().padStart(2, '0');
    const minutes: string = date.getMinutes().toString().padStart(2, '0');
    const seconds: string = date.getSeconds().toString().padStart(2, '0');

    return `[${hours}:${minutes}:${seconds}]`;
};

export const createLogger = (name: string, level: ILogLevel = Logger.getLevel()) => {
    const instance = Logger.get(name);
    instance.setLevel(level);

    return instance;
};