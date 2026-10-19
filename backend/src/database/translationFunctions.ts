import { Op, QueryInterface } from "sequelize";

export type TranslationsMap = {
  [language: string]: { [key: string]: string };
};

export async function translationsDown(
  translationsMap: { [language: string]: { [key: string]: string } },
  queryInterface: QueryInterface
) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const deletionCriteria = Object.entries(translationsMap).map(
      ([language, keys]) => ({
        language,
        key: { [Op.in]: Object.keys(keys) }
      })
    );

    await queryInterface.bulkDelete(
      "Translations",
      {
        namespace: "backend",
        [Op.or]: deletionCriteria
      },
      { transaction }
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function translationsUp(
  translationsMap: TranslationsMap,
  queryInterface: QueryInterface
) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // make sure we clear the existing translations first
    await translationsDown(translationsMap, queryInterface);

    const translations: Array<{
      language: string;
      namespace: string;
      key: string;
      value: string;
    }> = [];

    Object.entries(translationsMap).forEach(([language, keys]) => {
      Object.entries(keys).forEach(([key, value]) => {
        translations.push({
          language,
          namespace: "backend",
          key,
          value
        });
      });
    });

    // eslint-disable-next-line no-restricted-syntax
    for await (const translation of translations) {
      await queryInterface.bulkInsert("Translations", [translation], {
        transaction
      });
    }
    await transaction.commit();
  } catch (error) {
    console.error(
      "Error inserting translations:",
      JSON.stringify(error, null, 2)
    );
    await transaction.rollback();
    throw error;
  }
}
