const { Task, User, Project } = require('../models');
const { Op } = require('sequelize');

class TaskController {
    constructor(reminderService) {
        this.reminderService = reminderService;
    }

    async createTask(userId, data) {
        try {
            const task = await Task.create({
                ...data,
                UserId: userId,
                status: 'TODO'
            });

            if (data.projectId) {
                await task.setProject(data.projectId);
            }

            await User.increment(
                { 'stats.totalTasks': 1 },
                { where: { id: userId } }
            );

            return task;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async getUserTasks(userId, filters = {}) {
        try {
            const where = { UserId: userId };

            if (filters.status) where.status = filters.status;
            if (filters.priority) where.priority = filters.priority;
            if (filters.projectId) where.ProjectId = filters.projectId;

            return await Task.findAll({
                where,
                include: [{ model: Project, attributes: ['id', 'title'] }],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error getting tasks:', error);
            throw error;
        }
    }

    async updateTask(taskId, userId, updates) {
        try {
            const [updated] = await Task.update(updates, {
                where: { id: taskId, UserId: userId },
                returning: true
            });

            if (!updated) throw new Error('Task not found');

            const task = await Task.findOne({
                where: { id: taskId, UserId: userId }
            });

            if (updates.status === 'DONE' && task.status !== 'DONE') {
                await User.increment(
                    { 'stats.tasksCompleted': 1 },
                    { where: { id: userId } }
                );
                task.completedAt = new Date();
                await task.save();
            }

            return task;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    async getKanbanBoard(userId) {
        try {
            const tasks = await Task.findAll({
                where: { UserId: userId },
                include: [{ model: Project, attributes: ['id', 'title'] }],
                order: [['updatedAt', 'DESC']]
            });

            return {
                TODO: tasks.filter(t => t.status === 'TODO'),
                IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
                IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW'),
                DONE: tasks.filter(t => t.status === 'DONE')
            };
        } catch (error) {
            console.error('Error getting kanban board:', error);
            throw error;
        }
    }

    async updateSubtasks(taskId, userId, subtasks) {
        try {
            const [updated] = await Task.update(
                { subtasks },
                { 
                    where: { id: taskId, UserId: userId },
                    returning: true
                }
            );

            if (!updated) throw new Error('Task not found');

            return await Task.findOne({
                where: { id: taskId, UserId: userId }
            });
        } catch (error) {
            console.error('Error updating subtasks:', error);
            throw error;
        }
    }

    async getTasksByDeadline(userId, days = 7) {
        try {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + days);

            return await Task.findAll({
                where: {
                    UserId: userId,
                    deadline: {
                        [Op.lte]: deadline,
                        [Op.gte]: new Date()
                    },
                    status: {
                        [Op.ne]: 'DONE'
                    }
                },
                order: [['deadline', 'ASC']],
                include: [{ model: Project, attributes: ['id', 'title'] }]
            });
        } catch (error) {
            console.error('Error getting tasks by deadline:', error);
            throw error;
        }
    }
}

module.exports = TaskController; 