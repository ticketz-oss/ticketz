import { Request, Response } from "express";
import mcpConfig from "../config/mcp";
import AppError from "../errors/AppError";
import {
  approveAuthorization,
  authenticateAdminByCompany,
  createAuthorizationRequest,
  exchangeAuthorizationCode,
  findAdminCompaniesByEmail,
  loadAuthorizationRequest,
  registerClient,
  revokeToken,
  rotateRefreshToken
} from "../services/McpServices/OAuthService";
import { renderAuthorizationPage } from "../services/McpServices/OAuthAuthorizationView";

const oauthIssuerOrigin = new URL(mcpConfig.issuer).origin;
const setAuthorizationHeaders = (res: Response, redirectUri: string): void => {
  const redirectOrigin = new URL(redirectUri).origin;
  const authorizationCsp = [
    "default-src 'none'",
    `img-src 'self' ${oauthIssuerOrigin} data:`,
    "style-src 'unsafe-inline'",
    `form-action 'self' ${oauthIssuerOrigin} ${redirectOrigin}`,
    "frame-ancestors 'none'"
  ].join("; ");
  res.setHeader("Content-Security-Policy", authorizationCsp);
  res.setHeader("Cache-Control", "no-store");
};

const redirectWithOAuthError = (
  res: Response,
  redirectUri: string,
  state: string | undefined,
  error: string
): Response => {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  if (state) url.searchParams.set("state", state);
  res.redirect(303, url.toString());
  return res;
};

export const protectedResourceMetadata = async (
  _req: Request,
  res: Response
): Promise<Response> =>
  res.json({
    resource: mcpConfig.resource,
    authorization_servers: [mcpConfig.issuer],
    scopes_supported: mcpConfig.scopes,
    bearer_methods_supported: ["header"],
    resource_documentation: `${mcpConfig.frontendUrl}/chatgpt`
  });

export const authorizationServerMetadata = async (
  _req: Request,
  res: Response
): Promise<Response> =>
  res.json({
    issuer: mcpConfig.issuer,
    authorization_endpoint: `${mcpConfig.issuer}/oauth/authorize`,
    token_endpoint: `${mcpConfig.issuer}/oauth/token`,
    registration_endpoint: `${mcpConfig.issuer}/oauth/register`,
    revocation_endpoint: `${mcpConfig.issuer}/oauth/revoke`,
    jwks_uri: `${mcpConfig.issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: mcpConfig.scopes
  });

export const jwks = async (_req: Request, res: Response): Promise<Response> =>
  res.json({
    keys: [
      {
        ...mcpConfig.publicJwk,
        kid: mcpConfig.keyId,
        use: "sig",
        alg: "RS256"
      }
    ]
  });

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const client = await registerClient(req.body || {});
  return res.status(201).json({
    client_id: client.clientId,
    client_name: client.clientName,
    redirect_uris: client.redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"]
  });
};

export const authorize = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const handle = await createAuthorizationRequest({
    client_id: String(req.query.client_id || ""),
    redirect_uri: String(req.query.redirect_uri || ""),
    response_type: String(req.query.response_type || ""),
    state: typeof req.query.state === "string" ? req.query.state : undefined,
    scope: typeof req.query.scope === "string" ? req.query.scope : undefined,
    code_challenge: String(req.query.code_challenge || ""),
    code_challenge_method: String(req.query.code_challenge_method || ""),
    resource: String(req.query.resource || "")
  });
  const request = await loadAuthorizationRequest(handle);
  setAuthorizationHeaders(res, request.redirectUri);
  return res
    .type("html")
    .send(renderAuthorizationPage({ handle, scopes: request.scopes }, "email"));
};

export const identify = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const handle = String(req.body.handle || "");
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const request = await loadAuthorizationRequest(handle);
  const companies = await findAdminCompaniesByEmail(email);
  setAuthorizationHeaders(res, request.redirectUri);

  if (companies.length === 0) {
    return res.type("html").send(
      renderAuthorizationPage(
        {
          handle,
          scopes: request.scopes,
          error:
            "Não encontramos uma conta administradora ativa com este e-mail. Confira o endereço e tente novamente."
        },
        "email"
      )
    );
  }

  return res
    .type("html")
    .send(
      renderAuthorizationPage(
        { handle, scopes: request.scopes, email, companies },
        "password"
      )
    );
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const handle = String(req.body.handle || "");
  const request = await loadAuthorizationRequest(handle);
  setAuthorizationHeaders(res, request.redirectUri);
  return res
    .type("html")
    .send(renderAuthorizationPage({ handle, scopes: request.scopes }, "email"));
};

export const approve = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const handle = String(req.body.handle || "");
  const request = await loadAuthorizationRequest(handle);
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const companyId = Number(req.body.company_id);
  let authenticated: Awaited<ReturnType<typeof authenticateAdminByCompany>>;
  try {
    if (req.body.consent !== "yes") {
      throw new AppError("consent_required", 400);
    }
    authenticated = await authenticateAdminByCompany(
      companyId,
      email,
      String(req.body.password || "")
    );
  } catch (error) {
    if (
      error instanceof AppError &&
      [400, 401, 403].includes(error.statusCode)
    ) {
      const companies = await findAdminCompaniesByEmail(email);
      setAuthorizationHeaders(res, request.redirectUri);
      return res.type("html").send(
        renderAuthorizationPage(
          {
            handle,
            scopes: request.scopes,
            email,
            companies,
            selectedCompanyId: companyId,
            error:
              error.message === "consent_required"
                ? "Marque a autorização para conectar sua conta."
                : "E-mail ou senha incorretos. Confira os dados e tente novamente."
          },
          companies.length > 0 ? "password" : "email"
        )
      );
    }
    throw error;
  }

  // O handle só é consumido depois da senha válida. Assim um erro de digitação
  // pode ser corrigido na própria tela, mas o código OAuth continua de uso único.
  const consumedRequest = await loadAuthorizationRequest(handle, true);
  const code = await approveAuthorization(
    consumedRequest,
    authenticated.user,
    authenticated.company
  );
  const url = new URL(consumedRequest.redirectUri);
  url.searchParams.set("code", code);
  if (consumedRequest.state)
    url.searchParams.set("state", consumedRequest.state);
  res.redirect(303, url.toString());
  return res;
};

export const cancel = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const request = await loadAuthorizationRequest(req.body.handle, true);
  return redirectWithOAuthError(
    res,
    request.redirectUri,
    request.state,
    "access_denied"
  );
};

export const token = async (req: Request, res: Response): Promise<Response> => {
  let payload;
  if (req.body.grant_type === "authorization_code") {
    payload = await exchangeAuthorizationCode({
      code: req.body.code,
      codeVerifier: req.body.code_verifier,
      clientId: req.body.client_id,
      redirectUri: req.body.redirect_uri,
      resource: req.body.resource
    });
  } else if (req.body.grant_type === "refresh_token") {
    payload = await rotateRefreshToken({
      refreshToken: req.body.refresh_token,
      clientId: req.body.client_id,
      resource: req.body.resource
    });
  } else {
    throw new AppError("unsupported_grant_type", 400);
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  return res.json(payload);
};

export const revoke = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await revokeToken(String(req.body.token || ""));
  return res.status(200).send();
};
