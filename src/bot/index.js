const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const TaskController = require('../controllers/TaskController');
const ProjectController = require('../controllers/ProjectController');
const ReminderService = require('../services/ReminderService');
const TemplateController = require('../controllers/TemplateController');
const AnalyticsService = require('../services/AnalyticsService');
const GameService = require('../services/GameService');
const ReportService = require('../services/ReportService');
const path = require('path');
const fs = require('fs');
const LeaderboardService = require('../services/LeaderboardService');

const bot = new TelegramBot(config.telegram.token, { polling: true });
const reminderService = new ReminderService(bot);
const taskController = new TaskController(reminderService);
const templateController = new TemplateController(taskController);

// Хранение состояния пользователя
const userStates = {};

// Создаем временную директорию для отчетов, если её нет
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    // Инициализируем достижения при первом запуске
    await GameService.initUserAchievements(chatId.toString());
    
    await bot.sendMessage(chatId, 
        'Добро пожаловать в TaskMaster! 🚀\n\n' +
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
        '/toggle_subtask - Отметить подзадачу как выполненную\n' +
        '/leaderboard - Глобальный рейтинг\n' +
        '/weekly_top - Топ недели\n' +
        '/my_rank - Мой рейтинг\n' +
        '/help - Помощь\n' +
        '/stats - Общая статистика\n' +
        '/project_stats - Статистика по проектам\n' +
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
});

bot.onText(/\/new_task/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_TASK_TITLE' };
    await bot.sendMessage(chatId, 'Введите название задачи:');
});

bot.onText(/\/new_project/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_PROJECT_TITLE' };
    await bot.sendMessage(chatId, 'Введите название проекта:');
});

// Команда создания шаблона
bot.onText(/\/new_template/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'AWAITING_TEMPLATE_TITLE' };
    await bot.sendMessage(chatId, 'Введите название шаблона:');
});

// Команда просмотра шаблонов
bot.onText(/\/my_templates/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const templates = await templateController.getUserTemplates(chatId.toString());
        if (templates.length === 0) {
            await bot.sendMessage(chatId, 'У вас пока нет шаблонов');
            return;
        }

        const templatesMessage = templates.map(template => 
            `📋 ${template.title}\n` +
            `Приоритет: ${template.priority}\n` +
            `${template.description ? `Описание: ${template.description}\n` : ''}` +
            `${template.schedule ? `Расписание: ${template.schedule}\n` : ''}` +
            `ID: ${template._id}\n` +
            `-------------------`
        ).join('\n');

        await bot.sendMessage(chatId, templatesMessage);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении списка шаблонов');
    }
});

// Команда создания задачи из шаблона
bot.onText(/\/create_from_template (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const templateId = match[1];
    
    try {
        const task = await templateController.createTaskFromTemplate(templateId, chatId.toString());
        if (!task) {
            await bot.sendMessage(chatId, '❌ Шаблон не найден');
            return;
        }
        await bot.sendMessage(chatId, '✅ Задача создана из шаблона');
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при создании задачи из шаблона');
    }
});

// Обработка входящих сообщений
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userStates[chatId] || text.startsWith('/')) return;

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

        case 'AWAITING_TASK_DEADLINE':
            let deadline = null;
            if (text !== '-') {
                const [day, month, year] = text.split('.');
                deadline = new Date(year, month - 1, day);
                
                if (isNaN(deadline.getTime())) {
                    await bot.sendMessage(
                        chatId, 
                        '❌ Неверный формат даты. Попробуйте еще раз или отправьте "-" чтобы пропустить:'
                    );
                    return;
                }
            }

            userStates[chatId].deadline = deadline;
            userStates[chatId].step = 'AWAITING_TASK_PRIORITY';
            
            await bot.sendMessage(
                chatId,
                'Выберите приоритет задачи:',
                {
                    reply_markup: {
                        keyboard: [
                            ['🟢 LOW', '🟡 MEDIUM'],
                            ['🟠 HIGH', '🔴 URGENT']
                        ],
                        one_time_keyboard: true
                    }
                }
            );
            break;

        case 'AWAITING_TASK_PRIORITY':
            let priority;
            switch (text) {
                case '🟢 LOW': priority = 'LOW'; break;
                case '🟡 MEDIUM': priority = 'MEDIUM'; break;
                case '🟠 HIGH': priority = 'HIGH'; break;
                case '🔴 URGENT': priority = 'URGENT'; break;
                default:
                    await bot.sendMessage(chatId, '❌ Пожалуйста, выберите приоритет из предложенных вариантов');
                    return;
            }

            try {
                await taskController.createTask(
                    chatId.toString(),
                    userStates[chatId].taskTitle,
                    userStates[chatId].taskDescription,
                    userStates[chatId].deadline,
                    null, // projectId
                    priority
                );
                await bot.sendMessage(chatId, '✅ Задача успешно создана!', {
                    reply_markup: { remove_keyboard: true }
                });
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Произошла ошибка при создании задачи');
            }
            delete userStates[chatId];
            break;

        case 'AWAITING_PROJECT_TITLE':
            userStates[chatId].projectTitle = text;
            userStates[chatId].step = 'AWAITING_PROJECT_DESCRIPTION';
            await bot.sendMessage(chatId, 'Введите описание проекта (или отправьте "-" чтобы пропустить):');
            break;

        case 'AWAITING_PROJECT_DESCRIPTION':
            const projectDescription = text === '-' ? '' : text;
            try {
                await ProjectController.createProject(chatId.toString(), userStates[chatId].projectTitle, projectDescription);
                await bot.sendMessage(chatId, '✅ Проект успешно создан!');
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Произошла ошибка при создании проекта');
            }
            delete userStates[chatId];
            break;

        case 'AWAITING_SUBTASK_TITLE':
            try {
                const task = await taskController.addSubtask(
                    userStates[chatId].taskId,
                    chatId.toString(),
                    text
                );
                if (!task) {
                    await bot.sendMessage(chatId, '❌ Задача не найдена');
                } else {
                    await bot.sendMessage(chatId, '✅ Подзадача добавлена');
                }
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Произошла ошибка при добавлении подзадачи');
            }
            delete userStates[chatId];
            break;

        case 'AWAITING_TEMPLATE_TITLE':
            userStates[chatId].templateTitle = text;
            userStates[chatId].step = 'AWAITING_TEMPLATE_DESCRIPTION';
            await bot.sendMessage(chatId, 'Введите описание шаблона (или отп��авьте "-" чтобы пропустить):');
            break;

        case 'AWAITING_TEMPLATE_DESCRIPTION':
            userStates[chatId].templateDescription = text === '-' ? '' : text;
            userStates[chatId].step = 'AWAITING_TEMPLATE_PRIORITY';
            await bot.sendMessage(
                chatId,
                'Выберите приоритет для задач из шаблона:',
                {
                    reply_markup: {
                        keyboard: [
                            ['🟢 LOW', '🟡 MEDIUM'],
                            ['🟠 HIGH', '🔴 URGENT']
                        ],
                        one_time_keyboard: true
                    }
                }
            );
            break;

        case 'AWAITING_TEMPLATE_PRIORITY':
            let priority;
            switch (text) {
                case '🟢 LOW': priority = 'LOW'; break;
                case '🟡 MEDIUM': priority = 'MEDIUM'; break;
                case '🟠 HIGH': priority = 'HIGH'; break;
                case '🔴 URGENT': priority = 'URGENT'; break;
                default:
                    await bot.sendMessage(chatId, '❌ Пожалуйста, выберите приоритет из предложенных вариантов');
                    return;
            }

            userStates[chatId].templatePriority = priority;
            userStates[chatId].step = 'AWAITING_TEMPLATE_SCHEDULE';
            await bot.sendMessage(
                chatId, 
                'Введите расписание в формате cron (например, "0 9 * * 1" для каждого понедельника в 9:00)\n' +
                'или отправьте "-" чтобы пропустить:'
            );
            break;

        case 'AWAITING_TEMPLATE_SCHEDULE':
            const schedule = text === '-' ? null : text;
            try {
                await templateController.createTemplate(
                    chatId.toString(),
                    userStates[chatId].templateTitle,
                    userStates[chatId].templateDescription,
                    userStates[chatId].templatePriority,
                    null, // projectId
                    schedule
                );
                await bot.sendMessage(chatId, '✅ Шаблон успешно создан!', {
                    reply_markup: { remove_keyboard: true }
                });
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Произошла ошибка при создании шаблона');
            }
            delete userStates[chatId];
            break;

        case 'AWAITING_NEW_STATUS':
            let newStatus;
            switch (text) {
                case '📥 BACKLOG': newStatus = 'BACKLOG'; break;
                case '📝 TODO': newStatus = 'TODO'; break;
                case '🔄 IN_PROGRESS': newStatus = 'IN_PROGRESS'; break;
                case '👀 IN_REVIEW': newStatus = 'IN_REVIEW'; break;
                case '✅ DONE': newStatus = 'DONE'; break;
                default:
                    await bot.sendMessage(chatId, '❌ Пожалуйста, выберите статус из предложенных вариантов');
                    return;
            }

            try {
                const task = await taskController.moveTask(
                    userStates[chatId].taskId,
                    chatId.toString(),
                    newStatus
                );

                if (!task) {
                    await bot.sendMessage(chatId, '❌ Задача не найдена');
                } else {
                    await bot.sendMessage(chatId, '✅ Статус задачи обновлен', {
                        reply_markup: { remove_keyboard: true }
                    });

                    // Если задача завершена, проверяем достижения
                    if (newStatus === 'DONE') {
                        const achievements = await GameService.updateAchievements(chatId.toString());
                        const newAchievements = achievements.filter(a => 
                            a.completed && 
                            a.completedAt && 
                            new Date(a.completedAt).toDateString() === new Date().toDateString()
                        );

                        if (newAchievements.length > 0) {
                            const achievementNames = {
                                TASKS_COMPLETED: '✅ Мастер задач',
                                PRIORITY_MASTER: '⚡ Мастер приоритетов',
                                EARLY_BIRD: '⏰ Опережая время'
                            };

                            const congratsMessage = 
                                '🎉 Поздравляем! Новые достижения:\n\n' +
                                newAchievements.map(a => 
                                    `${achievementNames[a.type]} - Достижение разблокировано!`
                                ).join('\n');

                            await bot.sendMessage(chatId, congratsMessage);
                        }
                    }
                }
            } catch (error) {
                await bot.sendMessage(chatId, '❌ Произошла ошибка при обновлении статуса задачи');
            }
            delete userStates[chatId];
            break;
    }
});

bot.onText(/\/my_tasks/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasks = await taskController.getUserTasks(chatId.toString());
        if (tasks.length === 0) {
            await bot.sendMessage(chatId, 'У вас пока нет задач');
            return;
        }

        const priorityEmoji = {
            LOW: '🟢',
            MEDIUM: '🟡',
            HIGH: '🟠',
            URGENT: '🔴'
        };

        const tasksMessage = tasks.map(task => {
            let message = `${priorityEmoji[task.priority]} ${task.title}\n` +
                `Статус: ${task.status}\n` +
                `Приоритет: ${task.priority}\n` +
                `${task.description ? `Описание: ${task.description}\n` : ''}` +
                `${task.deadline ? `Дедлайн: ${task.deadline.toLocaleDateString()}\n` : ''}` +
                `ID: ${task._id}\n`;

            if (task.subtasks && task.subtasks.length > 0) {
                message += '\nПодзадачи:\n' + task.subtasks.map(subtask =>
                    `${subtask.completed ? '✅' : '⬜'} ${subtask.title} (ID: ${subtask._id})`
                ).join('\n');
            }

            return message + '\n-------------------';
        }).join('\n');

        await bot.sendMessage(chatId, tasksMessage);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении списка задач');
    }
});

bot.onText(/\/my_projects/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const projects = await ProjectController.getUserProjects(chatId.toString());
        if (projects.length === 0) {
            await bot.sendMessage(chatId, 'У вас пока нет проектов');
            return;
        }

        const projectsMessage = projects.map(project => 
            `📁 ${project.title}\n` +
            `${project.description ? `Описание: ${project.description}\n` : ''}` +
            `ID: ${project._id}\n` +
            `-------------------`
        ).join('\n');

        await bot.sendMessage(chatId, projectsMessage);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении списка проектов');
    }
});

// Добавляем команду для установки дедлайна существующей задачи
bot.onText(/\/set_deadline (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    
    userStates[chatId] = { 
        step: 'AWAITING_DEADLINE_UPDATE',
        taskId: taskId
    };
    
    await bot.sendMessage(
        chatId, 
        'Введите новый дедлайн в формате ДД.ММ.ГГГГ:'
    );
});

// Добавляем команду для изменения приоритета существующей задачи
bot.onText(/\/set_priority (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    
    userStates[chatId] = { 
        step: 'AWAITING_PRIORITY_UPDATE',
        taskId: taskId
    };
    
    await bot.sendMessage(
        chatId,
        'Выберите новый приоритет:',
        {
            reply_markup: {
                keyboard: [
                    ['🟢 LOW', '🟡 MEDIUM'],
                    ['🟠 HIGH', '🔴 URGENT']
                ],
                one_time_keyboard: true
            }
        }
    );
});

// Добавляем команду для создания подзаачи
bot.onText(/\/add_subtask (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    
    userStates[chatId] = { 
        step: 'AWAITING_SUBTASK_TITLE',
        taskId: taskId
    };
    
    await bot.sendMessage(chatId, 'Введите название подзаачи:');
});

// Добавляем команду для переключения статуса подзадачи
bot.onText(/\/toggle_subtask (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    const subtaskId = match[2];
    
    try {
        const task = await taskController.toggleSubtask(taskId, chatId.toString(), subtaskId);
        if (!task) {
            await bot.sendMessage(chatId, '❌ Задача или подзадача не найдена');
            return;
        }
        await bot.sendMessage(chatId, '✅ Статус подзадачи обновлен');

        // Проверяем достижения после выполнения подзадачи
        const achievements = await GameService.updateAchievements(chatId.toString());
        const newAchievements = achievements.filter(a => 
            a.completed && 
            a.completedAt && 
            new Date(a.completedAt).toDateString() === new Date().toDateString()
        );

        // Уведомляем о новых достижениях
        if (newAchievements.length > 0) {
            const achievementNames = {
                TASKS_COMPLETED: '✅ Мастер задач',
                PROJECTS_COMPLETED: '📁 Проектный менеджер',
                STREAK_DAYS: '🔥 Продуктивная серия',
                PRIORITY_MASTER: '⚡ Мастер приоритетов',
                EARLY_BIRD: '⏰ Опережая время',
                SUBTASK_MASTER: '📝 Мастер подзадач'
            };

            const congratsMessage = 
                '🎉 Поздравляем! Новые достижения:\n\n' +
                newAchievements.map(a => 
                    `${achievementNames[a.type]} - Достижение разблокировано!`
                ).join('\n');

            await bot.sendMessage(chatId, congratsMessage);
        }
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при обновлении статуса подзадачи');
    }
});

// Команда для получения общей статистики
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const stats = await AnalyticsService.getTasksStats(chatId.toString());
        
        const message = 
            '📊 Статистика по задачам:\n\n' +
            `Всего задач: ${stats.total}\n\n` +
            'По статусу:\n' +
            `📝 TODO: ${stats.byStatus.TODO}\n` +
            `🔄 IN PROGRESS: ${stats.byStatus.IN_PROGRESS}\n` +
            `👀 IN REVIEW: ${stats.byStatus.IN_REVIEW}\n` +
            `✅ DONE: ${stats.byStatus.DONE}\n\n` +
            'По приоритету:\n' +
            `🟢 LOW: ${stats.byPriority.LOW}\n` +
            `🟡 MEDIUM: ${stats.byPriority.MEDIUM}\n` +
            `🟠 HIGH: ${stats.byPriority.HIGH}\n` +
            `🔴 URGENT: ${stats.byPriority.URGENT}\n\n` +
            `Процент выполнения: ${stats.completionRate}%\n` +
            `Просроченные задачи: ${stats.overdue}`;

        await bot.sendMessage(chatId, message);

        // Отправляем график
        const chartPath = await ReportService.generateTasksChart(stats);
        await bot.sendPhoto(chatId, chartPath, {
            caption: 'График распределения задач по статусам'
        });
        fs.unlinkSync(chartPath);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении статистики');
    }
});

// Команда для получения статистики по проектам
bot.onText(/\/project_stats/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const projectStats = await AnalyticsService.getProjectStats(chatId.toString());
        
        if (projectStats.length === 0) {
            await bot.sendMessage(chatId, 'У вас пока нет проектов с задачами');
            return;
        }

        const message = projectStats.map(project =>
            `📁 ${project.name}\n` +
            `Всего задач: ${project.total}\n` +
            `✅ Выполнено: ${project.completed}\n` +
            `🔄 В процессе: ${project.inProgress}\n` +
            `📝 Ожидает: ${project.todo}\n` +
            '-------------------'
        ).join('\n');

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении статистики проектов');
    }
});

// Команда для получения отчета о продуктивности
bot.onText(/\/productivity/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const productivityData = await AnalyticsService.getProductivityReport(chatId.toString());
        
        const message = '📈 Отчет о продуктивности за последние 7 дней:\n\n' +
            productivityData.map(day =>
                `📅 ${day.date}\n` +
                `Создано задач: ${day.created}\n` +
                `Выполнено задач: ${day.completed}\n` +
                '-------------------'
            ).join('\n');

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении отчета о продуктивности');
    }
});

// Команда для просмотра достижений
bot.onText(/\/achievements/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        // Обновляем достижения перед показом
        const achievements = await GameService.updateAchievements(chatId.toString());
        
        const achievementNames = {
            TASKS_COMPLETED: '✅ Мастер задач',
            PROJECTS_COMPLETED: '📁 Проектный менеджер',
            STREAK_DAYS: '🔥 Продуктивная серия',
            PRIORITY_MASTER: '⚡ Мастер приоритетов',
            EARLY_BIRD: '⏰ Опережая время',
            SUBTASK_MASTER: '📝 Мастер подзадач'
        };

        const achievementLevels = {
            TASKS_COMPLETED: [5, 20, 50, 100],
            PROJECTS_COMPLETED: [1, 5, 10, 20],
            STREAK_DAYS: [3, 7, 14, 30],
            PRIORITY_MASTER: [5, 15, 30, 50],
            EARLY_BIRD: [5, 15, 30, 50],
            SUBTASK_MASTER: [10, 30, 60, 100]
        };

        const message = achievements.map(achievement => {
            const levels = achievementLevels[achievement.type];
            const currentTarget = levels[achievement.level - 1] || levels[levels.length - 1];
            const progress = achievement.completed ? 'Завершено! 🏆' : 
                `${achievement.progress}/${currentTarget} (Уровень ${achievement.level})`;

            return `${achievementNames[achievement.type]}\n` +
                   `Прогресс: ${progress}\n` +
                   '-------------------';
        }).join('\n');

        await bot.sendMessage(chatId, 
            '🏆 Ваши достижения:\n\n' + message
        );
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получен��и достижений');
    }
});

// Команда для просмотра уровня и очков
bot.onText(/\/level/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const stats = await GameService.getUserStats(chatId.toString());
        
        const message = 
            '🎮 Ваш игровой профиль:\n\n' +
            `Уровень: ${stats.level} 🌟\n` +
            `Очки: ${stats.points} ⭐\n\n` +
            'Достижения:\n' +
            `Выполнено: ${stats.achievements.completed}/${stats.achievements.total}\n` +
            `Прогресс: ${stats.achievements.percentage}%`;

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении статистики');
    }
});

// Команда для отображения Kanban-доски
bot.onText(/\/kanban/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const board = await taskController.getKanbanBoard(chatId.toString());
        
        const statusEmoji = {
            BACKLOG: '📥',
            TODO: '📝',
            IN_PROGRESS: '🔄',
            IN_REVIEW: '👀',
            DONE: '✅'
        };

        let message = '📊 Kanban-доска:\n\n';
        
        for (const [status, tasks] of Object.entries(board)) {
            message += `${statusEmoji[status]} ${status} (${tasks.length})\n`;
            if (tasks.length > 0) {
                message += tasks.map(task => 
                    `- ${task.title} ${task.priority === 'URGENT' ? '🔴' : ''}\n` +
                    `  ID: ${task._id}`
                ).join('\n');
                message += '\n\n';
            } else {
                message += 'Нет задач\n\n';
            }
        }

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении Kanban-доски');
    }
});

// Команда для перемещения задачи
bot.onText(/\/move_task (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = match[1];
    
    userStates[chatId] = { 
        step: 'AWAITING_NEW_STATUS',
        taskId: taskId
    };
    
    await bot.sendMessage(
        chatId,
        'Выберите новый статус задачи:',
        {
            reply_markup: {
                keyboard: [
                    ['📥 BACKLOG', '📝 TODO'],
                    ['🔄 IN_PROGRESS', '👀 IN_REVIEW'],
                    ['✅ DONE']
                ],
                one_time_keyboard: true
            }
        }
    );
});

// Команда для получения графика задач
bot.onText(/\/chart/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const stats = await AnalyticsService.getTasksStats(chatId.toString());
        const chartPath = await ReportService.generateTasksChart(stats);

        await bot.sendPhoto(chatId, chartPath, {
            caption: '📊 График распределения задач по статусам'
        });

        // Удаляем временный файл
        fs.unlinkSync(chartPath);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при генерации графика');
    }
});

// Команда для получения PDF отчета
bot.onText(/\/report_pdf/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasksData = await AnalyticsService.getTasksStats(chatId.toString());
        const projectsData = await AnalyticsService.getProjectStats(chatId.toString());
        const productivityData = await AnalyticsService.getProductivityReport(chatId.toString());

        const pdfPath = await ReportService.generatePDFReport(
            tasksData,
            projectsData,
            productivityData
        );

        await bot.sendDocument(chatId, pdfPath, {
            caption: '📄 Подробный отчет в формате PDF'
        });

        // Удаляем временный файл
        fs.unlinkSync(pdfPath);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при генерации PDF отчета');
    }
});

// Команда для получения Excel отчета
bot.onText(/\/report_excel/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const tasksData = await AnalyticsService.getTasksStats(chatId.toString());
        const projectsData = await AnalyticsService.getProjectStats(chatId.toString());
        const productivityData = await AnalyticsService.getProductivityReport(chatId.toString());

        const excelPath = await ReportService.generateExcelReport(
            tasksData,
            projectsData,
            productivityData
        );

        await bot.sendDocument(chatId, excelPath, {
            caption: '📊 Подробный отчет в формате Excel'
        });

        // Удаляем временный файл
        fs.unlinkSync(excelPath);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при генерации Excel от��ета');
    }
});

// Команда для просмотра глобального лидерборда
bot.onText(/\/leaderboard/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const users = await LeaderboardService.getGlobalLeaderboard();
        
        let message = '🏆 Глобальный рейтинг:\n\n';
        users.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            message += `${medal} Игрок ${user._id}\n` +
                      `   Очки: ${user.totalPoints} ⭐\n` +
                      `   Достижения: ${user.completedAchievements} 🏆\n` +
                      `   Выполнено задач: ${user.tasksCompleted}/${user.totalTasks}\n` +
                      `   Процент выполнения: ${user.completionRate}%\n` +
                      '-------------------\n';
        });

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении рейтинга');
    }
});

// Команда для просмотра еженедельного топа
bot.onText(/\/weekly_top/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const users = await LeaderboardService.getWeeklyLeaderboard();
        
        let message = '📅 Топ недели:\n\n';
        users.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            message += `${medal} Игрок ${user._id}\n` +
                      `   Выполнено задач: ${user.completedTasks}\n` +
                      `   Очки за неделю: ${user.totalPoints} ⭐\n` +
                      '-------------------\n';
        });

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении еженедельного топа');
    }
});

// Команда для просмотра своего рейтинга
bot.onText(/\/my_rank/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const rank = await LeaderboardService.getUserRank(chatId.toString());
        
        if (!rank) {
            await bot.sendMessage(chatId, '❌ У вас пока нет рейтинга. Выполните несколько задач!');
            return;
        }

        const message = 
            '🎯 Ваш рейтинг:\n\n' +
            `Место: ${rank.rank} из ${rank.totalUsers}\n` +
            `Вы лучше чем ${rank.percentile}% игроков!\n\n` +
            'Продолжайте в том же духе! 💪';

        await bot.sendMessage(chatId, message);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Произошла ошибка при получении вашего рейтинга');
    }
});

// Обновляем команду /help
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = 
        '📚 Справка по командам:\n\n' +
        // ... существующие команды ...
        '🏆 Рейтинги и соревнования:\n' +
        '/leaderboard - Показать глобальный рейтинг\n' +
        '/weekly_top - Показать топ недели\n' +
        '/my_rank - Узнать свой рейтинг\n\n' +
        '📊 Отчеты и аналитика:\n' +
        '/stats - Общая статистика\n' +
        '/chart - График задач\n' +
        '/report_pdf - Отчет в PDF\n' +
        '/report_excel - Отчет в Excel';

    await bot.sendMessage(chatId, helpMessage);
});

module.exports = bot; 