import { Request, Response } from "express";
import GetPublicSettingService from "../services/SettingServices/GetPublicSettingService";

export const manifest = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const appName = await GetPublicSettingService({ key: "appName" });
  const logoFavicon = await GetPublicSettingService({ key: "appLogoFavicon" });

  const mimes = {
    svg: "image/svg+xml",
    png: "image/png",
    ico: "image/x-icon"
  };

  let mimeFavicon = "image/svg+xml";

  if (logoFavicon) {
    const extension = logoFavicon.split(".").pop();
    mimeFavicon = mimes[extension] || "image/x-icon";
  }

  const data = {
    short_name: appName || "TIcketz",
    name: appName || "Ticketz - Chat Based Ticket System",
    icons: [
      {
        src: logoFavicon ? `/backend/public/${logoFavicon}` : "/vector/favicon.svg",
        sizes: "512x512 192x192 64x64 32x32 24x24 16x16",
        type: mimeFavicon
      }
    ],
    start_url: ".",
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff"
  };

  return res.status(200).json(data);
};

export const favicon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const logoFavicon = await GetPublicSettingService({ key: "appLogoFavicon" });
  res.redirect(302, `${process.env.BACKEND_URL}/public/${logoFavicon}`);
  return res;
};
