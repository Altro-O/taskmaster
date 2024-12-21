const { Template, Task, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');

class TemplateController {
    constructor(taskController) {
        this.taskController = taskController;
        logger.info('TemplateController initialized');
    }

    async createTemplate(userId, data) {
        try {
            return await Template.create({
                ...data,
                UserId: userId
            });
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    async getUserTemplates(userId) {
        try {
            return await Template.findAll({
                where: { UserId: userId }
            });
        } catch (error) {
            console.error('Error getting templates:', error);
            throw error;
        }
    }

    async updateTemplate(templateId, userId, updates) {
        try {
            const [updated] = await Template.update(updates, {
                where: { id: templateId, UserId: userId },
                returning: true
            });

            if (!updated) throw new Error('Template not found');

            return await Template.findOne({
                where: { id: templateId, UserId: userId }
            });
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    }

    async deleteTemplate(templateId, userId) {
        try {
            const result = await Template.destroy({
                where: { id: templateId, UserId: userId }
            });
            return result > 0;
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }

    async createTaskFromTemplate(templateId, userId) {
        try {
            const template = await Template.findOne({
                where: { id: templateId, UserId: userId }
            });

            if (!template) throw new Error('Template not found');

            const taskData = {
                title: template.title,
                description: template.description,
                priority: template.priority,
                subtasks: template.subtasks,
                ProjectId: template.ProjectId
            };

            return await this.taskController.createTask(userId, taskData);
        } catch (error) {
            console.error('Error creating task from template:', error);
            throw error;
        }
    }

    async scheduleTask(templateId, userId, schedule) {
        try {
            const [updated] = await Template.update(
                { schedule },
                {
                    where: { id: templateId, UserId: userId },
                    returning: true
                }
            );

            if (!updated) throw new Error('Template not found');

            return await Template.findOne({
                where: { id: templateId, UserId: userId }
            });
        } catch (error) {
            console.error('Error scheduling template:', error);
            throw error;
        }
    }
}

module.exports = TemplateController; 