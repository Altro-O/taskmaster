const express = require('express');
const router = express.Router();
const { Task } = require('../../models');

// Получение задач
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

// Создание задачи
router.post('/', async (req, res) => {
    try {
        const task = await Task.create({
            ...req.body,
            UserId: req.user.id
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Обновление задачи
router.patch('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await task.update(req.body);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Удаление задачи
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await task.destroy();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router; 