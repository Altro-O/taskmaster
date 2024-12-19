const { User } = require('../models');

class GameService {
    constructor() {
        this.achievementTypes = {
            TASKS_COMPLETED: {
                levels: [5, 20, 50, 100],
                points: [10, 50, 100, 200]
            },
            PRIORITY_MASTER: {
                levels: [5, 15, 30, 50],
                points: [20, 60, 120, 200]
            }
        };
    }

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

module.exports = GameService;