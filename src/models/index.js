const { Sequelize } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.storage
});

// Импортируем модели
const UserModel = require('./User')(sequelize);
const TaskModel = require('./Task')(sequelize);
const ProjectModel = require('./Project')(sequelize);
const TemplateModel = require('./Template')(sequelize);

// Определяем связи между моделями
UserModel.hasMany(TaskModel, { 
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
});
TaskModel.belongsTo(UserModel);

UserModel.hasMany(ProjectModel, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
});
ProjectModel.belongsTo(UserModel);

ProjectModel.hasMany(TaskModel, {
    foreignKey: 'ProjectId',
    onDelete: 'CASCADE'
});
TaskModel.belongsTo(ProjectModel);

UserModel.hasMany(TemplateModel, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
});
TemplateModel.belongsTo(UserModel);

module.exports = {
    sequelize,
    User: UserModel,
    Task: TaskModel,
    Project: ProjectModel,
    Template: TemplateModel
}; 