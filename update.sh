#!/bin/bash

# Скрипт быстрого обновления проекта на сервере
# Использование: ./update.sh

set -e

echo "🔄 Обновляем Literature Locations..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Файл docker-compose.production.yml не найден."
    echo "Убедитесь, что вы в директории /opt/literature-locations"
    exit 1
fi

# Останавливаем контейнеры
log "Останавливаем контейнеры..."
docker-compose -f docker-compose.production.yml down

# Получаем последние изменения из Git
log "Получаем изменения из Git..."
git pull origin main

# Создаем .env файлы из примеров если их нет
if [ ! -f ".env.production" ]; then
    warning "Создаем .env.production из примера. ВАЖНО: Отредактируйте файл с реальными данными!"
    cp .env.production.example .env.production
fi

if [ ! -f "server/.env.production" ]; then
    warning "Создаем server/.env.production из примера. ВАЖНО: Отредактируйте файл с реальными данными!"
    cp server/.env.production.example server/.env.production
fi

if [ ! -f "client/.env.production" ]; then
    warning "Создаем client/.env.production из примера. ВАЖНО: Отредактируйте файл с реальными данными!"
    cp client/.env.production.example client/.env.production
fi

# Копируем .env.production в .env для Docker Compose
cp .env.production .env

# Пересобираем и запускаем контейнеры
log "Пересобираем и запускаем контейнеры..."
docker-compose -f docker-compose.production.yml up -d --build

# Ждем запуска
log "Ждем запуска сервисов..."
sleep 15

# Показываем статус
log "Статус контейнеров:"
docker-compose -f docker-compose.production.yml ps

# Показываем последние логи
log "Последние логи сервера:"
docker-compose -f docker-compose.production.yml logs server --tail=10

log "✅ Обновление завершено!"
echo ""
echo "🌐 Проверьте работу сайта: https://lit-locations.ru"
echo "🔧 Админка: https://lit-locations.ru/admin"