const { User } = require('../models');

class GameService {
    async getUserLevel(userId) {
        try {
            const user = await User.findOne({
                where: { telegramId: userId }
            });

            const points = user.stats.points || 0;
            const level = Math.floor(Math.sqrt(points / 100)) + 1;

            return {
                level,
                points,
                nextLevel: level + 1,
                progress: Math.round((points / (level * 100)) * 100)
            };
        } catch (error) {
            console.error('Error getting level:', error);
            throw error;
        }
    }
}

module.exports = new GameService();