'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Сначала создаем ENUM тип
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_projects_status" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE');
    `).catch(() => {}); // Игнорируем ошибку, если тип уже существует

    // Добавляем колонку
    await queryInterface.addColumn('Projects', 'status', {
      type: Sequelize.ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'),
      defaultValue: 'TODO',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем колонку
    await queryInterface.removeColumn('Projects', 'status');
    
    // Удаляем ENUM тип
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_projects_status";
    `);
  }
}; 