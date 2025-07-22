#!/bin/bash

# Скрипт первоначальной настройки продакшена
# Использование: ./setup-production.sh

set -e

echo "🔧 Настройка Literature Locations для продакшена..."

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
    echo -e "${BLUE}[SETUP] $1${NC}"
}

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.production.yml" ]; then
    error "Файл docker-compose.production.yml не найден. Убедитесь, что вы в корневой директории проекта."
fi

info "Этот скрипт поможет настроить продакшен окружение безопасно."
echo ""

# Создаем .env.production
info "Настройка основных переменных окружения..."

echo "Введите название базы данных (по умолчанию: literature_locations_prod):"
read -r DB_NAME
if [ -z "$DB_NAME" ]; then
    DB_NAME="literature_locations_prod"
fi

echo "Введите пользователя базы данных (по умолчанию: lit_user):"
read -r DB_USER
if [ -z "$DB_USER" ]; then
    DB_USER="lit_user"
fi

echo "Введите пароль базы данных:"
read -s DB_PASSWORD
echo

cat > .env.production << EOF
# PostgreSQL настройки для продакшена
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
EOF

echo "Создан .env.production:"
cat .env.production

log "Создан файл .env.production"

# Создаем server/.env.production
info "Настройка серверных переменных..."

echo "Введите JWT секрет (минимум 64 символа, или нажмите Enter для генерации):"
read -s JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 48 2>/dev/null || echo "your_super_secure_jwt_secret_minimum_64_characters_$(date +%s)")
fi
echo

echo "Введите логин администратора (по умолчанию: admin):"
read -r ADMIN_LOGIN
if [ -z "$ADMIN_LOGIN" ]; then
    ADMIN_LOGIN="admin"
fi

echo "Введите пароль администратора:"
read -s ADMIN_PASSWORD
echo

cat > server/.env.production << EOF
# Database connection для продакшена
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@postgres:5432/$DB_NAME

# JWT Secret (сгенерирован случайно)
JWT_SECRET=$JWT_SECRET

# Admin credentials для продакшена
ADMIN_LOGIN=$ADMIN_LOGIN
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Server port
PORT=3001

# Дополнительные настройки для продакшена
NODE_ENV=production
EOF

echo "Создан server/.env.production:"
echo "DATABASE_URL=postgresql://$DB_USER:***@postgres:5432/$DB_NAME"
echo "ADMIN_LOGIN=$ADMIN_LOGIN"
echo "(пароли скрыты для безопасности)"

log "Создан файл server/.env.production"

# Создаем client/.env.production
info "Настройка клиентских переменных..."
echo "Введите ваш MapTiler API ключ:"
read -r MAPTILER_KEY
if [ -z "$MAPTILER_KEY" ]; then
    warning "MapTiler ключ не введен. Используйте значение по умолчанию или получите ключ на https://maptiler.com"
    MAPTILER_KEY="your_maptiler_api_key_here"
fi

echo "Введите ваш домен БЕЗ /api в конце (например: https://lit-locations.ru):"
read -r DOMAIN
if [ -z "$DOMAIN" ]; then
    warning "Домен не введен. Используйте IP адрес сервера."
    echo "Введите IP адрес сервера БЕЗ /api (например: http://188.225.77.5):"
    read -r DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="http://localhost"
    fi
fi

cat > client/.env.production << EOF
# MapTiler API Key для продакшена
VITE_MAPTILER_KEY=$MAPTILER_KEY

# API URL для продакшена
VITE_API_URL=$DOMAIN
EOF

log "Создан файл client/.env.production"

# Копируем для Docker Compose
cp .env.production .env

warning "ВАЖНО: Файлы с реальными паролями созданы локально и НЕ будут добавлены в Git!"
warning "Они находятся в .gitignore и останутся только на этом сервере."

echo ""
info "Настройка завершена! Теперь можно запустить:"
echo "  docker-compose -f docker-compose.production.yml up -d --build"
echo ""
info "Или используйте скрипт автоматического деплоя:"
echo "  ./deploy-production.sh"