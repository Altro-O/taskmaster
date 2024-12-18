#!/bin/bash

# Остановка текущего приложения
pm2 stop taskmaster

# Обновление кода
git pull origin main

# Установка зависимостей
npm install --production

# Создание/обновление SSL сертификатов
certbot renew

# Запуск приложения
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации PM2
pm2 save 