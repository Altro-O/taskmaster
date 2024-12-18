const Achievement = require('../models/Achievement');
const Task = require('../models/Task');

class LeaderboardService {
    async getGlobalLeaderboard(limit = 10) {
        try {
            // Получаем статистику всех пользователей
            const users = await Achievement.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        totalPoints: {
                            $sum: {
                                $add: [
                                    { $multiply: [{ $subtract: ['$level', 1] }, 100] },
                                    { $cond: [{ $eq: ['$completed', true] }, 500, 0] }
                                ]
                            }
                        },
                        completedAchievements: {
                            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
                        }
                    }
                },
                {
                    $sort: { totalPoints: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            // Добавляем статистику по задачам
            for (let user of users) {
                const tasks = await Task.find({ userId: user._id });
                user.tasksCompleted = tasks.filter(t => t.status === 'DONE').length;
                user.totalTasks = tasks.length;
                user.completionRate = tasks.length > 0 
                    ? ((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100).toFixed(1)
                    : 0;
            }

            return users;
        } catch (error) {
            console.error('Error getting global leaderboard:', error);
            throw error;
        }
    }

    async getWeeklyLeaderboard(limit = 10) {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            // Получаем статистику по выполненным задачам за неделю
            const users = await Task.aggregate([
                {
                    $match: {
                        updatedAt: { $gte: weekAgo },
                        status: 'DONE'
                    }
                },
                {
                    $group: {
                        _id: '$userId',
                        completedTasks: { $sum: 1 },
                        totalPoints: {
                            $sum: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$priority', 'URGENT'] }, then: 100 },
                                        { case: { $eq: ['$priority', 'HIGH'] }, then: 75 },
                                        { case: { $eq: ['$priority', 'MEDIUM'] }, then: 50 },
                                        { case: { $eq: ['$priority', 'LOW'] }, then: 25 }
                                    ],
                                    default: 0
                                }
                            }
                        }
                    }
                },
                {
                    $sort: { totalPoints: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            return users;
        } catch (error) {
            console.error('Error getting weekly leaderboard:', error);
            throw error;
        }
    }

    async getUserRank(userId) {
        try {
            const allUsers = await this.getGlobalLeaderboard(1000); // Получаем большой список
            const userIndex = allUsers.findIndex(u => u._id === userId);
            
            if (userIndex === -1) return null;

            return {
                rank: userIndex + 1,
                totalUsers: allUsers.length,
                percentile: ((allUsers.length - userIndex) / allUsers.length * 100).toFixed(1)
            };
        } catch (error) {
            console.error('Error getting user rank:', error);
            throw error;
        }
    }
}

module.exports = new LeaderboardService(); 