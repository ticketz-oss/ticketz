import AppError from "../../errors/AppError";
import { getMetaGraphApiClient, withAuth } from "./MetaGraphApiClient";

interface Request {
  accessToken: string;
  wabaId: string;
  phoneNumberId: string;
  businessId?: string;
}
interface VerifiedAssets {
  businessId: string | null;
  tokenExpiresAt: Date | null;
}
const validId = (id: unknown): id is string =>
  typeof id === "string" && /^\d{1,32}$/.test(id);
const unauthorized = () => new AppError("ERR_META_ASSETS_NOT_AUTHORIZED", 403);

// Session postMessage values are hints from the browser. Verify the token's
// app/grants and the WABA-to-number relationship before registration or any
// webhook mutation. These are read-only requests using this customer's token.
const AssertMetaSignupAssetsService = async ({
  accessToken,
  wabaId,
  phoneNumberId,
  businessId
}: Request): Promise<VerifiedAssets> => {
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  if (!appId || !secret) throw new AppError("ERR_META_APP_NOT_CONFIGURED", 500);
  if (
    !validId(wabaId) ||
    !validId(phoneNumberId) ||
    (businessId !== undefined && !validId(businessId))
  )
    throw unauthorized();

  try {
    const client = getMetaGraphApiClient();
    const { data: inspection } = await client.get("/debug_token", {
      ...withAuth(`${appId}|${secret}`),
      params: { input_token: accessToken }
    });
    const token = inspection?.data;
    if (
      token?.is_valid !== true ||
      String(token.app_id) !== appId ||
      !Array.isArray(token.scopes) ||
      !["whatsapp_business_management", "whatsapp_business_messaging"].every(
        scope => token.scopes.includes(scope)
      )
    )
      throw unauthorized();
    const managementGrant =
      Array.isArray(token.granular_scopes) &&
      token.granular_scopes.find(
        grant => grant.scope === "whatsapp_business_management"
      );
    if (
      !Array.isArray(managementGrant?.target_ids) ||
      !managementGrant.target_ids.map(String).includes(wabaId)
    )
      throw unauthorized();

    const expiries = [token.expires_at, token.data_access_expires_at]
      .map(Number)
      .filter(value => Number.isFinite(value) && value > 0);
    if (expiries.some(value => value * 1000 <= Date.now()))
      throw unauthorized();

    const { data: account } = await client.get(`/${wabaId}`, {
      ...withAuth(accessToken),
      params: { fields: "id,owner_business_info" }
    });
    if (String(account?.id) !== wabaId) throw unauthorized();
    const verifiedBusinessId = account?.owner_business_info?.id;
    if (
      businessId &&
      validId(verifiedBusinessId) &&
      verifiedBusinessId !== businessId
    )
      throw unauthorized();

    let after: string | undefined;
    const seen = new Set<string>();
    for (let page = 0; page < 100; page += 1) {
      const { data } = await client.get(`/${wabaId}/phone_numbers`, {
        ...withAuth(accessToken),
        params: { fields: "id", limit: 100, ...(after ? { after } : {}) }
      });
      if (
        Array.isArray(data?.data) &&
        data.data.some(phone => String(phone.id) === phoneNumberId)
      ) {
        return {
          businessId: validId(verifiedBusinessId) ? verifiedBusinessId : null,
          tokenExpiresAt: expiries.length
            ? new Date(Math.min(...expiries) * 1000)
            : null
        };
      }
      if (!data?.paging?.next) throw unauthorized();
      // Do not follow Graph paging URLs with the bearer token. Only consume
      // its opaque cursor and always call our fixed WABA phone-number path.
      const cursor = data?.paging?.cursors?.after;
      if (typeof cursor !== "string" || !cursor || seen.has(cursor))
        throw unauthorized();
      seen.add(cursor);
      after = cursor;
    }
    throw unauthorized();
  } catch (error) {
    if (error instanceof AppError) throw error;
    // No upstream payload, token, app secret or query string may escape.
    throw new AppError("ERR_META_ASSET_VERIFICATION_FAILED", 502);
  }
};

export default AssertMetaSignupAssetsService;
