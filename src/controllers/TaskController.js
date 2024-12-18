const Task = require('../models/Task');

class TaskController {
    constructor(reminderService) {
        this.reminderService = reminderService;
    }

    async createTask(userId, title, description = '', deadline = null, projectId = null) {
        try {
            const task = new Task({
                userId,
                title,
                description,
                deadline,
                project: projectId
            });
            const savedTask = await task.save();

            // Если установлен дедлайн, создаем напоминание за день до дедлайна
            if (deadline) {
                const reminderDate = new Date(deadline);
                reminderDate.setDate(reminderDate.getDate() - 1);
                
                if (reminderDate > new Date()) {
                    this.reminderService.scheduleReminder(
                        savedTask._id,
                        userId,
                        `Завтра дедлайн задачи "${title}"!`,
                        reminderDate
                    );
                }
            }

            return savedTask;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async getUserTasks(userId) {
        try {
            return await Task.find({ userId }).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting user tasks:', error);
            throw error;
        }
    }

    async updateTaskStatus(taskId, status) {
        try {
            return await Task.findByIdAndUpdate(
                taskId,
                { status },
                { new: true }
            );
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    }

    async getTasksByProject(userId, projectId) {
        try {
            return await Task.find({ userId, project: projectId }).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting project tasks:', error);
            throw error;
        }
    }

    async updateDeadline(taskId, userId, deadline) {
        try {
            const task = await Task.findOneAndUpdate(
                { _id: taskId, userId },
                { deadline },
                { new: true }
            );

            if (task && deadline) {
                const reminderDate = new Date(deadline);
                reminderDate.setDate(reminderDate.getDate() - 1);
                
                if (reminderDate > new Date()) {
                    this.reminderService.scheduleReminder(
                        task._id,
                        userId,
                        `Завтра дедлайн задачи "${task.title}"!`,
                        reminderDate
                    );
                }
            }

            return task;
        } catch (error) {
            console.error('Error updating task deadline:', error);
            throw error;
        }
    }

    async updatePriority(taskId, userId, priority) {
        try {
            return await Task.findOneAndUpdate(
                { _id: taskId, userId },
                { priority },
                { new: true }
            );
        } catch (error) {
            console.error('Error updating task priority:', error);
            throw error;
        }
    }

    async addSubtask(taskId, userId, subtaskTitle) {
        try {
            return await Task.findOneAndUpdate(
                { _id: taskId, userId },
                { $push: { subtasks: { title: subtaskTitle } } },
                { new: true }
            );
        } catch (error) {
            console.error('Error adding subtask:', error);
            throw error;
        }
    }

    async toggleSubtask(taskId, userId, subtaskId) {
        try {
            const task = await Task.findOne({ _id: taskId, userId });
            if (!task) return null;

            const subtask = task.subtasks.id(subtaskId);
            if (!subtask) return null;

            subtask.completed = !subtask.completed;
            return await task.save();
        } catch (error) {
            console.error('Error toggling subtask:', error);
            throw error;
        }
    }

    async deleteSubtask(taskId, userId, subtaskId) {
        try {
            return await Task.findOneAndUpdate(
                { _id: taskId, userId },
                { $pull: { subtasks: { _id: subtaskId } } },
                { new: true }
            );
        } catch (error) {
            console.error('Error deleting subtask:', error);
            throw error;
        }
    }

    async moveTask(taskId, userId, newStatus) {
        try {
            const task = await Task.findOneAndUpdate(
                { _id: taskId, userId },
                { 
                    status: newStatus,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (task && task.deadline && newStatus === 'DONE') {
                // Отменяем напоминание если задача завершена
                this.reminderService.cancelReminder(taskId);
            }

            return task;
        } catch (error) {
            console.error('Error moving task:', error);
            throw error;
        }
    }

    async getKanbanBoard(userId) {
        try {
            const tasks = await Task.find({ userId }).sort({ column: 1 });
            
            // Группируем задачи по статусам
            const board = {
                BACKLOG: tasks.filter(t => t.status === 'BACKLOG'),
                TODO: tasks.filter(t => t.status === 'TODO'),
                IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
                IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW'),
                DONE: tasks.filter(t => t.status === 'DONE')
            };

            return board;
        } catch (error) {
            console.error('Error getting kanban board:', error);
            throw error;
        }
    }

    async reorderTasks(userId, status, taskIds) {
        try {
            // Обновляем позиции задач в колонке
            for (let i = 0; i < taskIds.length; i++) {
                await Task.findOneAndUpdate(
                    { _id: taskIds[i], userId },
                    { column: i }
                );
            }
            return true;
        } catch (error) {
            console.error('Error reordering tasks:', error);
            throw error;
        }
    }
}

module.exports = TaskController; 