const { User, Task } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

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
            },
            EARLY_BIRD: {
                levels: [5, 15, 30, 50],
                points: [15, 45, 90, 180]
            },
            SUBTASK_MASTER: {
                levels: [10, 30, 60, 100],
                points: [10, 30, 60, 100]
            }
        };
        logger.info('GameService initialized');
    }

    async initUserAchievements(userId) {
        try {
            await User.update(
                {
                    'stats.achievements': Object.keys(this.achievementTypes).reduce((acc, type) => ({
                        ...acc,
                        [type]: {
                            progress: 0,
                            level: 0,
                            points: 0
                        }
                    }), {})
                },
                { where: { telegramId: userId } }
            );
        } catch (error) {
            console.error('Error initializing achievements:', error);
            throw error;
        }
    }

    async updateAchievements(userId) {
        try {
            logger.info(`Updating achievements for user ${userId}`);
            const [user, tasks] = await Promise.all([
                User.findOne({ where: { telegramId: userId } }),
                Task.findAll({ where: { UserId: userId } })
            ]);

            if (!user) throw new Error('User not found');

            const achievements = user.stats.achievements;
            let totalPoints = 0;

            // Обновляем каждый тип достижений
            for (const [type, achievement] of Object.entries(achievements)) {
                let progress = 0;
                const { levels, points } = this.achievementTypes[type];

                switch (type) {
                    case 'TASKS_COMPLETED':
                        progress = tasks.filter(t => t.status === 'DONE').length;
                        break;

                    case 'PRIORITY_MASTER':
                        progress = tasks.filter(t => 
                            t.status === 'DONE' && 
                            ['HIGH', 'URGENT'].includes(t.priority)
                        ).length;
                        break;

                    case 'EARLY_BIRD':
                        progress = tasks.filter(t => 
                            t.status === 'DONE' && 
                            t.deadline && 
                            t.completedAt && 
                            new Date(t.completedAt) < new Date(t.deadline)
                        ).length;
                        break;

                    case 'SUBTASK_MASTER':
                        progress = tasks.reduce((sum, task) => 
                            sum + (task.subtasks?.filter(st => st.completed)?.length || 0), 0
                        );
                        break;
                }

                // Определяем новый уровень
                let newLevel = 0;
                for (let i = 0; i < levels.length; i++) {
                    if (progress >= levels[i]) {
                        newLevel = i + 1;
                    }
                }

                // Если достигнут новый уровень, начисляем очки
                if (newLevel > achievement.level) {
                    const pointsEarned = points[newLevel - 1];
                    totalPoints += pointsEarned;
                    achievements[type] = {
                        progress,
                        level: newLevel,
                        points: achievement.points + pointsEarned
                    };
                }
            }

            // Обновляем пользователя
            await User.update(
                {
                    'stats.achievements': achievements,
                    'stats.points': user.stats.points + totalPoints
                },
                { where: { telegramId: userId } }
            );

            logger.info(`Achievements updated successfully for user ${userId}`);
            return {
                achievements,
                pointsEarned: totalPoints
            };
        } catch (error) {
            logger.error(`Error updating achievements for user ${userId}`, error);
            throw error;
        }
    }

    async getUserLevel(userId) {
        try {
            const user = await User.findOne({
                where: { telegramId: userId }
            });

            if (!user) throw new Error('User not found');

            const points = user.stats.points;
            const level = Math.floor(Math.sqrt(points / 100)) + 1;
            const nextLevel = level + 1;
            const pointsForNextLevel = Math.pow(nextLevel - 1, 2) * 100;
            const progress = Math.round(
                ((points - Math.pow(level - 1, 2) * 100) / 
                (pointsForNextLevel - Math.pow(level - 1, 2) * 100)) * 100
            );

            return {
                level,
                points,
                nextLevel,
                pointsForNextLevel,
                progress
            };
        } catch (error) {
            console.error('Error getting user level:', error);
            throw error;
        }
    }
}

module.exports = new GameService(); 