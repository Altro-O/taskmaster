const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Achievement extends Model {}

    Achievement.init({
        type: {
            type: DataTypes.ENUM(
                'TASKS_COMPLETED',
                'PROJECTS_COMPLETED',
                'STREAK_DAYS',
                'PRIORITY_MASTER'
            ),
            allowNull: false
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Achievement'
    });

    return Achievement;
}; 