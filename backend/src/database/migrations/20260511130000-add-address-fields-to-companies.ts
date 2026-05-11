import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("Companies");

    const addIfMissing = async (col: string, def: any) => {
      if (!tableDesc[col]) {
        await queryInterface.addColumn("Companies", col, def);
      }
    };

    await addIfMissing("addressNumber", { type: DataTypes.STRING(20), allowNull: true });
    await addIfMissing("province", { type: DataTypes.STRING, allowNull: true });
  },

  down: async (queryInterface: QueryInterface) => {
    for (const col of ["addressNumber", "province"]) {
      await queryInterface.removeColumn("Companies", col);
    }
  }
};
