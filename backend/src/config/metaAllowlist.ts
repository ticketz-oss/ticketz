// Rollout restrito: so empresas nessa lista podem ser colocadas em modo
// "meta" (WhatsApp Cloud API oficial). Editar META_ALLOWED_COMPANY_IDS
// (CSV de ids) e redeployar para liberar outras empresas.
export const isCompanyAllowedForMetaMode = (companyId: number): boolean => {
  const raw = process.env.META_ALLOWED_COMPANY_IDS || "";
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .includes(companyId);
};
