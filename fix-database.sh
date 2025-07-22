#!/bin/bash

# Скрипт исправления проблем с базой данных
# Использование: ./fix-database.sh

set -e

echo "🔧 Исправление проблем с базой данных Literature Locations..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[FIX] $1${NC}"
}

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.production.yml" ]; then
    error "Файл docker-compose.production.yml не найден. Убедитесь, что вы в корневой директории проекта."
fi

# Загружаем переменные окружения
if [ -f ".env.production" ]; then
    source .env.production
    log "Загружены переменные из .env.production"
else
    error "Файл .env.production не найден. Запустите сначала ./setup-production.sh"
fi

# Проверяем обязательные переменные
if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    error "Не все переменные окружения установлены. Проверьте .env.production"
fi

info "Используемые настройки:"
echo "  База данных: $POSTGRES_DB"
echo "  Пользователь: $POSTGRES_USER"
echo "  Хост: postgres:5432"

# Останавливаем контейнеры
info "Останавливаем контейнеры..."
docker-compose -f docker-compose.production.yml down || true

# Удаляем volume базы данных для полной переинициализации
info "Удаляем старые данные базы данных..."
docker volume rm $(docker-compose -f docker-compose.production.yml config --volumes) 2>/dev/null || true

# Запускаем только PostgreSQL для инициализации
info "Запускаем PostgreSQL для инициализации..."
docker-compose -f docker-compose.production.yml up -d postgres

# Ждем запуска PostgreSQL
info "Ждем запуска PostgreSQL..."
for i in {1..30}; do
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        log "✅ PostgreSQL запущен"
        break
    else
        echo -n "."
        sleep 2
    fi
    
    if [ $i -eq 30 ]; then
        error "PostgreSQL не запустился за 60 секунд"
    fi
done

# Проверяем что база данных создана
info "Проверяем создание базы данных..."
sleep 5

DB_EXISTS=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -w "$POSTGRES_DB" | wc -l)

if [ "$DB_EXISTS" -eq 1 ]; then
    log "✅ База данных $POSTGRES_DB создана"
else
    error "❌ База данных $POSTGRES_DB не создана"
fi

# Проверяем таблицы
info "Проверяем создание таблиц..."
TABLES_CHECK=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null | grep -E "(literature_locations|location_descriptions)" | wc -l || echo "0")

if [ "$TABLES_CHECK" -eq 2 ]; then
    log "✅ Обе таблицы созданы успешно"
else
    warning "⚠️ Найдено таблиц: $TABLES_CHECK из 2"
    
    # Показываем существующие таблицы
    echo "Существующие таблицы:"
    docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null || echo "Не удалось получить список таблиц"
    
    # Показываем логи инициализации
    echo "Логи инициализации PostgreSQL:"
    docker-compose -f docker-compose.production.yml logs postgres --tail=20
fi

# Проверяем структуру таблиц
info "Проверяем структуру таблицы literature_locations..."
docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d literature_locations" 2>/dev/null || warning "Не удалось получить структуру таблицы literature_locations"

info "Проверяем структуру таблицы location_descriptions..."
docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d location_descriptions" 2>/dev/null || warning "Не удалось получить структуру таблицы location_descriptions"

# Запускаем остальные сервисы
info "Запускаем остальные сервисы..."
docker-compose -f docker-compose.production.yml up -d

# Ждем запуска API сервера
info "Ждем запуска API сервера..."
for i in {1..20}; do
    if curl -f -s http://localhost:3001/api/locations > /dev/null 2>&1; then
        log "✅ API сервер запущен и отвечает"
        break
    else
        echo -n "."
        sleep 3
    fi
    
    if [ $i -eq 20 ]; then
        warning "⚠️ API сервер не отвечает, проверьте логи"
    fi
done

# Тестируем API
info "Тестируем API..."
API_RESPONSE=$(curl -s http://localhost:3001/api/locations 2>/dev/null || echo "ERROR")

if [ "$API_RESPONSE" = "ERROR" ]; then
    error "❌ API недоступен"
elif echo "$API_RESPONSE" | grep -q "error"; then
    error "❌ API возвращает ошибку: $API_RESPONSE"
elif echo "$API_RESPONSE" | grep -q "\[\]"; then
    log "✅ API работает (база данных пуста - это нормально для новой установки)"
else
    log "✅ API работает и возвращает данные"
fi

# Показываем финальный статус
info "Финальная проверка..."
echo ""
echo "📊 Статус сервисов:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "📋 Последние логи сервера:"
docker-compose -f docker-compose.production.yml logs server --tail=10

echo ""
log "🎉 Исправление базы данных завершено!"
echo ""
echo "🌐 Ваше приложение доступно:"
echo "  API: http://localhost:3001/api/locations"
echo "  Админка: http://localhost/admin"
echo ""
echo "🔧 Для добавления тестовых данных используйте админку или API"