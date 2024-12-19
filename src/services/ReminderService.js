const { Task, User } = require('../models');
const { Op } = require('sequelize');

class ReminderService {
    constructor(bot) {
        this.bot = bot;
        this.checkDeadlines();
    }

    async checkDeadlines() {
        try {
            setInterval(async () => {
                const tasks = await Task.findAll({
                    where: {
                        deadline: {
                            [Op.lte]: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            [Op.gte]: new Date()
                        },
                        status: {
                            [Op.ne]: 'DONE'
                        }
                    },
                    include: [{ model: User }]
                });

                for (const task of tasks) {
                    await this.sendReminder(task);
                }
            }, 60 * 60 * 1000); // каждый час
        } catch (error) {
            console.error('Error checking deadlines:', error);
        }
    }

    async sendReminder(task) {
        try {
            const message = 
                `⚠️ Напоминание: "${task.title}"\n` +
                `Дедлайн: ${new Date(task.deadline).toLocaleString()}`;
            await this.bot.sendMessage(task.User.telegramId, message);
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }
}

module.exports = ReminderService;