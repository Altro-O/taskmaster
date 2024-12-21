const { Task, User } = require('../models');
const { Op } = require('sequelize');
const schedule = require('node-schedule');
const AnalyticsService = require('./AnalyticsService');

class NotificationService {
    constructor(bot) {
        this.bot = bot;
        this.startScheduler();
    }

    async startScheduler() {
        // Каждый день в 9:00
        schedule.scheduleJob('0 9 * * *', async () => {
            const tasks = await Task.findAll({
                where: {
                    deadline: {
                        [Op.between]: [
                            new Date(),
                            new Date(Date.now() + 24 * 60 * 60 * 1000)
                        ]
                    },
                    status: {
                        [Op.ne]: 'DONE'
                    }
                },
                include: [User]
            });

            for (const task of tasks) {
                await this.sendDeadlineReminder(task.User.telegramId, task);
            }
        });

        // Еженедельный отчет по воскресеньям
        schedule.scheduleJob('0 18 * * 0', async () => {
            const users = await User.findAll();
            for (const user of users) {
                await this.sendWeeklyReport(user.telegramId);
            }
        });
    }

    async sendDeadlineReminder(userId, task) {
        try {
            const message = `
⚠️ Напоминание о задаче!

📝 ${task.title}
⏰ Дедлайн: ${new Date(task.deadline).toLocaleString()}
`;
            await this.bot.sendMessage(userId, message);
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }
    
    async sendAchievementNotification(userId, achievement) {
        try {
            const message = `
🏆 Поздравляем с достижением!

${achievement.title}
${achievement.description}

+${achievement.points} очков
`;
            await this.bot.sendMessage(userId, message);
        } catch (error) {
            console.error('Error sending achievement notification:', error);
        }
    }
    
    async sendWeeklyReport(userId) {
        try {
            const stats = await AnalyticsService.getTasksStats(userId);
            const message = `
📊 Ваш еженедельный отчет:

✅ Выполнено задач: ${stats.completed}
📝 Всего задач: ${stats.total}
⭐️ Продуктивность: ${Math.round((stats.completed / stats.total) * 100)}%

Так держать! 💪
`;
            await this.bot.sendMessage(userId, message);
        } catch (error) {
            console.error('Error sending weekly report:', error);
        }
    }

    async updateNotificationTime(userId, time) {
        try {
            const user = await User.findOne({ where: { telegramId: userId } });
            user.settings.notificationTime = time;
            await user.save();

            // Обновляем расписание для этого пользователя
            this.scheduleUserNotifications(user);

            await this.bot.sendMessage(userId, 
                `Время уведомлений установлено на ${time}`
            );
        } catch (error) {
            console.error('Error updating notification time:', error);
        }
    }

    async scheduleUserNotifications(user) {
        const time = user.settings.notificationTime || '09:00';
        const [hours, minutes] = time.split(':');

        schedule.scheduleJob(`${minutes} ${hours} * * *`, async () => {
            if (user.settings.notifications) {
                await this.sendDailyReport(user.telegramId);
            }
        });
    }

    async sendDailyReport(userId) {
        try {
            const today = new Date();
            const tasks = await Task.findAll({
                where: {
                    UserId: userId,
                    deadline: {
                        [Op.between]: [
                            today,
                            new Date(today.setHours(23, 59, 59))
                        ]
                    }
                }
            });

            const message = `
📅 Ваши задачи на сегодня:

${tasks.map(t => `${t.status === 'DONE' ? '✅' : '⏳'} ${t.title}`).join('\n')}

Всего задач: ${tasks.length}
Выполнено: ${tasks.filter(t => t.status === 'DONE').length}
`;
            await this.bot.sendMessage(userId, message);
        } catch (error) {
            console.error('Error sending daily report:', error);
        }
    }
} 