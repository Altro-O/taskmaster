const Achievement = require('../models/Achievement');
const Task = require('../models/Task');

class GameService {
    constructor() {
        this.achievementLevels = {
            TASKS_COMPLETED: [5, 20, 50, 100],
            PROJECTS_COMPLETED: [1, 5, 10, 20],
            STREAK_DAYS: [3, 7, 14, 30],
            PRIORITY_MASTER: [5, 15, 30, 50],
            EARLY_BIRD: [5, 15, 30, 50],
            SUBTASK_MASTER: [10, 30, 60, 100]
        };
    }

    async initUserAchievements(userId) {
        try {
            const existingAchievements = await Achievement.find({ userId });
            if (existingAchievements.length === 0) {
                const achievements = Object.keys(this.achievementLevels).map(type => ({
                    userId,
                    type
                }));
                await Achievement.insertMany(achievements);
            }
        } catch (error) {
            console.error('Error initializing achievements:', error);
            throw error;
        }
    }

    async updateAchievements(userId) {
        try {
            const tasks = await Task.find({ userId });
            const achievements = await Achievement.find({ userId });

            // Обновляем прогресс для каждого типа достижений
            for (const achievement of achievements) {
                let progress = 0;
                const levels = this.achievementLevels[achievement.type];

                switch (achievement.type) {
                    case 'TASKS_COMPLETED':
                        progress = tasks.filter(t => t.status === 'DONE').length;
                        break;

                    case 'PRIORITY_MASTER':
                        progress = tasks.filter(t => 
                            t.status === 'DONE' && 
                            (t.priority === 'HIGH' || t.priority === 'URGENT')
                        ).length;
                        break;

                    case 'EARLY_BIRD':
                        progress = tasks.filter(t => 
                            t.status === 'DONE' && 
                            t.deadline && 
                            new Date(t.deadline) > new Date(t.updatedAt)
                        ).length;
                        break;

                    case 'SUBTASK_MASTER':
                        progress = tasks.reduce((sum, task) => 
                            sum + (task.subtasks?.filter(st => st.completed)?.length || 0), 0
                        );
                        break;
                }

                // Определяем уровень достижения
                let newLevel = 1;
                for (let i = 0; i < levels.length; i++) {
                    if (progress >= levels[i]) {
                        newLevel = i + 2;
                    } else {
                        break;
                    }
                }

                // Обновляем достижение
                if (newLevel > achievement.level || progress > achievement.progress) {
                    const wasCompleted = achievement.completed;
                    const isNowCompleted = newLevel > levels.length;

                    await Achievement.findByIdAndUpdate(achievement._id, {
                        level: newLevel,
                        progress,
                        completed: isNowCompleted,
                        completedAt: isNowCompleted && !wasCompleted ? new Date() : achievement.completedAt
                    });
                }
            }

            return await Achievement.find({ userId });
        } catch (error) {
            console.error('Error updating achievements:', error);
            throw error;
        }
    }

    async getUserStats(userId) {
        try {
            const achievements = await Achievement.find({ userId });
            const totalPoints = achievements.reduce((sum, achievement) => 
                sum + (achievement.level - 1) * 100 + 
                (achievement.completed ? 500 : 0), 0
            );

            const completedAchievements = achievements.filter(a => a.completed).length;
            const totalAchievements = achievements.length;

            return {
                points: totalPoints,
                level: Math.floor(totalPoints / 1000) + 1,
                achievements: {
                    completed: completedAchievements,
                    total: totalAchievements,
                    percentage: ((completedAchievements / totalAchievements) * 100).toFixed(1)
                }
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }
}

module.exports = new GameService(); 