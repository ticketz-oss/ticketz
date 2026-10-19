import { CookieOptions, Response } from "express";

/**
 * Cookie proprio (`pjrt`) para o refresh do parceiro: permite que uma sessao
 * de admin (`jrt`) e uma sessao de parceiro coexistam no mesmo navegador.
 */
export const SendPartnerRefreshToken = (res: Response, token: string): void => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  if (process.env.BACKEND_URL.startsWith("https:")) {
    cookieOptions.sameSite = "none";
    cookieOptions.secure = true;
  }

  res.cookie("pjrt", token, cookieOptions);
};
