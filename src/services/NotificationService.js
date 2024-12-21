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
        // Проверка дедлайнов каждый час
        schedule.scheduleJob('0 * * * *', async () => {
            const now = new Date();
            const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            const tasks = await Task.findAll({
                where: {
                    deadline: {
                        [Op.between]: [now, dayFromNow]
                    },
                    status: {
                        [Op.ne]: 'DONE'
                    }
                },
                include: [User]
            });

            for (const task of tasks) {
                if (task.User?.telegramId) {
                    const timeLeft = Math.round((new Date(task.deadline) - now) / (1000 * 60 * 60));
                    await this.sendDeadlineReminder(task.User.telegramId, task, timeLeft);
                }
            }
        });

        // Проверка просроченных задач
        schedule.scheduleJob('0 9 * * *', async () => {
            const tasks = await Task.findAll({
                where: {
                    deadline: {
                        [Op.lt]: new Date()
                    },
                    status: {
                        [Op.ne]: 'DONE'
                    }
                },
                include: [User]
            });

            for (const task of tasks) {
                if (task.User?.telegramId) {
                    await this.sendOverdueNotification(task.User.telegramId, task);
                }
            }
        });
    }

    async sendDeadlineReminder(userId, task, hoursLeft) {
        const message = `
⚠️ Напоминание о задаче!

📝 ${task.title}
⏰ До дедлайна осталось: ${hoursLeft} часов
Дедлайн: ${new Date(task.deadline).toLocaleString()}
`;
        await this.bot.sendMessage(userId, message);
    }

    async sendOverdueNotification(userId, task) {
        const message = `
🚨 Просроченная задача!

📝 ${task.title}
⏰ Дедлайн был: ${new Date(task.deadline).toLocaleString()}

Пожалуйста, обновите статус задачи или измените дедлайн.
`;
        await this.bot.sendMessage(userId, message);
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

            // О��новляем расписание для этого пользователя
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

module.exports = NotificationService; 
module.exports = NotificationService; 