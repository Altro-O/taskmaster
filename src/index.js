const express = require('express');
const { sequelize } = require('./models');
const config = require('./config/config');
const bot = require('./bot');
const apiRoutes = require('./api/routes');
const logger = require('./utils/logger');
const ErrorHandler = require('./utils/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API routes
app.use('/api', apiRoutes);

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

async function startServer() {
    try {
        await sequelize.sync({ alter: true });
        logger.info('Database synced');

        app.listen(config.api.port, config.server.host, () => {
            logger.info(`Server running on port ${config.api.port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
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