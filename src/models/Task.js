const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    telegramChatId: { 
        type: String,
        sparse: true
    },
    source: {
        type: String,
        enum: ['web', 'telegram'],
        required: true
    },
    title: { type: String, required: true },
    description: String,
    status: {
        type: String,
        enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
        default: 'BACKLOG'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    deadline: Date,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    subtasks: [{
        title: { type: String, required: true },
        completed: { type: Boolean, default: false }
    }],
    column: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Task', taskSchema); 