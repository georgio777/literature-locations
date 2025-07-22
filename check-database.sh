#!/bin/bash

# Скрипт проверки состояния базы данных
# Использование: ./check-database.sh

set -e

echo "🔍 Проверка состояния базы данных..."

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
}

info() {
    echo -e "${BLUE}[CHECK] $1${NC}"
}

# Проверяем что контейнеры запущены
info "Проверяем статус контейнеров..."
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    error "Контейнеры не запущены. Запустите их командой: docker-compose -f docker-compose.production.yml up -d"
fi

# Проверяем подключение к базе данных
info "Проверяем подключение к PostgreSQL..."
if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-lit_user} > /dev/null 2>&1; then
    log "✅ PostgreSQL доступен"
else
    error "❌ PostgreSQL недоступен"
fi

# Проверяем существование базы данных
info "Проверяем существование базы данных..."
DB_EXISTS=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${POSTGRES_USER:-lit_user} -lqt | cut -d \| -f 1 | grep -w ${POSTGRES_DB:-literature_locations_prod} | wc -l)

if [ "$DB_EXISTS" -eq 1 ]; then
    log "✅ База данных ${POSTGRES_DB:-literature_locations_prod} существует"
else
    error "❌ База данных ${POSTGRES_DB:-literature_locations_prod} не найдена"
fi

# Проверяем таблицы
info "Проверяем структуру таблиц..."
TABLES_CHECK=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${POSTGRES_USER:-lit_user} -d ${POSTGRES_DB:-literature_locations_prod} -c "\dt" 2>/dev/null | grep -E "(literature_locations|location_descriptions)" | wc -l)

if [ "$TABLES_CHECK" -eq 2 ]; then
    log "✅ Обе таблицы существуют"
else
    warning "⚠️ Не все таблицы найдены. Найдено таблиц: $TABLES_CHECK из 2"
    
    # Показываем какие таблицы есть
    echo "Существующие таблицы:"
    docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${POSTGRES_USER:-lit_user} -d ${POSTGRES_DB:-literature_locations_prod} -c "\dt" 2>/dev/null || echo "Не удалось получить список таблиц"
fi

# Проверяем количество записей
info "Проверяем данные в таблицах..."
LOCATIONS_COUNT=$(docker-compose -f docker-compose.production.yml exec -T postgres psql -U ${POSTGRES_USER:-lit_user} -d ${POSTGRES_DB:-literature_locations_prod} -c "SELECT COUNT(*) FROM literature_locations;" 2>/dev/null | grep -E "^\s*[0-9]+\s*$" | tr -d ' ' || echo "0")

if [ "$LOCATIONS_COUNT" -gt 0 ]; then
    log "✅ В таблице literature_locations найдено $LOCATIONS_COUNT записей"
else
    warning "⚠️ Таблица literature_locations пуста или недоступна"
fi

# Проверяем API сервер
info "Проверяем API сервер..."
if curl -f -s http://localhost:3001/api/locations > /dev/null 2>&1; then
    log "✅ API сервер отвечает"
    
    # Проверяем ответ API
    API_RESPONSE=$(curl -s http://localhost:3001/api/locations)
    if echo "$API_RESPONSE" | grep -q "\[\]"; then
        warning "⚠️ API возвращает пустой массив - нет данных в базе"
    elif echo "$API_RESPONSE" | grep -q "error"; then
        error "❌ API возвращает ошибку: $API_RESPONSE"
    else
        log "✅ API возвращает данные"
    fi
else
    error "❌ API сервер не отвечает"
fi

# Показываем логи сервера для диагностики
info "Последние логи сервера:"
docker-compose -f docker-compose.production.yml logs server --tail=10

echo ""
log "Проверка завершена!"