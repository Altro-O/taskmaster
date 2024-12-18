#!/bin/bash

# Обновление системы
echo "Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Установка необходимых пакетов
echo "Installing required packages..."
sudo apt-get install -y git nginx certbot python3-certbot-nginx

# Установка Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Настройка директорий
echo "Setting up directories..."
sudo mkdir -p /var/www/mytasks.store
sudo chown -R $USER:$USER /var/www/mytasks.store

# Настройка Nginx
echo "Configuring Nginx..."
sudo cp nginx/mytasks.store /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/mytasks.store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Получение SSL сертификатов
echo "Getting SSL certificates..."
sudo certbot --nginx -d mytasks.store -d www.mytasks.store

echo "Server setup completed!" 