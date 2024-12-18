#!/bin/bash

# Остановка и удаление всех PM2 процессов
pm2 delete all
pm2 save

# Удаление старых файлов
rm -rf /var/www/mytasks.store/*
rm -rf /etc/nginx/sites-enabled/mytasks.store
rm -rf /etc/nginx/sites-available/mytasks.store

# Очистка кэша npm
npm cache clean --force

# Удаление node_modules
rm -rf node_modules
rm package-lock.json

# Обновление системы
sudo apt-get update
sudo apt-get upgrade -y

# Установка необходимых пакетов
sudo apt-get install -y git nginx certbot python3-certbot-nginx

# Создание директорий
sudo mkdir -p /var/www/mytasks.store
sudo chown -R $USER:$USER /var/www/mytasks.store

# Настройка Nginx
sudo cp nginx/mytasks.store /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/mytasks.store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Получение SSL сертификатов
sudo certbot --nginx -d mytasks.store -d www.mytasks.store

# Установка Node.js зависимостей
npm install

# За��уск приложения через PM2
pm2 start ecosystem.config.js --env production
pm2 save

echo "Setup completed! Check the application at https://mytasks.store" 