// Espelha `backend/src/helpers/prospeccao.ts`: a Prospecção consome uma API
// externa que gasta crédito de IA por lead e não separa por tenant, então só
// existe no tenant dono da ferramenta. Quem decide de verdade é o backend
// (middleware isProspeccaoUser); aqui é só pra não mostrar um menu que
// responderia 401.
const SLUGS = ["teste"];

export const podeVerProspeccao = user => {
  const slug = String(user?.company?.slug || "")
    .trim()
    .toLowerCase();
  if (!slug || !SLUGS.includes(slug)) return false;
  return user?.super === true || user?.profile === "admin";
};

export default podeVerProspeccao;
