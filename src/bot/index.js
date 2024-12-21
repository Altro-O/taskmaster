const TelegramBot = require('node-telegram-bot-api');
const { User, Task } = require('../models');
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

        this.waitingForTaskTitle = {};
        this.waitingForDeadline = {};
        this.waitingForPriority = {};

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
        
        // Новая задача
        this.bot.onText(/📝 Новая задача/, async (msg) => {
            const chatId = msg.chat.id;
            await this.bot.sendMessage(chatId, 'Введите название задачи:');
            // Ждем ответ пользователя
            this.waitingForTaskTitle[chatId] = true;
        });

        // Мои задачи
        this.bot.onText(/📋 Мои задачи/, async (msg) => {
            const chatId = msg.chat.id;
            const user = await User.findOne({
                where: { telegramId: chatId.toString() }
            });
            
            if (user) {
                const tasks = await Task.findAll({
                    where: { UserId: user.id }
                });
                
                if (tasks.length > 0) {
                    const taskList = tasks.map(task => 
                        `${task.status === 'DONE' ? '✅' : '⏳'} ${task.title}`
                    ).join('\n');
                    await this.bot.sendMessage(chatId, `Ваши задачи:\n\n${taskList}`);
                } else {
                    await this.bot.sendMessage(chatId, 'У вас пока нет задач');
                }
            }
        });

        // Статистика
        this.bot.onText(/📊 Статистика/, async (msg) => {
            const chatId = msg.chat.id;
            const user = await User.findOne({
                where: { telegramId: chatId.toString() }
            });
            
            if (user) {
                const stats = `
📊 Ваша статистика:

✅ Выполнено задач: ${user.stats.tasksCompleted}
📝 Всего задач: ${user.stats.totalTasks}
⭐️ Очки: ${user.stats.points}
                `;
                await this.bot.sendMessage(chatId, stats);
            }
        });

        // Обработка текстовых сообщений
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            
            if (this.waitingForTaskTitle[chatId]) {
                // Создаем новую задачу
                const user = await User.findOne({
                    where: { telegramId: chatId.toString() }
                });
                
                if (user) {
                    await Task.create({
                        title: msg.text,
                        UserId: user.id,
                        status: 'TODO'
                    });
                    
                    await this.bot.sendMessage(chatId, 'Задача создана! ✅');
                }
                
                delete this.waitingForTaskTitle[chatId];
            }
        });

        this.bot.onText(/💝 Поддержать проект/, async (msg) => {
            const chatId = msg.chat.id;
            const donateText = `
💝 *Поддержать TaskMaster*

Если вам нравится бот и он помогает вам быть продуктивнее, вы можете поддержать развитие проекта.

Ваша поддержка поможет нам:
• Добавлять новые функции
• Улучшать существующие возможности
• Поддерживать сервер и инфраструктуру

💳 Поддержать через Tinkoff:
[Открыть страницу оплаты](https://www.tinkoff.ru/rm/r_NCNolaNuEd.LikyLscelb/DsIeH14488)

Спасибо за вашу поддержку! ❤️
            `;
            
            await this.bot.sendMessage(chatId, donateText, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        });
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
        try {
            // Проверяем, нет ли уже запущенного бота
            await this.bot.deleteWebhook();
            
            if (config.mode === 'webhook') {
                return this.setupWebhook();
            } else {
                return this.bot.startPolling();
            }
        } catch (error) {
            console.error('Error starting bot:', error);
            throw error;
        }
    }
}

const botService = new TelegramBotService();
module.exports = botService;