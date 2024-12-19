const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const config = require('../config/config');
const path = require('path');

const app = express();

// CORS
app.use(cors({
    origin: config.api.corsOrigins,
    credentials: true
}));

// Body parser
app.use(express.json());

// Статические файлы
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', routes);

// SPA fallback - важно для работы роутинга на клиенте
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app; 