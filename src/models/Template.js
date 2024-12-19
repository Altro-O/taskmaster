const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Template extends Model {}

    Template.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: DataTypes.TEXT,
        taskTemplate: {
            type: DataTypes.JSON,
            defaultValue: {}
        }
    }, {
        sequelize,
        modelName: 'Template'
    });

    return Template;
}; 