const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {}

    User.init({
        telegramId: {
            type: DataTypes.STRING,
            unique: true
        },
        username: DataTypes.STRING,
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
                points: 0,
                achievements: {}
            }
        }
    }, {
        sequelize,
        modelName: 'User'
    });

    return User;
}; 