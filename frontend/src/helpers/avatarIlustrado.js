import templates from "./oneworksTemplates.json";

export function avatarIlustrado(tipo, id) {
  if (id === undefined || id === null || id === "") return undefined;

  const chave = `v2:${tipo}:${id}`;
  let hash = 2166136261;
  for (let i = 0; i < chave.length; i += 1) {
    hash ^= chave.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const template = templates[(hash >>> 0) % templates.length];
  return `/avatars/oneworks/v2/${template}.svg`;
}
