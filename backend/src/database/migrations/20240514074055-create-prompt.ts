import { QueryInterface, DataTypes } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('Prompts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      prompt: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      apiKey: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      maxMessages: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
      },
      temperature: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      promptTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      completionTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      voice: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      voiceKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      voiceRegion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      queueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Queues',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('Prompts');
  },
};
