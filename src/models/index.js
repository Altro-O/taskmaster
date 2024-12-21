const { Sequelize } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.storage,
    logging: false
});

// Определяем модели
const User = require('./User')(sequelize);
const Task = require('./Task')(sequelize);
const Project = require('./Project')(sequelize);
const Template = require('./Template')(sequelize);

// Определяем связи
User.hasMany(Task);
Task.belongsTo(User);

User.hasMany(Project);
Project.belongsTo(User);

Project.hasMany(Task);
Task.belongsTo(Project);

User.hasMany(Template);
Template.belongsTo(User);

module.exports = {
    sequelize,
    User,
    Task,
    Project,
    Template
}; 