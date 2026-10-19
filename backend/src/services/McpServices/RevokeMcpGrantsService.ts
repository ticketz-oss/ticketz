import OAuthGrant from "../../models/OAuthGrant";

export const revokeUserMcpGrants = async (userId: number): Promise<number> => {
  const [count] = await OAuthGrant.update(
    { active: false, revokedAt: new Date() },
    { where: { userId, active: true } }
  );
  return count;
};

export const revokeCompanyMcpGrants = async (
  companyId: number
): Promise<number> => {
  const [count] = await OAuthGrant.update(
    { active: false, revokedAt: new Date() },
    { where: { companyId, active: true } }
  );
  return count;
};
