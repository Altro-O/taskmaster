const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const { User, Task, Project, Template } = require('../models');
const TaskController = require('../controllers/TaskController');
const ProjectController = require('../controllers/ProjectController');
const ReminderService = require('../services/ReminderService');
const TemplateController = require('../controllers/TemplateController');
const AnalyticsService = require('../services/AnalyticsService');
const GameService = require('../services/GameService');
const ReportService = require('../services/ReportService');
const LeaderboardService = require('../services/LeaderboardService');
const path = require('path');
const fs = require('fs');

const bot = new TelegramBot(config.telegram.token, { polling: true });
const reminderService = new ReminderService(bot);
const taskController = new TaskController(reminderService);
const gameService = new GameService();
const templateController = new TemplateController(taskController);

// Хранение состояния пользователя
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

        await GameService.initUserAchievements(chatId.toString());
        
        await bot.sendMessage(chatId, 
            'Добро пожаловать в TaskMaster! ����\n\n' +
            'Доступные команды:\n' +
            '/new_task - Создать новую задачу\n' +
            '/my_tasks - Посмотреть мои задачи\n' +
            '/new_project - Создать новый проект\n' +
            '/my_projects - Посмотреть мои проекты\n' +
            '/new_template - Создать шаблон задачи\n' +
            '/my_templates - Посмотреть мои шаблоны\n' +
            '/create_from_template - Создать задачу из шаблона\n' +
            '/set_priority - Установить приоритет задачи\n' +
            '/add_subtask - Добавить подзадачу\n' +
            '/toggle_subtask - Отметить подзадачу\n' +
            '/leaderboard - Глобальный рейтинг\n' +
            '/weekly_top - Топ недели\n' +
            '/my_rank - Мой рейтинг\n' +
            '/stats - Общая статистика\n' +
            '/project_stats - Стат��стика по проектам\n' +
            '/productivity - Отчет о продуктивности\n' +
            '/level - Мой уровень и очки\n' +
            '/achievements - Мои достижения\n' +
            '/kanban - Показать Kanban-доску\n' +
            '/move_task - Переместить задачу\n' +
            '/chart - График задач\n' +
            '/report_pdf - Отчет в PDF\n' +
            '/report_excel - Отчет в Excel\n' +
            '/help - Помощь'
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
    await bot.sendMessage(chatId, 'Введите название задачи:');
});

// Просмотр задач
bot.onText(/\/my_tasks/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasks = await Task.findAll({
            where: { 
                UserId: chatId.toString(),
                status: { [Op.ne]: 'DONE' }
            },
            order: [['createdAt', 'DESC']]
        });

        if (tasks.length === 0) {
            await bot.sendMessage(chatId, 'У вас нет активных задач');
            return;
        }

        const tasksMessage = tasks.map(task => 
            `📌 ${task.title}\n` +
            `Статус: ${task.status}\n` +
            `Приоритет: ${task.priority}\n` +
            `${task.deadline ? `Дедлайн: ${new Date(task.deadline).toLocaleDateString()}\n` : ''}` +
            `ID: ${task.id}\n` +
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
            TODO: tasks.filter(t => t.status === 'TODO'),
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
            IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW'),
            DONE: tasks.filter(t => t.status === 'DONE')
        };

        let message = '📋 Kanban доска:\n\n';
        
        for (const [status, statusTasks] of Object.entries(board)) {
            message += `${status}:\n`;
            if (statusTasks.length === 0) {
                message += 'Нет задач\n';
            } else {
                statusTasks.forEach(task => {
                    message += `- ${task.title} (${task.priority})\n`;
                });
            }
            message += '\n';
        }

        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error showing kanban:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при отображении доски');
    }
});

// Статистика
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const stats = await AnalyticsService.getTasksStats(chatId.toString());
        
        const message = 
            '📊 Статистика по задачам:\n\n' +
            `Всего задач: ${stats.total}\n` +
            `Выполнено: ${stats.byStatus.DONE}\n` +
            `В работе: ${stats.byStatus.IN_PROGRESS}\n` +
            `На проверке: ${stats.byStatus.IN_REVIEW}\n` +
            `Ожидают: ${stats.byStatus.TODO}\n\n` +
            `Процент выполнения: ${stats.completionRate}%\n` +
            `Просрочено: ${stats.overdue}`;

        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error getting stats:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении статистики');
    }
});

// ... Остальные команды ...

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
                await bot.sendMessage(chatId, 'Введите описание задачи (или отправьте "-" чтобы пропустить):');
                break;

            case 'AWAITING_TASK_DESCRIPTION':
                userStates[chatId].taskDescription = text === '-' ? '' : text;
                userStates[chatId].step = 'AWAITING_TASK_DEADLINE';
                await bot.sendMessage(
                    chatId, 
                    'Введите дедлайн задачи в формате ДД.ММ.ГГГГ (или отправьте "-" чтобы пропустить):'
                );
                break;

            // ... Остальные состояния ...
        }
    } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при обработке сообщения');
        delete userStates[chatId];
    }
});

module.exports = bot;