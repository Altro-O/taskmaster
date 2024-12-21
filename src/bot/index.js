const TelegramBot = require('node-telegram-bot-api');
const { User } = require('../models');
const config = require('../config/config');

class TelegramBotService {
    constructor() {
        this.bot = new TelegramBot(config.telegram.token, {
            polling: {
                interval: 300,
                autoStart: true,
                params: {
                    timeout: 10
                }
            }
        });

        this.setupErrorHandling();
        this.setupCommands();
    }

    setupErrorHandling() {
        this.bot.on('error', (error) => {
            console.error('Bot error:', error.code);
            this.handleError(error);
        });

        if (config.mode === 'polling') {
            this.bot.on('polling_error', (error) => {
                console.error('Polling error:', error.code);
                this.handleError(error);
            });
        }
    }

    handleError(error) {
        if (error.code === 'ETELEGRAM' || error.code === 'ECONNRESET') {
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                if (config.mode === 'polling') {
                    this.bot.stopPolling()
                        .then(() => this.bot.startPolling())
                        .catch(console.error);
                } else {
                    this.setupWebhook()
                        .catch(console.error);
                }
            }, 5000);
        }
    }

    async setupWebhook() {
        if (config.mode === 'webhook') {
            try {
                await this.bot.setWebHook(config.webhook.url, {
                    certificate: config.webhook.certificate
                });
                console.log('Webhook set successfully');
            } catch (error) {
                console.error('Error setting webhook:', error);
                throw error;
            }
        }
    }

    setupCommands() {
        this.bot.onText(/\/start/, this.handleStart.bind(this));
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        try {
            const user = await User.findOne({
                where: { telegramId: chatId.toString() }
            });

            if (!user) {
                await User.create({
                    telegramId: chatId.toString(),
                    username: msg.from.username || msg.from.first_name,
                    settings: {
                        notifications: true,
                        theme: 'light'
                    },
                    stats: {
                        tasksCompleted: 0,
                        totalTasks: 0,
                        points: 0
                    }
                });
            }

            await this.bot.sendMessage(chatId, 'Добро пожаловать в TaskMaster! 🚀');
        } catch (error) {
            console.error('Error in handleStart:', error);
            await this.bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
        }
    }

    async start() {
        if (config.mode === 'webhook') {
            return this.setupWebhook();
        } else {
            return this.bot.startPolling();
        }
    }
}

const botService = new TelegramBotService();
module.exports = botService;