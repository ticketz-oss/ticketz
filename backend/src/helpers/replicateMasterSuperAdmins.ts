import User from "../models/User";
import { Transaction } from "sequelize";

// Empresa "master" cujos super admins sao replicados para toda nova empresa.
// Configuravel via MASTER_COMPANY_ID (default 1).
const getMasterCompanyId = (): number => {
  const raw = Number(process.env.MASTER_COMPANY_ID);
  return Number.isInteger(raw) && raw > 0 ? raw : 1;
};

// Replica os super admins da empresa master para uma nova empresa, com o
// MESMO passwordHash — assim a mesma senha funciona no subdominio de qualquer
// tenant. Com o login escopado por subdominio, isso permite ao dono da
// plataforma entrar em qualquer empresa pelo respectivo subdominio.
//
// Idempotente: usa findOrCreate por (email, companyId), entao nao duplica se
// o usuario ja existir naquela empresa. Requer a unicidade (companyId, email)
// no banco (ver migration 20260710130000).
export const replicateMasterSuperAdmins = async (
  companyId: number,
  transaction?: Transaction
): Promise<void> => {
  const masterCompanyId = getMasterCompanyId();

  if (companyId === masterCompanyId) {
    return;
  }

  const masterSupers = await User.findAll({
    where: { companyId: masterCompanyId, super: true },
    transaction
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const su of masterSupers) {
    await User.findOrCreate({
      where: { email: su.email, companyId },
      defaults: {
        name: su.name,
        email: su.email,
        passwordHash: su.passwordHash,
        profile: su.profile,
        super: true,
        tokenVersion: 0,
        companyId
      } as User,
      transaction
    });
  }
};

export default replicateMasterSuperAdmins;
