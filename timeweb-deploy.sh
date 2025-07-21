#!/bin/bash

# Скрипт для деплоя на Timeweb Cloud

echo "🚀 Деплой приложения на Timeweb Cloud"

# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Клонируем репозиторий
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Настраиваем переменные окружения
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env

echo "✅ Настройте переменные окружения в файлах .env"
echo "✅ Затем запустите: docker-compose up -d"