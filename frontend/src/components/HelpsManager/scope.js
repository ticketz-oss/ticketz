import { i18n } from "../../translate/i18n";

// Espelho de backend/src/services/HelpGroupServices/scope.ts. Aqui a regra so
// decide o que a tela mostra e habilita; quem barra de verdade e o backend.

export const companyIdOf = user => Number(user?.companyId ?? user?.company?.id);

/**
 * Super manda em tudo. O admin so mexe no que e da propria empresa — nunca no
 * material da plataforma nem no de parceiros.
 */
export const canManageGroup = (group, user) =>
  !!user?.super ||
  (!group.isGlobal &&
    group.audience === "company" &&
    group.companyId === companyIdOf(user));

/**
 * Balde de um card: publico + escopo. Cada balde e uma lista independente na
 * tela, com a propria sequencia de ordenacao.
 */
export const bucketKey = group =>
  `${group.audience}:${group.isGlobal ? "global" : group.companyId}`;

/**
 * Secoes do painel, na ordem em que aparecem. A listagem do backend so devolve
 * cards globais e da propria empresa, entao sao no maximo estes tres baldes.
 */
export const bucketsOf = (groups, user) => {
  const seen = new Map();

  groups.forEach(group => {
    const key = bucketKey(group);

    if (!seen.has(key)) {
      seen.set(key, {
        key,
        label: bucketLabel(group),
        manageable: canManageGroup(group, user),
        groups: []
      });
    }

    seen.get(key).groups.push(group);
  });

  return [...seen.values()]
    .map(bucket => ({
      ...bucket,
      groups: bucket.groups.slice().sort((a, b) => a.order - b.order)
    }))
    .sort((a, b) => weight(a.key) - weight(b.key));
};

export const bucketLabel = group => {
  if (group.audience === "partner") {
    return i18n.t("helps.audience.partner");
  }

  return group.isGlobal
    ? i18n.t("helps.scope.platform")
    : i18n.t("helps.scope.company");
};

// Plataforma primeiro (e o material que todos veem), depois a empresa, e por
// fim parceiros — que so o super enxerga.
const weight = key => {
  if (key === "company:global") return 0;
  if (key.startsWith("company:")) return 1;
  return 2;
};
