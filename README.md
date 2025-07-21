# Literature Locations App

Приложение для управления литературными локациями с интерактивной картой.

## 🚀 Технологии

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Map**: MapLibre GL JS
- **State Management**: Zustand
- **Authentication**: JWT
- **Containerization**: Docker + Docker Compose

## 📋 Функциональность

### Для всех пользователей:
- 🗺️ Интерактивная карта с маркерами локаций
- 📱 Адаптивные информационные панели
- 📖 Просмотр описаний локаций
- 📋 Список всех локаций

### Для администраторов:
- ➕ Добавление новых локаций
- ✏️ Редактирование существующих локаций
- 🗑️ Удаление локаций
- 📝 Управление описаниями

## 🛠️ Установка и запуск

### Предварительные требования
- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)

### 1. Клонирование репозитория
```bash
git clone https://github.com/username/literature-locations.git
cd literature-locations
```

### 2. Настройка переменных окружения

#### Клиент
```bash
cp client/.env.example client/.env
```
Отредактируйте `client/.env`:
```env
VITE_MAPTILER_KEY=your_maptiler_key_here
VITE_API_URL=http://localhost:3001
```

#### Сервер
```bash
cp server/.env.example server/.env
```
Отредактируйте `server/.env`:
```env
DATABASE_URL=postgresql://your_db_user:your_secure_password@localhost:5432/your_database
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
ADMIN_LOGIN=your_admin_username
ADMIN_PASSWORD=your_very_secure_admin_password
PORT=3001
```

### 3. Запуск через Docker
```bash
docker-compose up -d --build
```

### 4. Доступ к приложению
- **Приложение**: http://localhost:5173
- **API**: http://localhost:3001

## 🔐 Администрирование

### Вход в админку
1. Перейдите на http://localhost:5173/admin
2. Используйте учетные данные из `server/.env`:
   - Логин: значение `ADMIN_LOGIN`
   - Пароль: значение `ADMIN_PASSWORD`

## 🗺️ Получение MapTiler ключа

1. Зарегистрируйтесь на https://maptiler.com
2. Создайте новый проект
3. Скопируйте API ключ
4. Добавьте в `client/.env`

## 🏗️ Разработка

### Локальный запуск
```bash
# Установка зависимостей
npm install --prefix client
npm install --prefix server

# Запуск PostgreSQL
docker-compose up -d postgres

# Запуск сервера
cd server && npm run dev

# Запуск клиента (в новом терминале)
cd client && npm run dev
```

### Структура проекта
```
├── client/          # React приложение
├── server/          # Node.js API
├── docker-compose.yml
└── README.md
```

## 📝 API Endpoints

### Публичные
- `GET /api/locations` - Получить все локации
- `GET /api/locations/:id/descriptions` - Получить описания локации

### Защищенные (требуют авторизации)
- `POST /api/auth/login` - Авторизация
- `POST /api/locations` - Создать локацию
- `PUT /api/locations/:id` - Обновить локацию
- `DELETE /api/locations/:id` - Удалить локацию
- `POST /api/locations/:id/descriptions` - Добавить описание
- `PUT /api/descriptions/:id` - Обновить описание
- `DELETE /api/descriptions/:id` - Удалить описание

## 🚀 Деплой в продакшен

### Подготовка
1. Скопируйте все `.env.production.example` файлы:
```bash
cp .env.production.example .env.production
cp server/.env.production.example server/.env.production
cp client/.env.production.example client/.env.production
```

2. Заполните все файлы реальными продакшен данными
3. Получите SSL сертификаты для HTTPS
4. Настройте домен и DNS

### Деплой
```bash
# Сделайте скрипт исполняемым
chmod +x deploy.sh

# Запустите деплой
./deploy.sh
```

### Безопасность
⚠️ **ВАЖНО**: Прочитайте [SECURITY.md](SECURITY.md) перед деплоем в продакшен!

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License