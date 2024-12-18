const Task = require('../models/Task');
const Project = require('../models/Project');

class AnalyticsService {
    async getTasksStats(userId) {
        try {
            const tasks = await Task.find({ userId });
            
            const stats = {
                total: tasks.length,
                byStatus: {
                    TODO: 0,
                    IN_PROGRESS: 0,
                    IN_REVIEW: 0,
                    DONE: 0
                },
                byPriority: {
                    LOW: 0,
                    MEDIUM: 0,
                    HIGH: 0,
                    URGENT: 0
                },
                completionRate: 0,
                overdue: 0
            };

            tasks.forEach(task => {
                // Подсчет по статусам
                stats.byStatus[task.status]++;
                
                // Подсчет по приоритетам
                stats.byPriority[task.priority]++;
                
                // Подсчет просроченных
                if (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE') {
                    stats.overdue++;
                }
            });

            // Расчет процента выполнения
            stats.completionRate = tasks.length > 0 
                ? Math.round((stats.byStatus.DONE / tasks.length) * 100) 
                : 0;

            return stats;
        } catch (error) {
            console.error('Error getting tasks stats:', error);
            throw error;
        }
    }

    async getProjectStats(userId) {
        try {
            const projects = await Project.find({ userId });
            const stats = [];

            for (const project of projects) {
                const tasks = await Task.find({ project: project._id });
                stats.push({
                    name: project.title,
                    total: tasks.length,
                    completed: tasks.filter(t => t.status === 'DONE').length,
                    inProgress: tasks.filter(t => ['IN_PROGRESS', 'IN_REVIEW'].includes(t.status)).length,
                    todo: tasks.filter(t => t.status === 'TODO').length
                });
            }

            return stats;
        } catch (error) {
            console.error('Error getting project stats:', error);
            throw error;
        }
    }

    async getProductivityReport(userId) {
        try {
            const days = 7;
            const report = [];
            
            for (let i = 0; i < days; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const [created, completed] = await Promise.all([
                    Task.countDocuments({
                        userId,
                        createdAt: { $gte: date, $lt: nextDate }
                    }),
                    Task.countDocuments({
                        userId,
                        status: 'DONE',
                        updatedAt: { $gte: date, $lt: nextDate }
                    })
                ]);

                report.push({
                    date: date.toLocaleDateString(),
                    created,
                    completed
                });
            }

            return report;
        } catch (error) {
            console.error('Error getting productivity report:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService(); 