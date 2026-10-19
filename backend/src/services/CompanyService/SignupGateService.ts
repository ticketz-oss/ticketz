import Setting from "../../models/Setting";
import { getMasterCompanyId } from "../../helpers/masterCompany";

// O cadastro pelo site so fica aberto quando a empresa master tem
// allowSignup = enabled. E a mesma empresa que a landing consulta em
// /public-settings/allowSignup, para que pagina e API nunca discordem.
const isSignupAllowed = async (): Promise<boolean> => {
  const companyId = getMasterCompanyId();
  if (!companyId) return false;

  const setting = await Setting.findOne({
    where: { companyId, key: "allowSignup" }
  });

  return setting?.value === "enabled";
};

export default isSignupAllowed;
