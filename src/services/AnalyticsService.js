const { Task, Project, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class AnalyticsService {
    async getTasksStats(userId) {
        try {
            const tasks = await Task.findAll({
                where: { UserId: userId }
            });

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
                stats.byStatus[task.status]++;
                stats.byPriority[task.priority]++;
                
                if (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE') {
                    stats.overdue++;
                }
            });

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
            const projects = await Project.findAll({
                where: { UserId: userId },
                include: [{ model: Task }]
            });

            return projects.map(project => ({
                name: project.title,
                total: project.Tasks.length,
                completed: project.Tasks.filter(t => t.status === 'DONE').length,
                inProgress: project.Tasks.filter(t => ['IN_PROGRESS', 'IN_REVIEW'].includes(t.status)).length,
                todo: project.Tasks.filter(t => t.status === 'TODO').length
            }));
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
                    Task.count({
                        where: {
                            UserId: userId,
                            createdAt: {
                                [Op.gte]: date,
                                [Op.lt]: nextDate
                            }
                        }
                    }),
                    Task.count({
                        where: {
                            UserId: userId,
                            status: 'DONE',
                            updatedAt: {
                                [Op.gte]: date,
                                [Op.lt]: nextDate
                            }
                        }
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