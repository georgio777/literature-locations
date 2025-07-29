# 🚀 Инструкция по развертыванию Literature Locations на Timeweb Cloud

## 📋 Предварительные требования

1. **VPS сервер на Timeweb Cloud**:

   - ОС: Ubuntu 22.04 LTS
   - Конфигурация: минимум 2 CPU, 4GB RAM, 40GB SSD
   - Публичный IP адрес

2. **Домен** (опционально):

   - Домен типа `lit-locations.ru`
   - Доступ к DNS настройкам

3. **API ключи**:
   - MapTiler API ключ (получить на https://maptiler.com)

## 🌐 Настройка DNS (если есть домен)

В панели управления доменом добавьте A-записи:

```
Тип: A
Имя: @
Значение: ВАШ_IP_СЕРВЕРА
TTL: 3600

Тип: A
Имя: www
Значение: ВАШ_IP_СЕРВЕРА
TTL: 3600
```

## 🔧 Развертывание на сервере

### 1. Подключение к серверу

```bash
ssh root@ВАШ_IP_СЕРВЕРА
```

### 2. Клонирование проекта

```bash
cd /opt
git clone https://github.com/georgio777/literature-locations.git
cd literature-locations
```

### 3. Первоначальная настройка

```bash
# Делаем скрипт исполняемым
chmod +x setup-production.sh

# Запускаем интерактивную настройку
./setup-production.sh
```

**Скрипт запросит:**

- Название базы данных (по умолчанию: `literature_locations_prod`)
- Пользователя БД (по умолчанию: `lit_user`)
- Пароль базы данных (придумайте надежный)
- JWT секрет (будет сгенерирован автоматически или введите свой)
- Логин администратора (по умолчанию: `admin`)
- Пароль администратора (придумайте надежный)
- MapTiler API ключ
- Домен БЕЗ /api (например: `https://lit-locations.ru` или `http://ВАШ_IP`)

### 4. Запуск приложения

```bash
# Делаем скрипт исполняемым
chmod +x deploy-production.sh

# Запускаем автоматический деплой
./deploy-production.sh
```

### 5. Настройка SSL (если есть домен)

**Проверьте что DNS работает:**

```bash
nslookup ваш-домен.ru
```

**Получите SSL сертификат:**

```bash
# Останавливаем контейнеры для освобождения порта 80
docker-compose -f docker-compose.production.yml down

# Устанавливаем Certbot
apt update
apt install -y certbot

# Получаем сертификат
certbot certonly --standalone -d ваш-домен.ru -d www.ваш-домен.ru

# Запускаем приложение обратно
docker-compose -f docker-compose.production.yml up -d
```

## 🔄 Обновление проекта

### На локальном компьютере:

```bash
# Вносите изменения в код
git add .
git commit -m "Описание изменений"
git push origin main
```

### На сервере:

```bash
ssh root@ВАШ_IP_СЕРВЕРА
cd /opt/literature-locations

# Быстрое обновление одной командой
./update.sh
```

## 🌐 Доступ к приложению

После успешного развертывания:

**С доменом и SSL:**

- Сайт: `https://ваш-домен.ru`
- Админка: `https://ваш-домен.ru/admin`

**Только с IP:**

- Сайт: `http://ВАШ_IP_СЕРВЕРА`
- Админка: `http://ВАШ_IP_СЕРВЕРА/admin`

**Данные для входа в админку:**

- Логин: тот что указали при настройке
- Пароль: тот что указали при настройке

## 🔧 Полезные команды

### Управление контейнерами:

```bash
# Просмотр статуса
docker-compose -f docker-compose.production.yml ps

# Просмотр логов
docker-compose -f docker-compose.production.yml logs -f

# Перезапуск сервиса
docker-compose -f docker-compose.production.yml restart server

# Остановка всех сервисов
docker-compose -f docker-compose.production.yml down

# Полная пересборка
docker-compose -f docker-compose.production.yml up -d --build
```

### Работа с базой данных:

```bash
# Подключение к PostgreSQL
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod

# Бэкап базы данных
docker exec literature-locations-postgres-1 pg_dump -U lit_user literature_locations_prod > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
cat backup_20250721.sql | docker exec -i literature-locations-postgres-1 psql -U lit_user literature_locations_prod
```

## 🛠️ Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker-compose -f docker-compose.production.yml logs

# Очистите систему Docker
docker system prune -a -f

# Пересоберите образы
docker-compose -f docker-compose.production.yml up -d --build
```

### Проблема: База данных не инициализируется

```bash
# Удалите volume с БД и пересоздайте
docker-compose -f docker-compose.production.yml down
docker volume rm literature-locations_postgres_data
docker-compose -f docker-compose.production.yml up -d
```

### Проблема: SSL сертификат не работает

```bash
# Проверьте что DNS настроен
nslookup ваш-домен.ru

# Проверьте что порт 80 свободен
netstat -tlnp | grep :80

# Остановите nginx если нужно
systemctl stop nginx

# Повторите получение сертификата
certbot certonly --standalone -d ваш-домен.ru
```

### Проблема: API возвращает ошибки

```bash
# Проверьте логи сервера
docker-compose -f docker-compose.production.yml logs server

# Проверьте что база данных работает
docker exec -it literature-locations-postgres-1 psql -U lit_user -d literature_locations_prod -c "\dt"

# Проверьте переменные окружения
cat server/.env.production
```

## 🔒 Безопасность

### Важные моменты:

- ✅ Все пароли и секреты хранятся только на сервере
- ✅ Файлы `.env.production` не попадают в Git
- ✅ SSL сертификаты автоматически продлеваются
- ✅ Nginx настроен с базовой защитой от атак

### Рекомендации:

- Регулярно обновляйте систему: `apt update && apt upgrade`
- Делайте бэкапы базы данных
- Мониторьте логи на предмет подозрительной активности
- Используйте сложные пароли для админки

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи контейнеров
2. Убедитесь что все сервисы запущены
3. Проверьте настройки DNS и SSL
4. Обратитесь к разделу "Решение проблем"

## 🎯 Структура файлов

```
/opt/literature-locations/
├── .env.production          # Переменные БД (НЕ в Git)
├── server/.env.production   # Серверные настройки (НЕ в Git)
├── client/.env.production   # Клиентские настройки (НЕ в Git)
├── docker-compose.production.yml
├── setup-production.sh      # Первоначальная настройка
├── deploy-production.sh     # Автоматический деплой
├── update.sh               # Быстрое обновление
└── nginx/nginx.conf        # Конфигурация Nginx
```

---

**Успешного развертывания! 🚀**
