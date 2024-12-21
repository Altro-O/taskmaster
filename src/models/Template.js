const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Template extends Model {}

    Template.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: DataTypes.TEXT,
        priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
            defaultValue: 'MEDIUM'
        },
        schedule: {
            type: DataTypes.JSON,
            defaultValue: null
        }
    }, {
        sequelize,
        modelName: 'Template'
    });

    return Template;
}; 