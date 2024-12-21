const TelegramBot = require('node-telegram-bot-api');
const { User, Task, Template, Achievement } = require('../models');
const config = require('../config/config');
const AnalyticsService = require('../services/AnalyticsService');
const ReportService = require('../services/ReportService');
const GameService = require('../services/GameService');

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
        this.waitingForReportTime = {};

        this.setupErrorHandling();
        this.setupCommands();

        console.log('Services initialized:');
        console.log('- Notification Service');
        console.log('- Sync Service');
        console.log('- Game Service');
        console.log('- Analytics Service');
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

        // Шаблоны
        this.bot.onText(/📋 Шаблоны/, async (msg) => {
            const chatId = msg.chat.id;
            const templates = await Template.findAll({
                where: { UserId: msg.from.id.toString() }
            });
            
            const keyboard = templates.map(t => [{
                text: t.title,
                callback_data: `template_${t.id}`
            }]);
            
            await this.bot.sendMessage(chatId, 'Ваши шаблоны:', {
                reply_markup: { inline_keyboard: keyboard }
            });
        });

        // Аналитика в боте
        this.bot.onText(/📊 Аналитика/, async (msg) => {
            const chatId = msg.chat.id;
            const stats = await AnalyticsService.getTasksStats(msg.from.id);
            
            const report = `
📊 *Ваша статистика*
✅ Выполнено: ${stats.completed}
📝 Всего задач: ${stats.total}
⏳ В процессе: ${stats.inProgress}
📅 План: ${stats.todo}

🏆 *Достижения*:
${await this.getAchievements(msg.from.id)}
            `;
            
            await this.bot.sendMessage(chatId, report, {
                parse_mode: 'Markdown'
            });
        });

        this.bot.onText(/📊 Отчет/, async (msg) => {
            const chatId = msg.chat.id;
            const report = await ReportService.generatePDFReport({
                userId: msg.from.id
            });
            await this.bot.sendDocument(chatId, report);
        });

        this.bot.onText(/🏆 Достижения/, async (msg) => {
            const chatId = msg.chat.id;
            const gameStats = await GameService.getUserLevel(msg.from.id);
            const message = `
🎮 Ваш прогресс:
Уровень: ${gameStats.level}
Очки: ${gameStats.points}
Прогресс до следующего уровня: ${gameStats.progress}%

🏆 Достижения:
${await this.formatAchievements(msg.from.id)}
            `;
            await this.bot.sendMessage(chatId, message);
        });

        this.bot.onText(/⚙️ Настройки/, async (msg) => {
            const chatId = msg.chat.id;
            const keyboard = {
                inline_keyboard: [
                    [{ text: '🔔 Уведомления', callback_data: 'settings_notifications' }],
                    [{ text: '🌙 Тема', callback_data: 'settings_theme' }],
                    [{ text: '⏰ Время отчетов', callback_data: 'settings_reports' }]
                ]
            };
            await this.bot.sendMessage(chatId, 'Настройки:', { reply_markup: keyboard });
        });

        this.bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            
            if (query.data.startsWith('settings_')) {
                await this.handleSettings(chatId, query.data);
            }
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

            const keyboard = {
                keyboard: [
                    ['📝 Новая задача', '📋 Мои задачи'],
                    ['📊 Статистика', '🏆 Достижения'],
                    ['⚙️ Настройки', '💝 Поддержать проект']
                ],
                resize_keyboard: true
            };

            await this.bot.sendMessage(chatId, 'Выберите действие:', {
                reply_markup: keyboard
            });
        } catch (error) {
            console.error('Error in handleStart:', error);
            await this.bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
        }
    }

    async start() {
        try {
            if (this.bot.options.polling) {
                return this.bot.startPolling();
            } else if (config.mode === 'webhook') {
                return this.setupWebhook();
            }
        } catch (error) {
            console.error('Error starting bot:', error);
            throw error;
        }
    }

    async formatAchievements(userId) {
        const achievements = await Achievement.findAll({
            where: { UserId: userId, completed: true }
        });
        
        if (achievements.length === 0) {
            return 'У вас пока нет достижений';
        }
        
        return achievements.map(a => 
            `🏅 ${a.title} (${a.points} очков)`
        ).join('\n');
    }

    async handleSettings(chatId, action) {
        const user = await User.findOne({
            where: { telegramId: chatId.toString() }
        });

        switch (action) {
            case 'settings_notifications':
                user.settings.notifications = !user.settings.notifications;
                await user.save();
                await this.bot.sendMessage(chatId, 
                    `Уведомления ${user.settings.notifications ? 'включены' : 'выключены'}`
                );
                break;

            case 'settings_theme':
                user.settings.theme = user.settings.theme === 'light' ? 'dark' : 'light';
                await user.save();
                await this.bot.sendMessage(chatId, 
                    `Тема изменена на ${user.settings.theme === 'light' ? 'светлую' : 'темную'}`
                );
                break;

            case 'settings_reports':
                await this.bot.sendMessage(chatId, 
                    'Выберите время для отчетов (например, 18:00):'
                );
                this.waitingForReportTime[chatId] = true;
                break;
        }
    }
}

const botService = new TelegramBotService();
module.exports = botService;