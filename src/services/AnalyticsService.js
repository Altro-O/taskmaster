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

    async generateReport(userId, type = 'weekly') {
        const tasks = await Task.findAll({
            where: { UserId: userId },
            include: [{ model: Project }]
        });

        const stats = {
            completed: tasks.filter(t => t.status === 'DONE').length,
            total: tasks.length,
            byPriority: {
                HIGH: tasks.filter(t => t.priority === 'HIGH').length,
                MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
                LOW: tasks.filter(t => t.priority === 'LOW').length
            },
            byProject: {},
            timeline: this.generateTimeline(tasks)
        };

        return stats;
    }

    async exportToExcel(stats) {
        // Экспорт в Excel
    }

    async exportToPDF(stats) {
        // Экспорт в PDF
    }

    async generateProductivityChart(userId) {
        // Создание графика продуктивности
    }

    async generateTaskDistributionChart(userId) {
        // Создание диаграммы распределения задач
    }
}

module.exports = AnalyticsService;