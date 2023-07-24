## TGSoundBot
<a href="https://github.com/rishz/URL-Shortener/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-red.svg" alt="license"/></a>
<a href="https://github.com/rishz/URL-Shortener/blob/master/LICENSE"><img src="https://img.shields.io/badge/version-2.0.0-blue" alt="license"/></a>

**TGSoundBot** - это бот для Telegram, написанный на Node.js 18 с использованием TypeScript и node-telegram-bot-api. Бот предназначен для отправки inline аудиозаписей в любом чате Telegram. Он также поддерживает добавление новых аудио через чат с ботом в виде аудио файлов или голосовых сообщений.

BotDemo - [@ugarSoundBot](https://t.me/ugarSoundBot)

## Установка и запуск в dev-режиме 
1. Убедитесь, что у вас установлен Node.js версии 18 и выше.
2. Склонируйте репозиторий с помощью Git:
```bash
git clone https://github.com/your-username/TelegramMemeSoundBot.git
```

3. Перейдите в папку проекта:
```bash
cd TelegramMemeSoundBot
```

4. Установите зависимости:
```
npm install
```

5. Запустите бота:
```sql
npm dev
```

## Добавление новых аудио
Вы можете добавить новую аудиозапись в бота, отправив аудио файл или голосовое сообщение через чат с ботом. Он автоматически добавит эту аудиозапись в базу данных и сделает ее доступной для отправки в других чатах с помощью inline-режима.

## База данных
Бот использует SQLite для хранения информации о созданных аудиозаписях. В будущем планируется добавить поддержку PostgreSQL для улучшения производительности и масштабируемости.

## Вклад и обратная связь
Если у вас есть предложения по улучшению или вы хотите сообщить об ошибке, не стесняйтесь создать issue или сделать pull request в репозитории проекта.

## Лицензия
Этот проект распространяется под лицензией **MIT**. Вы можете свободно использовать, изменять и распространять этот код в соответствии с условиями лицензии.