const express = require('express');
const botService = require('./bot');
const app = require('./api/server');
const db = require('./models');
const config = require('./config/config');

console.log('Starting server...');
console.log('Syncing database...');

db.sequelize.sync()
    .then(async () => {
        console.log('Database synced');

        // Запуск API сервера
        app.listen(config.api.port, () => {
            console.log(`API server is running on port ${config.api.port}`);
        });

        // Запуск бота
        try {
            await botService.start();
            console.log('Bot started successfully');
        } catch (error) {
            console.error('Error starting bot:', error);
        }

        console.log('All systems operational');
    })
    .catch(error => {
        console.error('Error starting server:', error);
        process.exit(1);
    }); 