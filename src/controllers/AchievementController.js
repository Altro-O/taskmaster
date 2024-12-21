class AchievementController {
    async checkAchievements(userId) {
        const user = await User.findByPk(userId, {
            include: [Task, Achievement]
        });

        // Проверяем достижения
        if (user.Tasks.filter(t => t.status === 'DONE').length >= 10) {
            await this.unlockAchievement(userId, 'TASKS_COMPLETED', 1);
        }

        if (user.Tasks.filter(t => t.priority === 'HIGH' && t.status === 'DONE').length >= 5) {
            await this.unlockAchievement(userId, 'PRIORITY_MASTER', 1);
        }
    }

    async unlockAchievement(userId, achievement) {
        try {
            // Сохраняем достижение
            const newAchievement = await Achievement.create({
                userId,
                type: achievement.type
            });

            // Отправляем уведомление через бота
            await global.services.sync.syncAchievement(userId, achievement);

            // Начисляем очки
            await this.addPoints(userId, achievement.points);

            return newAchievement;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            throw error;
        }
    }
} 