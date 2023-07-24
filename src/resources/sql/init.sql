CREATE TABLE IF NOT EXISTS audio_inline
(
    id          INTEGER PRIMARY KEY autoincrement,
    inline_type TEXT NOT NULL,
    title       TEXT NOT NULL,
    voice_url   TEXT NOT NULL,
    bot_id      INTEGER NOT NULL
);