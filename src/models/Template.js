const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Template = sequelize.define('Template', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        defaultValue: 'MEDIUM'
    },
    schedule: DataTypes.STRING,
    subtasks: {
        type: DataTypes.JSON,
        defaultValue: []
    }
});

module.exports = Template; 