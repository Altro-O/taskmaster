const Task = require('../models/Task');

class AnalyticsService {
    async getTasksStats(userId, startDate = null, endDate = null) {
        try {
            const query = { userId };
            if (startDate && endDate) {
                query.createdAt = { $gte: startDate, $lte: endDate };
            }

            const tasks = await Task.find(query);
            
            return {
                total: tasks.length,
                byStatus: {
                    TODO: tasks.filter(t => t.status === 'TODO').length,
                    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                    DONE: tasks.filter(t => t.status === 'DONE').length
                },
                byPriority: {
                    LOW: tasks.filter(t => t.priority === 'LOW').length,
                    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
                    HIGH: tasks.filter(t => t.priority === 'HIGH').length,
                    URGENT: tasks.filter(t => t.priority === 'URGENT').length
                },
                completionRate: tasks.length > 0 
                    ? (tasks.filter(t => t.status === 'DONE').length / tasks.length * 100).toFixed(1)
                    : 0,
                overdue: tasks.filter(t => 
                    t.deadline && 
                    t.status !== 'DONE' && 
                    new Date(t.deadline) < new Date()
                ).length
            };
        } catch (error) {
            console.error('Error getting tasks stats:', error);
            throw error;
        }
    }

    async getProjectStats(userId) {
        try {
            const tasks = await Task.find({ userId }).populate('project');
            const projectStats = {};

            tasks.forEach(task => {
                if (task.project) {
                    const projectId = task.project._id.toString();
                    if (!projectStats[projectId]) {
                        projectStats[projectId] = {
                            name: task.project.title,
                            total: 0,
                            completed: 0,
                            inProgress: 0,
                            todo: 0
                        };
                    }

                    projectStats[projectId].total++;
                    switch (task.status) {
                        case 'DONE':
                            projectStats[projectId].completed++;
                            break;
                        case 'IN_PROGRESS':
                            projectStats[projectId].inProgress++;
                            break;
                        case 'TODO':
                            projectStats[projectId].todo++;
                            break;
                    }
                }
            });

            return Object.values(projectStats);
        } catch (error) {
            console.error('Error getting project stats:', error);
            throw error;
        }
    }

    async getProductivityReport(userId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const tasks = await Task.find({
                userId,
                createdAt: { $gte: startDate }
            }).sort({ createdAt: 1 });

            const dailyStats = {};
            const daysArray = [];

            // Создаем массив дат
            for (let i = 0; i <= days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                dailyStats[dateStr] = {
                    created: 0,
                    completed: 0
                };
                daysArray.push(dateStr);
            }

            // Заполняем статистику
            tasks.forEach(task => {
                const createdDate = task.createdAt.toISOString().split('T')[0];
                if (dailyStats[createdDate]) {
                    dailyStats[createdDate].created++;
                }

                if (task.status === 'DONE') {
                    const completedDate = task.updatedAt.toISOString().split('T')[0];
                    if (dailyStats[completedDate]) {
                        dailyStats[completedDate].completed++;
                    }
                }
            });

            return daysArray.map(date => ({
                date,
                ...dailyStats[date]
            }));
        } catch (error) {
            console.error('Error getting productivity report:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService(); 