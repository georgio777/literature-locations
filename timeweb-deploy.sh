#!/bin/bash

# Скрипт автоматического деплоя на Timeweb Cloud
# Использование: ./timeweb-deploy.sh

set -e

echo "🚀 Начинаем деплой на Timeweb Cloud..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
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

# Проверяем, что мы в правильной директории
if [ ! -f "docker-compose.production.yml" ]; then
    error "Файл docker-compose.production.yml не найден. Убедитесь, что вы в корневой директории проекта."
fi

# Обновляем систему
log "Обновляем систему..."
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker, если не установлен
if ! command -v docker &> /dev/null; then
    log "Устанавливаем Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    log "Docker уже установлен"
fi

# Устанавливаем Docker Compose, если не установлен
if ! command -v docker-compose &> /dev/null; then
    log "Устанавливаем Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    log "Docker Compose уже установлен"
fi

# Устанавливаем Git, если не установлен
if ! command -v git &> /dev/null; then
    log "Устанавливаем Git..."
    sudo apt install -y git
fi

# Устанавливаем Nginx для проксирования (опционально)
if ! command -v nginx &> /dev/null; then
    log "Устанавливаем Nginx..."
    sudo apt install -y nginx
fi

# Создаем директорию для приложения
APP_DIR="/opt/literature-locations"
log "Создаем директорию приложения: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Копируем файлы проекта
log "Копируем файлы проекта..."
cp -r . $APP_DIR/
cd $APP_DIR

# Проверяем наличие файлов окружения
if [ ! -f ".env.production" ]; then
    warning "Файл .env.production не найден. Создаем из примера..."
    cp .env.production.example .env.production
fi

if [ ! -f "server/.env.production" ]; then
    warning "Файл server/.env.production не найден. Создаем из примера..."
    cp server/.env.production.example server/.env.production
fi

if [ ! -f "client/.env.production" ]; then
    warning "Файл client/.env.production не найден. Создаем из примера..."
    cp client/.env.production.example client/.env.production
fi

# Останавливаем старые контейнеры, если они есть
log "Останавливаем старые контейнеры..."
docker-compose -f docker-compose.production.yml down || true

# Удаляем старые образы
log "Очищаем старые образы..."
docker system prune -f

# Собираем и запускаем новые контейнеры
log "Собираем и запускаем контейнеры..."
docker-compose -f docker-compose.production.yml up -d --build

# Ждем запуска сервисов
log "Ждем запуска сервисов..."
sleep 30

# Проверяем статус контейнеров
log "Проверяем статус контейнеров..."
docker-compose -f docker-compose.production.yml ps

# Проверяем логи
log "Проверяем логи сервера..."
docker-compose -f docker-compose.production.yml logs server --tail=20

# Настраиваем автозапуск
log "Настраиваем автозапуск..."
sudo tee /etc/systemd/system/literature-locations.service > /dev/null <<EOF
[Unit]
Description=Literature Locations App
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable literature-locations.service

# Настраиваем firewall
log "Настраиваем firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable

log "✅ Деплой завершен!"
echo ""
echo "🌐 Ваше приложение доступно по адресу: http://$(curl -s ifconfig.me)"
echo "🔧 Админка: http://$(curl -s ifconfig.me)/admin"
echo ""
echo "📋 Полезные команды:"
echo "  Просмотр логов: docker-compose -f docker-compose.production.yml logs -f"
echo "  Перезапуск: docker-compose -f docker-compose.production.yml restart"
echo "  Остановка: docker-compose -f docker-compose.production.yml down"
echo ""
echo "⚠️  Не забудьте:"
echo "  1. Настроить переменные окружения в файлах .env.production"
echo "  2. Получить SSL сертификат для HTTPS"
echo "  3. Настроить домен"