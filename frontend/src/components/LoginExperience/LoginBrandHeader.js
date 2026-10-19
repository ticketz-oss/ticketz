import React from "react";
import { useTheme } from "@material-ui/core";
import { BrandLogo, publicBrandAsset } from "./BrandPanel";

export default function LoginBrandHeader({ settings = {}, children }) {
  const theme = useTheme();
  const logo =
    theme.palette.type === "dark"
      ? settings.appLogoDark || settings.appLogoLight
      : settings.appLogoLight || settings.appLogoDark;
  return (
    <header className="login-toolbar">
      <BrandLogo
        logo={publicBrandAsset(logo)}
        name={settings.appName || "Espaço Whats"}
        compact
      />
      {children}
    </header>
  );
}
