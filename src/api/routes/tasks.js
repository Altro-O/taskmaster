const express = require('express');
const router = express.Router();
const TaskController = require('../../controllers/TaskController');

router.get('/', async (req, res) => {
    try {
        const tasks = await TaskController.getUserTasks(req.user.id);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

router.post('/', async (req, res) => {
    try {
        const task = await TaskController.createTask(req.user.id, req.body);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

module.exports = router; 