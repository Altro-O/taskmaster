require('dotenv').config();
const path = require('path');

module.exports = {
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: path.join(__dirname, '../../logs')
    },
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        botUsername: 'taskmaster_altro_bot'
    },
    database: {
        storage: './database.sqlite'
    },
    app: {
        name: 'TaskMaster',
        version: '1.0.0',
        domain: 'mytasks.store',
        environment: process.env.NODE_ENV || 'development'
    },
    server: {
        host: '0.0.0.0',
        ip: '0.0.0.0'
    },
    api: {
        port: process.env.PORT || 3000,
        baseUrl: 'https://mytasks.store',
        corsOrigins: ['https://mytasks.store']
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '7d'
    },
    ssl: {
        enabled: process.env.NODE_ENV === 'production',
        cert: process.env.SSL_CERT_PATH,
        key: process.env.SSL_KEY_PATH
    }
}; 