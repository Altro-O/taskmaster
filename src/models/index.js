const { Sequelize } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.storage
});

// Определяем модели
const defineModels = () => {
    const User = require('./User')(sequelize);
    const Task = require('./Task')(sequelize);
    const Project = require('./Project')(sequelize);
    const Template = require('./Template')(sequelize);

    // Определяем связи между моделями
    User.hasMany(Task, { 
        foreignKey: 'UserId',
        onDelete: 'CASCADE'
    });
    Task.belongsTo(User);

    User.hasMany(Project, {
        foreignKey: 'UserId',
        onDelete: 'CASCADE'
    });
    Project.belongsTo(User);

    Project.hasMany(Task, {
        foreignKey: 'ProjectId',
        onDelete: 'CASCADE'
    });
    Task.belongsTo(Project);

    User.hasMany(Template, {
        foreignKey: 'UserId',
        onDelete: 'CASCADE'
    });
    Template.belongsTo(User);

    return {
        User,
        Task,
        Project,
        Template
    };
};

const models = defineModels();

module.exports = {
    sequelize,
    ...models
}; 