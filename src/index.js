const mongoose = require('mongoose');
const config = require('./config/config');
const bot = require('./bot');
const apiServer = require('./api/server');

async function startServer() {
    try {
        // Подключение к MongoDB
        await mongoose.connect(config.mongodb.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Запуск API сервера
        await new Promise((resolve) => {
            apiServer.listen(config.api.port, () => {
                console.log(`API server is running on port ${config.api.port}`);
                resolve();
            });
        });

        // Настройка вебхука для бота в продакшене
        if (config.app.environment === 'production' && config.telegram.webhookUrl) {
            await bot.setWebHook(config.telegram.webhookUrl);
            console.log('Telegram webhook set');
        }

        console.log('All systems operational');
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

// Обработка завершения работы
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}); 