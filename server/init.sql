-- Инициализация базы данных для Literature Locations
-- Пользователь и база данных создаются автоматически через переменные окружения Docker

-- Создаем таблицу локаций
CREATE TABLE IF NOT EXISTS literature_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    current_address TEXT NOT NULL,
    historical_address TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    fiction VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу описаний
CREATE TABLE IF NOT EXISTS location_descriptions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES literature_locations(id) ON DELETE CASCADE
);

-- Добавляем индекс для быстрого поиска описаний по location_id
CREATE INDEX IF NOT EXISTS idx_location_descriptions_location_id ON location_descriptions(location_id);

-- Предоставляем права текущему пользователю (из POSTGRES_USER)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;

-- Выводим информацию о созданных таблицах
\echo 'База данных инициализирована успешно!'
\echo 'Созданные таблицы:'
\dt