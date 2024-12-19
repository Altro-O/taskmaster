const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const TaskController = require('../../controllers/TaskController');
const AuthController = require('../controllers/AuthController');
const authRoutes = require('./auth');
const taskRoutes = require('./tasks');
const projectRoutes = require('./projects');

router.post('/auth/telegram', AuthController.telegramAuth);
router.get('/tasks', authMiddleware, TaskController.getUserTasks);
router.post('/tasks', authMiddleware, TaskController.createTask);
router.use('/auth', authRoutes);
router.use('/tasks', authMiddleware, taskRoutes);
router.use('/projects', authMiddleware, projectRoutes);
// ... другие роуты

module.exports = router; 