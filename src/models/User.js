const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    telegramId: {
        type: DataTypes.STRING,
        unique: true
    },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    settings: {
        type: DataTypes.JSON,
        defaultValue: {
            notifications: true,
            theme: 'light'
        }
    },
    stats: {
        type: DataTypes.JSON,
        defaultValue: {
            tasksCompleted: 0,
            totalTasks: 0,
            points: 0
        }
    }
});

User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

module.exports = User; 