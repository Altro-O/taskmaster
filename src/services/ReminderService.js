const schedule = require('node-schedule');

class ReminderService {
    constructor(bot) {
        this.bot = bot;
        this.jobs = new Map();
    }

    scheduleReminder(taskId, userId, message, date) {
        // Отменяем существующее напоминание если есть
        if (this.jobs.has(taskId)) {
            this.jobs.get(taskId).cancel();
        }

        // Планируем новое напоминание
        const job = schedule.scheduleJob(date, async () => {
            try {
                await this.bot.sendMessage(userId, `⏰ Напоминание: ${message}`);
                this.jobs.delete(taskId);
            } catch (error) {
                console.error('Error sending reminder:', error);
            }
        });

        this.jobs.set(taskId, job);
    }

    cancelReminder(taskId) {
        if (this.jobs.has(taskId)) {
            this.jobs.get(taskId).cancel();
            this.jobs.delete(taskId);
        }
    }
}

module.exports = ReminderService; 