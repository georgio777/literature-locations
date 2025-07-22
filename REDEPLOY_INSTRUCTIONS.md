# 🔄 Инструкция по переразвертыванию с исправлениями

## Проблема
На хостинге Timeweb Cloud не работает добавление новых локаций из админки в базу данных.

## Исправления в коде
1. ✅ Исправлен `server/init.sql` - убраны жестко заданные пользователи
2. ✅ Исправлен `setup-production.sh` - правильная подстановка переменных
3. ✅ Улучшен `deploy-production.sh` - добавлены проверки базы данных
4. ✅ Добавлены скрипты диагностики: `check-database.sh` и `fix-database.sh`

## Шаги для переразвертывания на сервере

### 1. Подключитесь к серверу Timeweb Cloud
```bash
ssh root@ВАШ_IP_СЕРВЕРА
cd /opt/literature-locations
```

### 2. Остановите и очистите старый деплой
```bash
# Остановите все контейнеры
docker-compose -f docker-compose.production.yml down

# Удалите volume с базой данных (для полной переинициализации)
docker volume rm literature-locations_postgres_data

# Очистите Docker систему
docker system prune -a -f
```

### 3. Обновите код
```bash
# Получите последние изменения
git pull origin main

# Убедитесь что скрипты исполняемые
chmod +x *.sh
```

### 4. Переразвертывание

**Вариант A: Если у вас уже есть рабочие .env файлы**
```bash
# Просто запустите деплой
./deploy-production.sh
```

**Вариант B: Если нужно пересоздать настройки**
```bash
# Удалите старые .env файлы
rm -f .env.production server/.env.production client/.env.production .env

# Запустите настройку заново
./setup-production.sh

# Затем деплой
./deploy-production.sh
```

### 5. Проверка работы базы данных
```bash
# Запустите диагностику
./check-database.sh
```

### 6. Если есть проблемы с базой данных
```bash
# Запустите исправление
./fix-database.sh
```

## Что проверить после деплоя

### 1. Статус контейнеров
```bash
docker-compose -f docker-compose.production.yml ps
```
Все сервисы должны быть в статусе "Up"

### 2. Проверка API
```bash
curl http://localhost:3001/api/locations
```
Должен вернуть `[]` (пустой массив) или данные

### 3. Проверка базы данных
```bash
# Подключение к БД
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod

# В psql выполните:
\dt  # Показать таблицы
SELECT COUNT(*) FROM literature_locations;  # Проверить данные
\q   # Выйти
```

### 4. Тест добавления локации через админку
1. Откройте `http://ВАШ_IP/admin` или `https://ваш-домен.ru/admin`
2. Войдите с учетными данными администратора
3. Попробуйте добавить тестовую локацию
4. Проверьте что она появилась на карте

## Логи для диагностики

### Логи сервера (Node.js)
```bash
docker-compose -f docker-compose.production.yml logs server -f
```

### Логи базы данных
```bash
docker-compose -f docker-compose.production.yml logs postgres -f
```

### Логи всех сервисов
```bash
docker-compose -f docker-compose.production.yml logs -f
```

## Если проблема не решилась

### 1. Проверьте переменные окружения
```bash
cat .env.production
cat server/.env.production
```

### 2. Проверьте структуру таблиц
```bash
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod -c "\d literature_locations"
```

### 3. Проверьте права доступа
```bash
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod -c "\dp"
```

### 4. Тест прямого добавления в БД
```bash
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod

# В psql:
INSERT INTO literature_locations (name, longitude, latitude, current_address, historical_address, author, fiction) 
VALUES ('Тест', 37.6156, 55.7522, 'Тестовый адрес', 'Исторический адрес', 'Тестовый автор', 'Тестовое произведение');

SELECT * FROM literature_locations;
```

## Контакты для поддержки
Если проблема не решается, предоставьте:
1. Логи сервера: `docker-compose -f docker-compose.production.yml logs server --tail=50`
2. Логи PostgreSQL: `docker-compose -f docker-compose.production.yml logs postgres --tail=50`
3. Результат проверки: `./check-database.sh`
4. Скриншот ошибки из админки (если есть)