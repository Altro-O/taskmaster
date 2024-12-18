const { sequelize } = require('./models');
const config = require('./config/config');
const bot = require('./bot');
const apiServer = require('./api/server');
const logger = require('./utils/logger');
const ErrorHandler = require('./utils/errorHandler');

async function startServer() {
    try {
        logger.info('Starting server...');
        
        await sequelize.sync({ force: true });
        logger.info('Database synced');

        await new Promise((resolve) => {
            apiServer.listen(config.api.port, config.server.host, () => {
                logger.info(`API server is running on port ${config.api.port}`);
                resolve();
            });
        });

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