const { Task, User } = require('../models');
const { Op } = require('sequelize');

class ReminderService {
    constructor(bot) {
        this.bot = bot;
        this.checkDeadlines();
    }

    async checkDeadlines() {
        try {
            // Проверяем каждый час
            setInterval(async () => {
                const tasks = await Task.findAll({
                    where: {
                        deadline: {
                            [Op.lte]: new Date(Date.now() + 24 * 60 * 60 * 1000), // следующие 24 часа
                            [Op.gte]: new Date()
                        },
                        status: {
                            [Op.ne]: 'DONE'
                        }
                    },
                    include: [{ 
                        model: User,
                        where: {
                            'settings.notifications': true
                        }
                    }]
                });

                for (const task of tasks) {
                    const timeLeft = task.deadline - new Date();
                    if (timeLeft <= 60 * 60 * 1000) { // меньше часа
                        await this.sendReminder(task, 'через час');
                    } else if (timeLeft <= 24 * 60 * 60 * 1000) { // меньше суток
                        await this.sendReminder(task, 'завтра');
                    }
                }
            }, 60 * 60 * 1000); // каждый час
        } catch (error) {
            console.error('Error checking deadlines:', error);
        }
    }

    async sendReminder(task, timeFrame) {
        try {
            const message = 
                `⚠️ Напоминание о задаче\n\n` +
                `Задача "${task.title}" должна быть выполнена ${timeFrame}\n` +
                `Приоритет: ${task.priority}\n` +
                `Статус: ${task.status}`;

            await this.bot.sendMessage(task.User.telegramId, message);
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }
}

module.exports = ReminderService; 