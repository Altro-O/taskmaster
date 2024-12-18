const { User, Task } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class LeaderboardService {
    async getGlobalLeaderboard(limit = 10) {
        try {
            const users = await User.findAll({
                attributes: [
                    'id',
                    'telegramId',
                    'stats',
                    [fn('COUNT', col('Tasks.id')), 'totalTasks'],
                    [
                        fn('COUNT', 
                            literal('CASE WHEN Tasks.status = \'DONE\' THEN 1 END')
                        ), 
                        'tasksCompleted'
                    ]
                ],
                include: [{
                    model: Task,
                    attributes: []
                }],
                group: ['User.id'],
                order: [
                    [col('stats.points'), 'DESC']
                ],
                limit
            });

            return users.map(user => ({
                _id: user.telegramId,
                totalPoints: user.stats.points,
                completedAchievements: Object.values(user.stats.achievements)
                    .filter(a => a.level > 0).length,
                tasksCompleted: parseInt(user.get('tasksCompleted')),
                totalTasks: parseInt(user.get('totalTasks')),
                completionRate: Math.round(
                    (parseInt(user.get('tasksCompleted')) / 
                    parseInt(user.get('totalTasks'))) * 100 || 0
                )
            }));
        } catch (error) {
            console.error('Error getting global leaderboard:', error);
            throw error;
        }
    }

    async getWeeklyLeaderboard(limit = 10) {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const users = await User.findAll({
                attributes: [
                    'id',
                    'telegramId',
                    'stats',
                    [
                        fn('COUNT', 
                            literal(`CASE WHEN Tasks.status = 'DONE' AND Tasks.updatedAt >= :weekAgo THEN 1 END`)
                        ),
                        'completedTasks'
                    ]
                ],
                include: [{
                    model: Task,
                    attributes: [],
                    where: {
                        updatedAt: {
                            [Op.gte]: weekAgo
                        }
                    },
                    required: false
                }],
                group: ['User.id'],
                order: [
                    [literal('completedTasks'), 'DESC']
                ],
                limit,
                replacements: { weekAgo }
            });

            return users.map(user => ({
                _id: user.telegramId,
                completedTasks: parseInt(user.get('completedTasks')) || 0,
                totalPoints: user.stats.points
            }));
        } catch (error) {
            console.error('Error getting weekly leaderboard:', error);
            throw error;
        }
    }

    async getUserRank(userId) {
        try {
            const allUsers = await User.findAll({
                attributes: [
                    'id',
                    'telegramId',
                    'stats',
                    [fn('COUNT', col('Tasks.id')), 'totalTasks'],
                    [
                        fn('COUNT', 
                            literal('CASE WHEN Tasks.status = \'DONE\' THEN 1 END')
                        ),
                        'tasksCompleted'
                    ]
                ],
                include: [{
                    model: Task,
                    attributes: []
                }],
                group: ['User.id'],
                order: [[col('stats.points'), 'DESC']]
            });

            const userIndex = allUsers.findIndex(u => u.telegramId === userId);
            if (userIndex === -1) return null;

            const totalUsers = allUsers.length;
            const rank = userIndex + 1;
            const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100);

            return {
                rank,
                totalUsers,
                percentile
            };
        } catch (error) {
            console.error('Error getting user rank:', error);
            throw error;
        }
    }
}

module.exports = LeaderboardService; 