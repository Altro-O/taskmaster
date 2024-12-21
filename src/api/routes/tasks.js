const express = require('express');
const router = express.Router();
const TaskController = require('../../controllers/TaskController');

router.get('/', async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { UserId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(tasks);
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: error.message });
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