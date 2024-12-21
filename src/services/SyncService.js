const { User } = require('../models');

class SyncService {
    constructor(bot) {
        this.bot = bot;
    }

    async syncTaskUpdate(task) {
        try {
            const user = await User.findByPk(task.UserId);
            if (user && user.telegramId) {
                const message = `
✏️ Обновление задачи:
📝 ${task.title}
📊 Статус: ${task.status}
${task.deadline ? `⏰ Дедлайн: ${new Date(task.deadline).toLocaleString()}` : ''}
`;
                await this.bot.sendMessage(user.telegramId, message);
            }
        } catch (error) {
            console.error('Error syncing task update:', error);
        }
    }

    async syncAchievement(userId, achievement) {
        const user = await User.findByPk(userId);
        if (user && user.telegramId) {
            await this.bot.sendMessage(user.telegramId,
                `🏆 Новое достижение!\n${achievement.title}`
            );
        }
    }
}

module.exports = SyncService; 