const express = require('express');
const router = express.Router();
const { Task, User } = require('../../models');

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

// Обновление статуса задачи
router.patch('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({
            where: { 
                id: req.params.id,
                UserId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await task.update({ status: req.body.status });

        // Если задача выполнена, начисляем очки
        if (req.body.status === 'DONE') {
            const user = await User.findByPk(req.user.id);
            if (user) {
                user.stats = {
                    ...user.stats,
                    tasksCompleted: (user.stats?.tasksCompleted || 0) + 1,
                    points: (user.stats?.points || 0) + 10
                };
                await user.save();
            }
        }

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: error.message });
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