const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    schedule: {
        type: String,  // Cron-формат для автоматического создания
        default: null
    },
    subtasks: [{
        title: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', templateSchema); 