import { CookieOptions, Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const cookieOptions: CookieOptions = { httpOnly: true }; 

  if (process.env.BACKEND_URL.startsWith("https:") ) {
    cookieOptions.sameSite = "none";
    cookieOptions.secure = true;
  }
   
  res.cookie("jrt", token, cookieOptions);
};
