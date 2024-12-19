const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Task extends Model {}

    Task.init({
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        status: {
            type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'DONE'),
            defaultValue: 'TODO'
        },
        priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            defaultValue: 'MEDIUM'
        },
        deadline: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'Task'
    });

    return Task;
}; 