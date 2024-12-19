const { Sequelize } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.storage
});

// Импортируем модели напрямую
const User = require('./User');
const Task = require('./Task');
const Project = require('./Project');
const Template = require('./Template');

// Инициализируем модели
const UserModel = User(sequelize);
const TaskModel = Task(sequelize);
const ProjectModel = Project(sequelize);
const TemplateModel = Template(sequelize);

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