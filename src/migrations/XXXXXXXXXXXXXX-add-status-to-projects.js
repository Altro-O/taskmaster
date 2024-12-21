'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Projects', 'status', {
      type: Sequelize.ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'),
      defaultValue: 'TODO',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Projects', 'status');
  }
}; 