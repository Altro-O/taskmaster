const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authRoutes = require('./auth');
const taskRoutes = require('./tasks');
const projectRoutes = require('./projects');

// Роуты авторизации (без middleware)
router.use('/auth', authRoutes);

// Защищенные роуты (с middleware)
router.use('/tasks', authMiddleware, taskRoutes);
router.use('/projects', authMiddleware, projectRoutes);

module.exports = router; 