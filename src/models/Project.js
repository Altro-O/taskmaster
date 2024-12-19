const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Project extends Model {}

    Project.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: DataTypes.TEXT,
        status: {
            type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED'),
            defaultValue: 'ACTIVE'
        },
        deadline: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'Project'
    });

    return Project;
}; 