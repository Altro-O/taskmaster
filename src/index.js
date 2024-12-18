const { sequelize } = require('./models');
const config = require('./config/config');
const bot = require('./bot');
const apiServer = require('./api/server');
const logger = require('./utils/logger');
const ErrorHandler = require('./utils/errorHandler');

async function startServer() {
    try {
        console.log('Starting server...');
        logger.info('Starting server...');
        
        // Синхронизация базы данных
        console.log('Syncing database...');
        logger.info('Syncing database...');
        await sequelize.sync({ force: true });
        console.log('Database synced');
        logger.info('Database synced');

        // Запуск API сервера
        await new Promise((resolve) => {
            apiServer.listen(config.api.port, () => {
                console.log(`API server is running on port ${config.api.port}`);
                logger.info(`API server is running on port ${config.api.port}`);
                resolve();
            });
        });

        console.log('All systems operational');
        logger.info('All systems operational');
    } catch (error) {
        console.error('Failed to start server:', error);
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