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

const bot = new TelegramBot(config.telegram.token, { polling: true });
const reminderService = new ReminderService(bot);
const taskController = new TaskController(reminderService);
const gameService = new GameService();
const leaderboardService = new LeaderboardService();
const templateController = new TemplateController(taskController);
const analyticsService = new AnalyticsService();

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

// Команды бота
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        // Создаем или находим пользователя
        const [user] = await User.findOrCreate({
            where: { telegramId: chatId.toString() },
            defaults: {
                username: msg.from.username,
                settings: {
                    notifications: true,
                    theme: 'light'
                },
                stats: {
                    tasksCompleted: 0,
                    totalTasks: 0,
                    points: 0
                }
            }
        });

        await gameService.initUserAchievements(chatId.toString());
        
        await bot.sendMessage(chatId, 
            'Добро пожаловать в TaskMaster! 🚀\n\n' +
            'Доступные команды:\n' +
            '📝 /new_task - Создать новую задачу\n' +
            '📋 /my_tasks - Посмотреть мои задачи\n' +
            '📁 /new_project - Создать новый проект\n' +
            '📂 /my_projects - Посмотреть мои проекты\n' +
            '📑 /new_template - Создать шаблон задачи\n' +
            '📚 /my_templates - Посмотреть мои шаблоны\n' +
            '✨ /create_from_template - Создать задачу из шаблона\n' +
            '⭐️ /set_priority - Установить приоритет задачи\n' +
            '✅ /add_subtask - Добавить подзадачу\n' +
            '☑️ /toggle_subtask - Отметить подзадачу\n' +
            '🏆 /leaderboard - Глобальный рейтинг\n' +
            '📈 /weekly_top - Топ недели\n' +
            '🎯 /my_rank - Мой рейтинг\n' +
            '📊 /stats - Общая статистика\n' +
            '📈 /project_stats - Статистика по проектам\n' +
            '📉 /productivity - Отчет о продуктивности\n' +
            '🎮 /level - Мой уровень и очки\n' +
            '🏅 /achievements - Мои достижения\n' +
            '📋 /kanban - Показать Kanban-доску\n' +
            '↔️ /move_task - Переместить задачу\n' +
            '📊 /chart - График задач\n' +
            '📄 /report_pdf - Отчет в PDF\n' +
            '📊 /report_excel - Отчет в Excel\n' +
            '📋 /help - Помощь'
        );
    } catch (error) {
        console.error('Error in /start command:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при запуске бота');
    }
});

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

// Обработка входящих сообщений
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userStates[chatId] || text.startsWith('/')) return;

    try {
        switch (userStates[chatId].step) {
            case 'AWAITING_TASK_TITLE':
                userStates[chatId].taskTitle = text;
                userStates[chatId].step = 'AWAITING_TASK_DESCRIPTION';
                await bot.sendMessage(chatId, '📝 Введите описание задачи (или отправьте "-" чтобы пропустить):');
                break;

            case 'AWAITING_TASK_DESCRIPTION':
                userStates[chatId].taskDescription = text === '-' ? '' : text;
                userStates[chatId].step = 'AWAITING_TASK_DEADLINE';
                await bot.sendMessage(
                    chatId, 
                    '⏰ Введите дедлайн задачи в формате ДД.ММ.ГГГГ (или отправьте "-" чтобы пропустить):'
                );
                break;

            case 'AWAITING_PROJECT_TITLE':
                try {
                    const project = await ProjectService.createProject(chatId.toString(), {
                        title: text,
                        description: ''
                    });
                    await bot.sendMessage(chatId, `✅ Проект "${text}" успешно создан!`);
                } catch (error) {
                    await bot.sendMessage(chatId, '❌ Ошибка при создани�� проекта');
                }
                delete userStates[chatId];
                break;

            // ... Остальные состояния ...
        }
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при обработке сообщения');
        delete userStates[chatId];
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