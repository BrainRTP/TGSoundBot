-- language: PostgreSQL
CREATE TABLE IF NOT EXISTS audio_inline
(
    id          SERIAL PRIMARY KEY,
    inline_type TEXT NOT NULL,
    title       TEXT NOT NULL,
    voice_url   TEXT NOT NULL,
    bot_id      BIGINT NOT NULL,
    is_hidden   INTEGER NOT NULL DEFAULT 0
);