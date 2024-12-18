const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type: {
        type: String,
        enum: [
            'TASKS_COMPLETED',      // Выполнено задач
            'PROJECTS_COMPLETED',   // Завершено проектов
            'STREAK_DAYS',         // Дней подряд с выполненными задачами
            'PRIORITY_MASTER',     // Выполнено важных задач
            'EARLY_BIRD',         // Выполнено задач до дедлайна
            'SUBTASK_MASTER'      // Выполнено подзадач
        ],
        required: true
    },
    level: { type: Number, default: 1 },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Achievement', achievementSchema); 