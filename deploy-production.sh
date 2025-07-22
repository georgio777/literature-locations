#!/bin/bash

# Автоматический деплой Literature Locations на продакшен
# Использование: ./deploy-production.sh

set -e

echo "🚀 Начинаем деплой Literature Locations на продакшен..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.production.yml" ]; then
    error "Файл docker-compose.production.yml не найден. Убедитесь, что вы в корневой директории проекта."
fi

# Создаем .env файлы из примеров если их нет
log "Проверяем файлы окружения..."

if [ ! -f ".env.production" ]; then
    warning "Создаем .env.production из примера..."
    cp .env.production.example .env.production
fi

if [ ! -f "server/.env.production" ]; then
    warning "Создаем server/.env.production из примера..."
    cp server/.env.production.example server/.env.production
fi

if [ ! -f "client/.env.production" ]; then
    warning "Создаем client/.env.production из примера..."
    cp client/.env.production.example client/.env.production
fi

# Переименовываем .env.production в .env для Docker Compose
log "Настраиваем переменные окружения для Docker Compose..."
cp .env.production .env

# Проверяем что Docker установлен
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите Docker и повторите попытку."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose не установлен. Установите Docker Compose и повторите попытку."
fi

# Останавливаем старые контейнеры
log "Останавливаем старые контейнеры..."
docker-compose -f docker-compose.production.yml down || true

# Очищаем старые образы
log "Очищаем старые образы..."
docker system prune -f || true

# Собираем и запускаем новые контейнеры
log "Собираем и запускаем контейнеры..."
docker-compose -f docker-compose.production.yml up -d --build

# Ждем запуска сервисов
log "Ждем запуска сервисов..."
sleep 30

# Проверяем статус контейнеров
log "Проверяем статус контейнеров..."
docker-compose -f docker-compose.production.yml ps

# Проверяем что PostgreSQL запустился
log "Проверяем PostgreSQL..."
for i in {1..10}; do
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready > /dev/null 2>&1; then
        log "✅ PostgreSQL готов к работе"
        break
    else
        warning "Ждем запуска PostgreSQL... ($i/10)"
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        error "PostgreSQL не запустился за 50 секунд"
    fi
done

# Проверяем что база данных инициализирована
log "Проверяем инициализацию базы данных..."
sleep 5

# Проверяем существование таблиц
TABLES_CHECK=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${POSTGRES_USER:-lit_user} -d ${POSTGRES_DB:-literature_locations_prod} -c "\dt" 2>/dev/null | grep -E "(literature_locations|location_descriptions)" | wc -l || echo "0")

if [ "$TABLES_CHECK" -eq 2 ]; then
    log "✅ База данных инициализирована корректно"
else
    warning "⚠️ Проблема с инициализацией базы данных. Найдено таблиц: $TABLES_CHECK из 2"
    log "Логи PostgreSQL:"
    docker-compose -f docker-compose.production.yml logs postgres --tail=10
fi

# Проверяем что сервисы отвечают
log "Проверяем работу сервисов..."

# Проверяем API
for i in {1..5}; do
    if curl -f -s http://localhost:3001/api/locations > /dev/null 2>&1; then
        log "✅ API сервер работает"
        break
    else
        warning "Ждем запуска API сервера... ($i/5)"
        sleep 10
    fi
    
    if [ $i -eq 5 ]; then
        warning "⚠️ API сервер не отвечает, проверьте логи"
    fi
done

# Показываем логи последних 20 строк
log "Последние логи сервера:"
docker-compose -f docker-compose.production.yml logs server --tail=20

log "✅ Деплой завершен!"
echo ""
echo "🌐 Ваше приложение доступно:"
echo "  HTTP: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo "  HTTPS: https://lit-locations.ru (если SSL настроен)"
echo "  Админка: https://lit-locations.ru/admin"
echo ""
echo "📋 Полезные команды:"
echo "  Просмотр логов: docker-compose -f docker-compose.production.yml logs -f"
echo "  Перезапуск: docker-compose -f docker-compose.production.yml restart"
echo "  Остановка: docker-compose -f docker-compose.production.yml down"
echo ""
echo "🔧 Для обновления кода:"
echo "  1. git pull"
echo "  2. ./deploy-production.sh"