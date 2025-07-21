-- Создаем пользователя базы данных (если не существует)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'lit_admin') THEN

      CREATE ROLE lit_admin LOGIN PASSWORD 'SecureDbPass2024!!';
   END IF;
END
$do$;

-- Предоставляем права пользователю
GRANT ALL PRIVILEGES ON DATABASE literature_locations TO lit_admin;

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

-- Предоставляем права на таблицы пользователю lit_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lit_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lit_admin;