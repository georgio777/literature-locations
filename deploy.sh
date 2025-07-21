#!/bin/bash

# Production Deployment Script для Literature Locations App
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем деплой в продакшен..."

# Проверяем наличие продакшен .env файлов
if [ ! -f ".env.production" ]; then
    echo "❌ ОШИБКА: Файл .env.production не найден!"
    echo "Скопируйте .env.production.example в .env.production и заполните реальными данными"
    exit 1
fi

if [ ! -f "server/.env.production" ]; then
    echo "❌ ОШИБКА: Файл server/.env.production не найден!"
    echo "Скопируйте server/.env.production.example в server/.env.production и заполните реальными данными"
    exit 1
fi

if [ ! -f "client/.env.production" ]; then
    echo "❌ ОШИБКА: Файл client/.env.production не найден!"
    echo "Скопируйте client/.env.production.example в client/.env.production и заполните реальными данными"
    exit 1
fi

echo "✅ Все .env файлы найдены"

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose -f docker-compose.production.yml down

# Собираем новые образы
echo "🔨 Собираем продакшен образы..."
docker-compose -f docker-compose.production.yml build --no-cache

# Запускаем в продакшене
echo "🚀 Запускаем в продакшене..."
docker-compose -f docker-compose.production.yml up -d

# Проверяем статус
echo "📊 Проверяем статус сервисов..."
docker-compose -f docker-compose.production.yml ps

echo "✅ Деплой завершен!"
echo "🌐 Приложение доступно на http://localhost"
echo "📝 Логи можно посмотреть командой: docker-compose -f docker-compose.production.yml logs -f"