// Empresa "master" usada como fallback (dominio raiz / sem slug / slug
// desconhecido). Configuravel via MASTER_COMPANY_ID. Quando nao definida (ou
// invalida), NAO usamos nenhuma empresa cliente como padrao: retornamos null
// para que o frontend caia na marca neutra/generica embutida.
export const getMasterCompanyId = (): number | null => {
  const raw = Number(process.env.MASTER_COMPANY_ID);
  return Number.isInteger(raw) && raw > 0 ? raw : null;
};

export default getMasterCompanyId;
