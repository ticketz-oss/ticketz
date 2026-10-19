// Espelha `backend/src/helpers/billingConsole.ts`: a Central de Cobrança é a
// tela do financeiro da operação e só existe no tenant dono da plataforma.
// O backend decide de verdade (middleware isBillingAdmin); aqui é só pra não
// mostrar um menu que responderia 401.
const SLUGS = ["teste"];

export const podeVerCentralCobranca = user => {
  const slug = String(user?.company?.slug || "")
    .trim()
    .toLowerCase();
  if (!slug || !SLUGS.includes(slug)) return false;
  return user?.super === true || user?.profile === "admin";
};

export default podeVerCentralCobranca;
