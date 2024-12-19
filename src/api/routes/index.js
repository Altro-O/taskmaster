const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const TaskController = require('../controllers/TaskController');
const AuthController = require('../controllers/AuthController');

router.post('/auth/telegram', AuthController.telegramAuth);
router.get('/tasks', authMiddleware, TaskController.getUserTasks);
router.post('/tasks', authMiddleware, TaskController.createTask);
// ... другие роуты

module.exports = router; 