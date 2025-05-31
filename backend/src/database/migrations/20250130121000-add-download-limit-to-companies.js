'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Companies', 'downloadLimit', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 15
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'downloadLimit');
  }
};
