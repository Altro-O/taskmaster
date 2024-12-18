require('dotenv').config();

module.exports = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        webhookUrl: process.env.NODE_ENV === 'production' 
            ? `https://${process.env.DOMAIN}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`
            : null
    },
    mongodb: {
        uri: process.env.MONGODB_URI
    },
    app: {
        name: 'TaskMaster',
        version: '1.0.0',
        domain: 'mytasks.store',
        environment: process.env.NODE_ENV || 'development'
    },
    server: {
        host: process.env.SERVER_HOST || '150.241.83.127',
        ip: process.env.SERVER_IP || '150.241.83.127'
    },
    api: {
        port: process.env.API_PORT || 3000,
        baseUrl: process.env.NODE_ENV === 'production' 
            ? 'https://api.mytasks.store'
            : 'http://localhost:3000',
        corsOrigins: [
            'https://mytasks.store',
            'https://www.mytasks.store',
            'http://localhost:3000'
        ]
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d'
    },
    ssl: {
        enabled: process.env.NODE_ENV === 'production',
        cert: process.env.SSL_CERT_PATH,
        key: process.env.SSL_KEY_PATH
    }
}; 