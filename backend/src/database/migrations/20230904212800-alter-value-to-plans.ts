import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.changeColumn("Plans", "value", {
        type: DataTypes.FLOAT,
        allowNull: true,
      })
    ]);
  },
  
  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.changeColumn("Plans", "value", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 199.99
      })
    ]);
  },
};
