const { sequelize } = require('./models');
const config = require('./config/config');
const bot = require('./bot');
const apiServer = require('./api/server');
const logger = require('./utils/logger');
const ErrorHandler = require('./utils/errorHandler');

async function startServer() {
    try {
        logger.info('Starting server...');
        
        // Синхронизация базы данных
        logger.info('Syncing database...');
        await sequelize.sync({ alter: true });
        logger.info('Database synced successfully');

        // Запуск API сервера
        await new Promise((resolve) => {
            apiServer.listen(config.api.port, () => {
                logger.info(`API server is running on port ${config.api.port}`);
                resolve();
            });
        });

        // Настройка вебхука для бота в продакшене
        if (config.app.environment === 'production' && config.telegram.webhookUrl) {
            logger.info('Setting up Telegram webhook...');
            await bot.setWebHook(config.telegram.webhookUrl);
            logger.info('Telegram webhook set successfully');
        }

        logger.info('All systems operational');
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

startServer();

// Обработка завершения работы
process.on('SIGINT', async () => {
    try {
        logger.info('Shutting down server...');
        await sequelize.close();
        logger.info('Database connection closed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
    }
}); 