const { User } = require('../models');

class GameService {
    static async getUserLevel(userId) {
        const user = await User.findOne({
            where: { telegramId: userId.toString() }
        });

        if (!user) {
            return {
                level: 1,
                points: 0,
                progress: 0
            };
        }

        const points = user.stats?.points || 0;
        const level = Math.floor(Math.sqrt(points / 100)) + 1;
        const nextLevel = Math.pow(level, 2) * 100;
        const progress = Math.round((points / nextLevel) * 100);

        return {
            level,
            points,
            progress
        };
    }

    static async addPoints(userId, points) {
        const user = await User.findOne({
            where: { telegramId: userId.toString() }
        });

        if (user) {
            user.stats = {
                ...user.stats,
                points: (user.stats?.points || 0) + points
            };
            await user.save();
        }
    }
}

module.exports = GameService;