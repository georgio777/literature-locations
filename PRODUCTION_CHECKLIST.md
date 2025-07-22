# ✅ Чеклист для продакшен деплоя

## Перед деплоем на сервер

### 1. Локальная проверка
- [ ] Все изменения закоммичены в Git
- [ ] Код протестирован локально
- [ ] Файлы `.env.production` НЕ добавлены в Git (проверить .gitignore)

### 2. Подготовка к деплою
```bash
# На локальном компьютере
git add .
git commit -m "Fix database initialization issues"
git push origin main
```

## На сервере Timeweb Cloud

### 1. Подключение и подготовка
```bash
ssh root@ВАШ_IP_СЕРВЕРА
cd /opt/literature-locations
```

### 2. Полная очистка старого деплоя
```bash
# Остановить контейнеры
docker-compose -f docker-compose.production.yml down

# Удалить volume БД (ВАЖНО: все данные будут потеряны!)
docker volume rm literature-locations_postgres_data

# Очистить Docker
docker system prune -a -f

# Обновить код
git pull origin main
chmod +x *.sh
```

### 3. Настройка окружения
```bash
# Если .env файлы уже настроены корректно:
ls -la .env.production server/.env.production client/.env.production

# Если нужно пересоздать:
rm -f .env.production server/.env.production client/.env.production .env
./setup-production.sh
```

**При запуске setup-production.sh введите:**
- База данных: `literature_locations_prod`
- Пользователь БД: `lit_user` 
- Пароль БД: `[надежный пароль]`
- JWT секрет: `[оставить пустым для автогенерации]`
- Админ логин: `admin`
- Админ пароль: `[надежный пароль]`
- MapTiler ключ: `[ваш ключ]`
- Домен: `https://lit-locations.ru` или `http://ВАШ_IP`

### 4. Деплой
```bash
./deploy-production.sh
```

### 5. Проверка после деплоя
```bash
# Статус контейнеров
docker-compose -f docker-compose.production.yml ps

# Проверка БД
./check-database.sh

# Если есть проблемы с БД
./fix-database.sh
```

## Тестирование

### 1. API тесты
```bash
# Проверка API
curl http://localhost:3001/api/locations

# Должен вернуть [] или данные, НЕ ошибку
```

### 2. Веб-интерфейс
- [ ] Сайт открывается: `http://ВАШ_IP` или `https://ваш-домен.ru`
- [ ] Карта загружается
- [ ] Админка доступна: `/admin`
- [ ] Вход в админку работает

### 3. Тест добавления локации
- [ ] Войти в админку
- [ ] Нажать "Добавить локацию"
- [ ] Заполнить форму:
  - Название: `Тестовая локация`
  - Координаты: `55.7558, 37.6176` (Красная площадь)
  - Текущий адрес: `Красная площадь, 1`
  - Исторический адрес: `Красная площадь`
  - Автор: `Тестовый автор`
  - Произведение: `Тестовое произведение`
- [ ] Нажать "Сохранить"
- [ ] Проверить что локация появилась на карте
- [ ] Проверить что можно кликнуть на маркер и увидеть информацию

### 4. Проверка базы данных
```bash
# Подключение к БД
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod

# В psql:
\dt                                    # Показать таблицы
SELECT COUNT(*) FROM literature_locations;  # Должно быть >= 1
SELECT * FROM literature_locations LIMIT 1; # Показать данные
\q
```

## Если что-то не работает

### Логи для диагностики
```bash
# Логи сервера
docker-compose -f docker-compose.production.yml logs server --tail=20

# Логи БД
docker-compose -f docker-compose.production.yml logs postgres --tail=20

# Все логи
docker-compose -f docker-compose.production.yml logs --tail=50
```

### Частые проблемы

**Проблема: API возвращает ошибку подключения к БД**
```bash
# Проверить переменные окружения
cat server/.env.production | grep DATABASE_URL

# Должно быть: postgresql://lit_user:ПАРОЛЬ@postgres:5432/literature_locations_prod
```

**Проблема: Таблицы не созданы**
```bash
# Пересоздать БД
docker-compose -f docker-compose.production.yml down
docker volume rm literature-locations_postgres_data
docker-compose -f docker-compose.production.yml up -d postgres
# Подождать 30 секунд
docker-compose -f docker-compose.production.yml up -d
```

**Проблема: Админка не принимает данные**
- Проверить логи сервера при попытке добавления
- Проверить что JWT_SECRET установлен
- Проверить что ADMIN_LOGIN и ADMIN_PASSWORD корректны

## Финальная проверка

- [ ] Все контейнеры запущены (статус "Up")
- [ ] API отвечает без ошибок
- [ ] Сайт открывается
- [ ] Админка работает
- [ ] Можно добавить локацию через админку
- [ ] Локация отображается на карте
- [ ] База данных содержит данные

## Бэкап после успешного деплоя

```bash
# Создать бэкап БД
docker exec literature-locations-postgres-1 pg_dump -U lit_user literature_locations_prod > backup_$(date +%Y%m%d_%H%M).sql

# Сохранить настройки
cp .env.production backup_env_$(date +%Y%m%d_%H%M).txt
cp server/.env.production backup_server_env_$(date +%Y%m%d_%H%M).txt
```

---

**🎉 Готово! Приложение должно работать корректно.**