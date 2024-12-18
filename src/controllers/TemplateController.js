const Template = require('../models/Template');
const TaskController = require('./TaskController');
const schedule = require('node-schedule');

class TemplateController {
    constructor(taskController) {
        this.taskController = taskController;
        this.scheduledJobs = new Map();
    }

    async createTemplate(userId, title, description = '', priority = 'MEDIUM', projectId = null, schedule = null) {
        try {
            const template = new Template({
                userId,
                title,
                description,
                priority,
                project: projectId,
                schedule
            });
            const savedTemplate = await template.save();

            // Если указано расписание, настраиваем автоматическое создание задач
            if (schedule) {
                this.scheduleTaskCreation(savedTemplate);
            }

            return savedTemplate;
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    async getUserTemplates(userId) {
        try {
            return await Template.find({ userId }).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting user templates:', error);
            throw error;
        }
    }

    async createTaskFromTemplate(templateId, userId) {
        try {
            const template = await Template.findOne({ _id: templateId, userId });
            if (!template) return null;

            const task = await this.taskController.createTask(
                userId,
                template.title,
                template.description,
                null, // дедлайн устанавливается отдельно
                template.project,
                template.priority
            );

            // Добавляем подзадачи из шаблона
            if (template.subtasks && template.subtasks.length > 0) {
                for (const subtask of template.subtasks) {
                    await this.taskController.addSubtask(task._id, userId, subtask.title);
                }
            }

            return task;
        } catch (error) {
            console.error('Error creating task from template:', error);
            throw error;
        }
    }

    scheduleTaskCreation(template) {
        // Отменяем существующее расписание если есть
        if (this.scheduledJobs.has(template._id.toString())) {
            this.scheduledJobs.get(template._id.toString()).cancel();
        }

        // Создаем новое расписание
        const job = schedule.scheduleJob(template.schedule, async () => {
            try {
                await this.createTaskFromTemplate(template._id, template.userId);
            } catch (error) {
                console.error('Error in scheduled task creation:', error);
            }
        });

        this.scheduledJobs.set(template._id.toString(), job);
    }

    async deleteTemplate(templateId, userId) {
        try {
            // Отменяем расписание если есть
            if (this.scheduledJobs.has(templateId)) {
                this.scheduledJobs.get(templateId).cancel();
                this.scheduledJobs.delete(templateId);
            }

            return await Template.findOneAndDelete({ _id: templateId, userId });
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }
}

module.exports = TemplateController; 