const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authRoutes = require('./auth');
const taskRoutes = require('./tasks');
const projectRoutes = require('./projects');
const templatesRoutes = require('./templates');
const achievementsRoutes = require('./achievements');
const analyticsRoutes = require('./analytics');
const settingsRoutes = require('./settings');

// Роуты авторизации (без middleware)
router.use('/auth', authRoutes);

// Защищенные роуты (с middleware)
router.use('/tasks', authMiddleware, taskRoutes);
router.use('/projects', authMiddleware, projectRoutes);
router.use('/templates', authMiddleware, templatesRoutes);
router.use('/achievements', authMiddleware, achievementsRoutes);
router.use('/analytics', authMiddleware, analyticsRoutes);
router.use('/settings', authMiddleware, settingsRoutes);

module.exports = router; 