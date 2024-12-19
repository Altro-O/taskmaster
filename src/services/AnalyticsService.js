const { Task, Project } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
    async getTasksStats(userId) {
        try {
            const tasks = await Task.findAll({
                where: { UserId: userId }
            });

            return {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'DONE').length,
                inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                todo: tasks.filter(t => t.status === 'TODO').length
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsService;