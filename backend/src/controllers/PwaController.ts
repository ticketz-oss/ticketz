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

  let mimeFavicon = "image/png";

  if (logoFavicon) {
    const extension = logoFavicon.split(".").pop();
    mimeFavicon = mimes[extension] || "image/x-icon";
  }

  const data = {
    id: "/",
    short_name: appName || "Espaço Whats",
    name: appName || "Espaço Whats",
    icons: [
      {
        src: logoFavicon
          ? `/backend/public/${logoFavicon}`
          : "/branding/icon.png",
        sizes: "512x512 192x192 64x64 32x32 24x24 16x16",
        type: mimeFavicon
      }
    ],
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#ff6b00",
    background_color: "#fffaf6"
  };

  return res.status(200).json(data);
};

export const favicon = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const logoFavicon = await GetPublicSettingService({ key: "appLogoFavicon" });
  const faviconUrl = logoFavicon
    ? `${process.env.BACKEND_URL}/public/${logoFavicon}`
    : `${process.env.FRONTEND_URL}/branding/icon.png`;
  res.redirect(302, faviconUrl);
  return res;
};
