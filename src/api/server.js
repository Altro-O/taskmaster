const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const config = require('../config/config');

const app = express();

// Настройка CORS
app.use(cors({
    origin: config.api.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Настройка лимитов запросов
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100 // максимум 100 запросов с одного IP
});

// Middleware
app.use(express.json());
app.use(limiter);

// Маршруты API
app.use('/api/v1', routes);

// Обработка ошибок
app.use(errorHandler);

// Создаем HTTP или HTTPS сервер в зависимости от окружения
let server;
if (config.ssl.enabled && config.app.environment === 'production') {
    const httpsOptions = {
        cert: fs.readFileSync(config.ssl.cert),
        key: fs.readFileSync(config.ssl.key)
    };
    server = https.createServer(httpsOptions, app);
} else {
    server = app;
}

module.exports = server; 