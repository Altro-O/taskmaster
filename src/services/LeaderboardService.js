const { User } = require('../models');

class LeaderboardService {
    async getGlobalLeaderboard() {
        try {
            return await User.findAll({
                order: [['stats.points', 'DESC']],
                limit: 10
            });
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async getWeeklyLeaderboard() {
        try {
            return await User.findAll({
                order: [['stats.tasksCompleted', 'DESC']],
                limit: 10
            });
        } catch (error) {
            console.error('Error getting weekly leaderboard:', error);
            throw error;
        }
    }
}

module.exports = new LeaderboardService();