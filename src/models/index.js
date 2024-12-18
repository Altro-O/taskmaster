const { Sequelize } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.path,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        timeout: 60000,
        busy_timeout: 60000
    }
});
const User = require('./User');
const Task = require('./Task');
const Project = require('./Project');
const Template = require('./Template');

// Определяем связи
User.hasMany(Task);
Task.belongsTo(User);

User.hasMany(Project);
Project.belongsTo(User);

User.hasMany(Template);
Template.belongsTo(User);

Project.hasMany(Task);
Task.belongsTo(Project);

// Самосвязь для проектов (иерархия)
Project.hasMany(Project, { as: 'subprojects', foreignKey: 'parent' });
Project.belongsTo(Project, { as: 'parentProject', foreignKey: 'parent' });

module.exports = {
    sequelize,
    User,
    Task,
    Project,
    Template
}; 