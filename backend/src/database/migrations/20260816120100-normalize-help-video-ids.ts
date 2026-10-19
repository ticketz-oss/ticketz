import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // O campo sempre foi documentado como "codigo do video", mas nada impedia
    // de colar a URL inteira — e o front interpolava esse valor cru em
    // img.youtube.com/vi/<video> e youtube.com/watch?v=<video>, gerando capa
    // quebrada e pagina de erro. Extrai o id dos registros ja gravados.
    //
    // Classe [.] no lugar de \. para nao depender de standard_conforming_strings.
    await queryInterface.sequelize.query(`
      UPDATE "Helps"
      SET "video" = substring(
        "video" from '(?:v=|youtu[.]be/|/embed/|/shorts/|/live/)([A-Za-z0-9_-]{11})'
      )
      WHERE "video" ~ '(?:v=|youtu[.]be/|/embed/|/shorts/|/live/)([A-Za-z0-9_-]{11})';
    `);
  },

  // Sem down: o id e a forma canonica e a URL original nao e reconstruivel.
  down: async () => {
    // noop
  }
};
