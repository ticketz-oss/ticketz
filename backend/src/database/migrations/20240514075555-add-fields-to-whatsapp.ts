import { QueryInterface, DataTypes } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Whatsapps', 'timeSendQueue', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Whatsapps', 'sendIdQueue', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Whatsapps', 'promptId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Prompts', // Name of the referenced table
        key: 'id', // Primary key of the referenced table
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Whatsapps', 'timeSendQueue');
    await queryInterface.removeColumn('Whatsapps', 'sendIdQueue');
    await queryInterface.removeColumn('Whatsapps', 'promptId');
  },
};
