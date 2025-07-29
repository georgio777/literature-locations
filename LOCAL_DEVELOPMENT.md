# 💻 Инструкция по локальной разработке Literature Locations

## 📋 Предварительные требования

### Необходимое ПО:

- **Node.js** 18+ (https://nodejs.org)
- **npm** (устанавливается с Node.js)
- **Docker** и **Docker Compose** (https://docker.com)
- **Git** (https://git-scm.com)

### Проверка установки:

```bash
node --version    # должно быть 18+
npm --version     # должно быть 8+
docker --version  # любая современная версия
git --version     # любая версия
```

## 🚀 Первоначальная настройка

### 1. Клонирование проекта

```bash
git clone https://github.com/georgio777/literature-locations.git
cd literature-locations
```

### 2. Настройка переменных окружения

#### Основные переменные (.env)

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
POSTGRES_DB=literature_locations
POSTGRES_USER=lit_admin
POSTGRES_PASSWORD=SecureDbPass2024!!
```

#### Серверные переменные (server/.env)

```bash
cp server/.env.example server/.env
```

Отредактируйте `server/.env`:

```env
DATABASE_URL=postgresql://lit_admin:SecureDbPass2024!!@localhost:5432/literature_locations
JWT_SECRET=your_local_jwt_secret_32_characters_min
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin123
PORT=3001
```

#### Клиентские переменные (client/.env)

```bash
cp client/.env.example client/.env
```

Отредактируйте `client/.env`:

```env
VITE_MAPTILER_KEY=cGbZcg0sj47hQ4hFp4Qz
VITE_API_URL=http://localhost:3001
```

### 3. Установка зависимостей

```bash
# Установка зависимостей сервера
cd server
npm install
cd ..

# Установка зависимостей клиента
cd client
npm install
cd ..
```

## 🐳 Запуск через Docker (рекомендуется)

### Полный запуск всех сервисов:

```bash
# Запуск всех сервисов (PostgreSQL + Server + Client)
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка всех сервисов
docker-compose down
```

### Запуск только базы данных:

```bash
# Только PostgreSQL для разработки
docker-compose up -d postgres

# Проверка что БД запустилась
docker-compose ps
```

## 🛠️ Ручной запуск (для разработки)

### 1. Запуск базы данных

```bash
# Запуск PostgreSQL в Docker
docker-compose up -d postgres

# Или установите PostgreSQL локально и создайте БД:
# createdb literature_locations
```

### 2. Запуск сервера (в отдельном терминале)

```bash
cd server
npm run dev
# Сервер запустится на http://localhost:3001
```

### 3. Запуск клиента (в отдельном терминале)

```bash
cd client
npm run dev
# Клиент запустится на http://localhost:5173
```

## 🌐 Доступ к приложению

После запуска:

- **Клиент**: http://localhost:5173
- **API**: http://localhost:3001/api/locations
- **Админка**: http://localhost:5173/admin

**Данные для входа в админку:**

- Логин: `admin`
- Пароль: `admin123`

## 🗄️ Работа с базой данных

### Подключение к PostgreSQL:

```bash
# Через Docker
docker exec -it literature-locations-postgres-1 psql -U lit_admin -d literature_locations

# Или напрямую (если PostgreSQL установлен локально)
psql -U lit_admin -d literature_locations
```

### Полезные SQL команды:

```sql
-- Просмотр таблиц
\dt

-- Просмотр данных
SELECT * FROM literature_locations;
SELECT * FROM location_descriptions;

-- Очистка данных (для тестирования)
TRUNCATE literature_locations CASCADE;

-- Выход
\q
```

### Пересоздание базы данных:

```bash
# Остановка и удаление volume
docker-compose down
docker volume rm literature-locations_postgres_data

# Запуск заново (создаст новую БД)
docker-compose up -d postgres
```

## 🔧 Полезные команды для разработки

### NPM скрипты:

#### Сервер (server/):

```bash
npm run dev      # Запуск в режиме разработки с автоперезагрузкой
npm start        # Обычный запуск
npm run lint     # Проверка кода
```

#### Клиент (client/):

```bash
npm run dev      # Запуск dev сервера
npm run build    # Сборка для продакшена
npm run preview  # Предпросмотр продакшен сборки
npm run lint     # Проверка кода
```

### Docker команды:

```bash
# Просмотр статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f [service_name]

# Перезапуск сервиса
docker-compose restart [service_name]

# Пересборка образов
docker-compose up -d --build

# Очистка системы
docker system prune -f
```

## 🐛 Отладка

### Проверка подключения к БД:

```bash
# Проверка что PostgreSQL запущен
docker-compose ps postgres

# Проверка подключения
curl http://localhost:3001/api/locations
```

### Проверка API:

```bash
# Получение локаций
curl http://localhost:3001/api/locations

# Авторизация
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'
```

### Общие проблемы:

#### Порт уже занят:

```bash
# Найти процесс на порту 3001
lsof -i :3001
# или
netstat -tulpn | grep 3001

# Убить процесс
kill -9 PID
```

#### Проблемы с Docker:

```bash
# Перезапуск Docker
sudo systemctl restart docker

# Очистка всех контейнеров и образов
docker system prune -a -f
```

#### Проблемы с npm:

```bash
# Очистка кэша npm
npm cache clean --force

# Удаление node_modules и переустановка
rm -rf node_modules package-lock.json
npm install
```

## 📁 Структура проекта

```
literature-locations/
├── client/                 # React приложение
│   ├── src/
│   │   ├── components/    # Компоненты
│   │   ├── pages/         # Страницы
│   │   ├── store/         # Zustand стор
│   │   └── types/         # TypeScript типы
│   ├── .env               # Переменные клиента (НЕ в Git)
│   └── package.json
├── server/                # Node.js API
│   ├── .env              # Переменные сервера (НЕ в Git)
│   ├── index.js          # Основной файл сервера
│   ├── init.sql          # Инициализация БД
│   └── package.json
├── nginx/                # Конфигурация Nginx
├── .env                  # Переменные Docker Compose (НЕ в Git)
├── docker-compose.yml    # Для разработки
└── README.md
```

## 🔄 Workflow разработки

### Обычный цикл разработки:

1. Запустите базу данных: `docker-compose up -d postgres`
2. Запустите сервер: `cd server && npm run dev`
3. Запустите клиент: `cd client && npm run dev`
4. Вносите изменения в код
5. Тестируйте в браузере: http://localhost:5173
6. Коммитьте изменения: `git add . && git commit -m "..." && git push`

### Тестирование продакшен сборки локально:

```bash
# Сборка клиента
cd client
npm run build

# Запуск через Docker Compose (продакшен режим)
cd ..
docker-compose -f docker-compose.production.yml up -d --build
```

## 🎯 Советы по разработке

### Горячие клавиши в VS Code:

- `Ctrl+Shift+P` - Командная палитра
- `Ctrl+`` - Открыть терминал
- `F5` - Запуск отладки

### Полезные расширения VS Code:

- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Отладка React:

- Используйте React Developer Tools в браузере
- `console.log()` для быстрой отладки
- Zustand DevTools для отладки состояния

### Отладка Node.js:

- Используйте `console.log()` или `console.error()`
- Проверяйте логи Docker: `docker-compose logs server`
- Используйте Postman для тестирования API

## 📞 Помощь

При возникновении проблем:

1. Проверьте что все сервисы запущены
2. Посмотрите логи в терминале
3. Проверьте переменные окружения в `.env` файлах
4. Убедитесь что порты не заняты другими процессами
5. Попробуйте перезапустить Docker контейнеры

---

**Удачной разработки! 💻✨**
