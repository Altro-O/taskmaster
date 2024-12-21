const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Project extends Model {
        static init(sequelize) {
            return super.init({
                title: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                description: DataTypes.TEXT,
                status: {
                    type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'),
                    defaultValue: 'TODO'
                },
                deadline: DataTypes.DATE
            }, {
                sequelize,
                modelName: 'Project'
            });
        }

        static associate(models) {
            Project.belongsTo(models.User);
            Project.hasMany(models.Task);
        }
    }

    Project.init(sequelize);
    return Project;
}; 