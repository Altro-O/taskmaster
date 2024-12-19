const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Template = sequelize.define('Template', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: DataTypes.TEXT,
        defaultPriority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            defaultValue: 'MEDIUM'
        }
    });

    return Template;
}; 