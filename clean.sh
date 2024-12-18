#!/bin/bash

echo "Stopping all services..."
sudo systemctl stop nginx
pm2 delete all

echo "Removing old files..."
sudo rm -rf /var/www/mytasks.store/*
sudo rm -rf /etc/nginx/sites-enabled/mytasks.store
sudo rm -rf /etc/nginx/sites-available/mytasks.store

echo "Cleaning npm cache..."
npm cache clean --force

echo "Server cleaned successfully!" 