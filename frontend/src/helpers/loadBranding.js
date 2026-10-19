import { getBackendURL } from "../services/config";

// Aplica a identidade visual (cores, logos, nome) no tema.
//
// Centraliza a logica que antes vivia no App.js, para ser reaproveitada tanto
// no carregamento publico (tela de login = empresa master) quanto apos o login
// (empresa do usuario). `setters` e' o objeto colorMode (setPrimaryColorLight,
// setAppLogoLight, ...); `fetchSetting(key)` retorna o valor de cada chave
// (via public-settings ou via settings autenticado, conforme o chamador).

const defaultLogoLight = "/branding/logo-light.png";
const defaultLogoDark = "/branding/logo-dark.png";

const toPublicUrl = file => `${getBackendURL()}/public/${file}`;

export const loadBranding = async (setters, fetchSetting) => {
  const read = async key => {
    try {
      return await fetchSetting(key);
    } catch (_) {
      return "";
    }
  };

  const [
    primaryColorLight,
    primaryColorDark,
    appLogoLight,
    appLogoDark,
    appLogoFavicon,
    appName
  ] = await Promise.all([
    read("primaryColorLight"),
    read("primaryColorDark"),
    read("appLogoLight"),
    read("appLogoDark"),
    read("appLogoFavicon"),
    read("appName")
  ]);

  setters.setPrimaryColorLight(primaryColorLight || "#C2480A");
  setters.setPrimaryColorDark(primaryColorDark || "#FF8A43");
  setters.setAppLogoLight(
    appLogoLight ? toPublicUrl(appLogoLight) : defaultLogoLight
  );
  setters.setAppLogoDark(
    appLogoDark ? toPublicUrl(appLogoDark) : defaultLogoDark
  );
  setters.setAppLogoFavicon(
    appLogoFavicon ? toPublicUrl(appLogoFavicon) : null
  );
  setters.setAppName(appName || "Espaço Whats");
};
