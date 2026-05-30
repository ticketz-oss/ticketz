import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableDesc = await queryInterface.describeTable("Companies");

    const addIfMissing = async (col: string, def: any) => {
      if (!tableDesc[col]) {
        await queryInterface.addColumn("Companies", col, def);
      }
    };

    await addIfMissing("document", { type: DataTypes.STRING, allowNull: true });
    await addIfMissing("postalCode", { type: DataTypes.STRING(10), allowNull: true });
    await addIfMissing("address", { type: DataTypes.STRING, allowNull: true });
    await addIfMissing("city", { type: DataTypes.STRING, allowNull: true });
    await addIfMissing("state", { type: DataTypes.STRING(2), allowNull: true });
    await addIfMissing("municipalRegistration", { type: DataTypes.STRING, allowNull: true });
    await addIfMissing("stateRegistration", { type: DataTypes.STRING, allowNull: true });
    await addIfMissing("fiscalEmail", { type: DataTypes.STRING, allowNull: true });
    await addIfMissing("asaasCustomerId", { type: DataTypes.STRING, allowNull: true });
  },

  down: async (queryInterface: QueryInterface) => {
    for (const col of [
      "document", "postalCode", "address", "city", "state",
      "municipalRegistration", "stateRegistration", "fiscalEmail", "asaasCustomerId"
    ]) {
      await queryInterface.removeColumn("Companies", col);
    }
  }
};
