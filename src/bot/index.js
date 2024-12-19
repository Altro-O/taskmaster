const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const { User, Task, Project, Template } = require('../models');
const TaskController = require('../controllers/TaskController');
const ProjectController = require('../controllers/ProjectController');
const ReminderService = require('../services/ReminderService');
const TemplateController = require('../controllers/TemplateController');
const AnalyticsService = require('../services/AnalyticsService');
const GameService = require('../services/GameService');
const LeaderboardService = require('../services/LeaderboardService');
const path = require('path');
const fs = require('fs');
const ProjectService = require('../services/ProjectService');
const ReportService = require('../services/ReportService');

// Изменяем настройки бота
const bot = new TelegramBot(config.telegram.token, { 
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    },
    filepath: false,
    webhookReply: false
});

// Инициализация сервисов
const reminderService = new ReminderService(bot);
const taskController = new TaskController(reminderService);
const gameService = new GameService();
const leaderboardService = new LeaderboardService();
const analyticsService = new AnalyticsService();
const templateController = new TemplateController(taskController);
const reportService = new ReportService();

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
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
                    points: 0,
                    achievements: {}
                }
            });
        }

        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['📝 Новая задача', '📋 Мои задачи'],
                    ['📊 Статистика', '⚙️ Настройки']
                ],
                resize_keyboard: true
            }
        };

        await bot.sendMessage(
            chatId,
            'Добро пожаловать в TaskMaster! 👋\n\n' +
            'Я помогу вам управлять задачами и быть продуктивнее. ' +
            'Используйте меню ниже или отправьте /help для списка команд.',
            keyboard
        );
    } catch (error) {
        console.error('Error in /start command:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при запуске бота');
    }
});

// Обработка ошибок поллинга
bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM') {
        // Игнорируем частые ошибки поллинга
        return;
    }
    console.error('Bot polling error:', error.code, error.message);
});

// Хранени состояния пользователя
const userStates = {};

// Создаем временную директорию для отчетов
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Константы для клавиатур
const PRIORITY_KEYBOARD = {
    reply_markup: {
        keyboard: [
            ['🟢 LOW', '🟡 MEDIUM'],
            ['🟠 HIGH', '🔴 URGENT']
        ],
        one_time_keyboard: true
    }
};

const PRIORITY_MAP = {
    '🟢 LOW': 'LOW',
    '🟡 MEDIUM': 'MEDIUM',
    '🟠 HIGH': 'HIGH',
    '🔴 URGENT': 'URGENT'
};

// Константы для статусов
const STATUS_MAP = {
    'TODO': 'К выполнению',
    'IN_PROGRESS': 'В процессе',
    'DONE': 'Выполнено'
};

// Команда создания новой задачи
bot.onText(/\/new_task/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_TASK_TITLE' };
    await bot.sendMessage(chatId, '📝 Введите название задачи:');
});

// Просмотр задач
bot.onText(/\/my_tasks/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasks = await Task.findAll({
            where: { UserId: chatId.toString() },
            order: [['createdAt', 'DESC']]
        });

        if (tasks.length === 0) {
            await bot.sendMessage(chatId, '📭 У вас пока нет задач');
            return;
        }

        const tasksMessage = tasks.map(task => 
            `📌 ${task.title}\n` +
            `📊 Статус: ${task.status}\n` +
            `⭐️ Приоритет: ${task.priority}\n` +
            `${task.deadline ? `⏰ Дедлайн: ${new Date(task.deadline).toLocaleDateString()}\n` : ''}` +
            `-------------------`
        ).join('\n');

        await bot.sendMessage(chatId, tasksMessage);
    } catch (error) {
        console.error('Error getting tasks:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении задач');
    }
});

// Kanban доска
bot.onText(/\/kanban/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasks = await Task.findAll({
            where: { UserId: chatId.toString() },
            order: [['updatedAt', 'DESC']]
        });

        const board = {
            'TODO': tasks.filter(t => t.status === 'TODO'),
            'IN_PROGRESS': tasks.filter(t => t.status === 'IN_PROGRESS'),
            'DONE': tasks.filter(t => t.status === 'DONE')
        };

        let message = '📋 Мои задачи:\n\n';
        
        for (const [status, statusTasks] of Object.entries(board)) {
            message += `📊 ${STATUS_MAP[status]}:\n`;
            if (statusTasks.length === 0) {
                message += '📭 Нет задач\n';
            } else {
                statusTasks.forEach(task => {
                    message += `📌 ${task.title} (${task.priority})\n`;
                });
            }
            message += '\n';
        }

        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error showing tasks:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при отображении задач');
    }
});

// Статистика
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const stats = await analyticsService.getTasksStats(chatId.toString());
        
        const message = 
            '📊 Статистика по задачам:\n\n' +
            `📈 Всего задач: ${stats.total}\n` +
            `✅ Выполнено: ${stats.byStatus.DONE}\n` +
            `🔄 В работе: ${stats.byStatus.IN_PROGRESS}\n` +
            `👀 На проверке: ${stats.byStatus.IN_REVIEW}\n` +
            `📝 Ожидают: ${stats.byStatus.TODO}\n\n` +
            `📊 Процент выполнения: ${stats.completionRate}%\n` +
            `⚠️ Просрочено: ${stats.overdue}`;

        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error getting stats:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении статистики');
    }
});

// Создание проекта
bot.onText(/\/new_project/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_PROJECT_TITLE' };
    await bot.sendMessage(chatId, '📁 Введите название проекта:');
});

// Шаблоны
bot.onText(/\/new_template/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_TEMPLATE_TITLE' };
    await bot.sendMessage(chatId, '📑 Введите название шаблона:');
});

// Обработка текстовых сообщений и кнопок
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Если это состояние ожидания ввода
    if (userStates[chatId] && !text.startsWith('/')) {
        // ... существующая обработка состояний ...
        return;
    }

    // Обработка кнопок меню
    switch (text) {
        case '📝 Новая задача':
            userStates[chatId] = { step: 'AWAITING_TASK_TITLE' };
            await bot.sendMessage(chatId, '📝 Введите название задачи:');
            break;

        case '📋 Мои задачи':
            try {
                const tasks = await Task.findAll({
                    where: { UserId: chatId.toString() },
                    order: [['createdAt', 'DESC']]
                });

                if (tasks.length === 0) {
                    await bot.sendMessage(chatId, '📭 У вас пока нет задач');
                    return;
                }

                const tasksMessage = tasks.map(task => 
                    `📌 ${task.title}\n` +
                    `📊 Статус: ${STATUS_MAP[task.status]}\n` +
                    `⭐️ Приоритет: ${task.priority}\n` +
                    `${task.deadline ? `⏰ Дедлайн: ${new Date(task.deadline).toLocaleDateString()}\n` : ''}` +
                    `-------------------`
                ).join('\n');

                await bot.sendMessage(chatId, tasksMessage);
            } catch (error) {
                console.error('Error getting tasks:', error);
                await bot.sendMessage(chatId, '❌ Произошла ошибка при получении задач');
            }
            break;

        case '📊 Статистика':
            try {
                const stats = await analyticsService.getTasksStats(chatId.toString());
                const message = 
                    '📊 Ваша статистика:\n\n' +
                    `✅ Выполнено задач: ${stats.completed}\n` +
                    `📝 В процессе: ${stats.inProgress}\n` +
                    `⏳ Ожидают выполнения: ${stats.todo}\n`;
                await bot.sendMessage(chatId, message);
            } catch (error) {
                console.error('Error getting stats:', error);
                await bot.sendMessage(chatId, '❌ Ошибка при получении статистики');
            }
            break;

        case '⚙️ Настройки':
            const settingsKeyboard = {
                reply_markup: {
                    keyboard: [
                        ['🔔 Уведомления', '🎨 Тема'],
                        ['↩️ Вернуться в главное меню']
                    ],
                    resize_keyboard: true
                }
            };
            await bot.sendMessage(chatId, '⚙️ Выберите настройку:', settingsKeyboard);
            break;

        case '↩️ Вернуться в главное меню':
            const mainKeyboard = {
                reply_markup: {
                    keyboard: [
                        ['📝 Новая задача', '📋 Мои задачи'],
                        ['📊 Статистика', '⚙️ Настройки']
                    ],
                    resize_keyboard: true
                }
            };
            await bot.sendMessage(chatId, '📱 Главное меню', mainKeyboard);
            break;
    }
});

// Обработчик для /new_project
bot.onText(/\/new_project/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_PROJECT_TITLE' };
    await bot.sendMessage(chatId, '📁 Введите название проекта:');
});

// Обработчик для /my_projects
bot.onText(/\/my_projects/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const projects = await ProjectService.getProjects(chatId.toString());
        if (projects.length === 0) {
            await bot.sendMessage(chatId, '📭 У вас пока нет проектов');
            return;
        }
        const projectsMessage = projects.map(project => 
            `📁 ${project.title}\n-------------------`
        ).join('\n');
        await bot.sendMessage(chatId, projectsMessage);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при получении проектов');
    }
});

// Обработчик для /my_templates
bot.onText(/\/my_templates/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const templates = await Template.findAll({
            where: { UserId: chatId.toString() }
        });
        if (templates.length === 0) {
            await bot.sendMessage(chatId, '📭 У вас пока нет шаблонов');
            return;
        }
        const templatesMessage = templates.map(template => 
            `📑 ${template.title}\n-------------------`
        ).join('\n');
        await bot.sendMessage(chatId, templatesMessage);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при получении шаблонов');
    }
});

// Обработчик для /leaderboard
bot.onText(/\/leaderboard/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const leaders = await leaderboardService.getGlobalLeaderboard();
        let message = '🏆 Глобальный рейтинг:\n\n';
        leaders.forEach((user, index) => {
            message += `${index + 1}. ${user.username}: ${user.stats.points} очков\n`;
        });
        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при получении рейтинга');
    }
});

// Обработчик для /weekly_top
bot.onText(/\/weekly_top/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const weeklyTop = await leaderboardService.getWeeklyLeaderboard();
        let message = '📈 Топ недели:\n\n';
        weeklyTop.forEach((user, index) => {
            message += `${index + 1}. ${user.username}: ${user.completedTasks} задач\n`;
        });
        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при получении топа недели');
    }
});

// Обработчик для /level
bot.onText(/\/level/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const level = await gameService.getUserLevel(chatId.toString());
        const message = 
            `🎮 Ваш уровень: ${level.level}\n` +
            `✨ Очки: ${level.points}\n` +
            `📊 Прогресс до следующего уровня: ${level.progress}%`;
        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при получении уровня');
    }
});

// Обработчик для /achievements
bot.onText(/\/achievements/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await User.findOne({
            where: { telegramId: chatId.toString() }
        });
        let message = '🏅 Ваши достижения:\n\n';
        Object.entries(user.stats.achievements).forEach(([type, achievement]) => {
            message += `${achievement.level > 0 ? '✅' : '⭕️'} ${type}: Уровень ${achievement.level}\n`;
        });
        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при получении достижений');
    }
});

// Обработчик для /report_pdf и /report_excel
bot.onText(/\/(report_pdf|report_excel)/, async (msg) => {
    const chatId = msg.chat.id;
    const command = msg.text.substring(1);
    try {
        const stats = await analyticsService.getTasksStats(chatId.toString());
        const projects = await ProjectService.getProjects(chatId.toString());
        const productivity = await analyticsService.getProductivityReport(chatId.toString());

        let filePath;
        if (command === 'report_pdf') {
            filePath = await reportService.generatePDFReport(stats, projects, productivity);
            await bot.sendDocument(chatId, filePath);
        } else {
            filePath = await reportService.generateExcelReport(stats, projects, productivity);
            await bot.sendDocument(chatId, filePath);
        }

        // Удаляем временный файл
        fs.unlinkSync(filePath);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Ошибка при создании отчета');
    }
});

module.exports = bot;