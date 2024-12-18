const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const taskRoutes = require('./tasks');
// const projectRoutes = require('./projects');
// const templateRoutes = require('./templates');
// const analyticsRoutes = require('./analytics');
// const userRoutes = require('./users');
const authMiddleware = require('../middleware/auth');

// Публичные маршруты
router.use('/auth', authRoutes);

// Защищенные маршруты (требуют авторизации)
router.use('/tasks', authMiddleware, taskRoutes);
// router.use('/projects', authMiddleware, projectRoutes);
// router.use('/templates', authMiddleware, templateRoutes);
// router.use('/analytics', authMiddleware, analyticsRoutes);
// router.use('/users', authMiddleware, userRoutes);

module.exports = router; 