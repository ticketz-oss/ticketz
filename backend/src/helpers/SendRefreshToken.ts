import { CookieOptions, Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  if (process.env.BACKEND_URL.startsWith("https:")) {
    cookieOptions.sameSite = "none";
    cookieOptions.secure = true;
  }

  res.cookie("jrt", token, cookieOptions);
};
