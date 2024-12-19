const express = require('express');
const bot = require('./bot');
const app = require('./api/server');
const db = require('./models');
const config = require('./config/config');

// Синхронизация базы данных
console.log('Starting server...');
console.log('Syncing database...');

db.sequelize.sync()
    .then(() => {
        console.log('Database synced');

        // Запуск API сервера
        app.listen(config.api.port, () => {
            console.log(`API server is running on port ${config.api.port}`);
        });

        // Запуск бота
        bot.startPolling();
        console.log('All systems operational');
    })
    .catch(error => {
        console.error('Error starting server:', error);
        process.exit(1);
    }); 