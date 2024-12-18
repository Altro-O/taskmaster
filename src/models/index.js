const sequelize = require('../database');
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