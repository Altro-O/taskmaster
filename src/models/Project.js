const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        status: {
            type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'),
            defaultValue: 'TODO'
        },
        deadline: DataTypes.DATE
    });

    Project.associate = function(models) {
        Project.belongsTo(models.User);
        Project.hasMany(models.Task);
    };

    return Project;
}; 