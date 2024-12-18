const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Task = sequelize.define('Task', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    status: {
        type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'),
        defaultValue: 'TODO'
    },
    priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        defaultValue: 'MEDIUM'
    },
    deadline: DataTypes.DATE,
    completedAt: DataTypes.DATE,
    subtasks: {
        type: DataTypes.JSON,
        defaultValue: []
    }
});

module.exports = Task; 