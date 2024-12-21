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
            },
            webHook: {
                port: config.telegram.webhookPort
            }
        });

        this.setupErrorHandling();
        this.setupCommands();
    }

    setupErrorHandling() {
        this.bot.on('polling_error', (error) => {
            console.error('Telegram polling error:', error.code);
            
            // Автоматический реконнект при ошибках
            if (error.code === 'ETELEGRAM' || error.code === 'ECONNRESET') {
                setTimeout(() => {
                    console.log('Attempting to reconnect to Telegram...');
                    this.bot.stopPolling()
                        .then(() => this.bot.startPolling())
                        .catch(console.error);
                }, 5000);
            }
        });
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
}

module.exports = new TelegramBotService();