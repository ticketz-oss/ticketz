import { getBackendURL } from "../services/config";

export function urlFotoUsuario(foto) {
  if (!foto || foto.startsWith("blob:") || foto.startsWith("data:")) {
    return foto || undefined;
  }

  const caminho = foto.match(/(?:^|\/public\/)(avatars\/\d+\/[^/]+)$/)?.[1];
  return caminho
    ? `${getBackendURL().replace(/\/$/, "")}/public/${caminho}`
    : foto;
}
