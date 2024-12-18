const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('../utils/logger');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Добавим статические файлы
app.use(express.static('public'));

// Изменим корневой маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    logger.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app; 