const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    telegramId: {
        type: String,
        unique: true,
        sparse: true
    },
    webAccess: {
        type: Boolean,
        default: false
    },
    telegramAccess: {
        type: Boolean,
        default: false
    },
    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            telegram: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

module.exports = mongoose.model('User', userSchema); 