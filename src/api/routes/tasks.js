const express = require('express');
const router = express.Router();
const TaskController = require('../../controllers/TaskController');
const ReminderService = require('../../services/ReminderService');

const reminderService = new ReminderService();
const taskController = new TaskController(reminderService);

// Получить все задачи пользователя
router.get('/', async (req, res) => {
    try {
        const tasks = await taskController.getUserTasks(req.userId);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении задач' });
    }
});

// Создать новую задачу
router.post('/', async (req, res) => {
    try {
        const { title, description, deadline, projectId, priority } = req.body;
        const task = await taskController.createTask(
            req.userId,
            title,
            description,
            deadline ? new Date(deadline) : null,
            projectId,
            priority
        );
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании задачи' });
    }
});

// Обновить задачу
router.put('/:taskId', async (req, res) => {
    try {
        const { title, description, status, deadline, priority } = req.body;
        const task = await taskController.updateTask(
            req.params.taskId,
            req.userId,
            {
                title,
                description,
                status,
                deadline: deadline ? new Date(deadline) : undefined,
                priority
            }
        );
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении задачи' });
    }
});

// Удалить задачу
router.delete('/:taskId', async (req, res) => {
    try {
        await taskController.deleteTask(req.params.taskId, req.userId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении задачи' });
    }
});

// Получить Kanban-доску
router.get('/kanban', async (req, res) => {
    try {
        const board = await taskController.getKanbanBoard(req.userId);
        res.json(board);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении Kanban-доски' });
    }
});

// Переместить задачу в Kanban
router.post('/:taskId/move', async (req, res) => {
    try {
        const { newStatus } = req.body;
        const task = await taskController.moveTask(
            req.params.taskId,
            req.userId,
            newStatus
        );
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при перемещении задачи' });
    }
});

// Добавить подзадачу
router.post('/:taskId/subtasks', async (req, res) => {
    try {
        const { title } = req.body;
        const task = await taskController.addSubtask(
            req.params.taskId,
            req.userId,
            title
        );
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении подзадачи' });
    }
});

// Переключить статус подзадачи
router.put('/:taskId/subtasks/:subtaskId', async (req, res) => {
    try {
        const task = await taskController.toggleSubtask(
            req.params.taskId,
            req.params.subtaskId,
            req.userId
        );
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении подзадачи' });
    }
});

module.exports = router; 