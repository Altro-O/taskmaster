const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
        default: 'ACTIVE'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

projectSchema.virtual('subprojects', {
    ref: 'Project',
    localField: '_id',
    foreignField: 'parent'
});

module.exports = mongoose.model('Project', projectSchema); 