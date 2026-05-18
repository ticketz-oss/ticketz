export const scheduleVariableCatalog = [
  { token: "{{firstname}}" },
  { token: "{{name}}" },
  { token: "{{email}}" },
  { token: "{{greeting}}" },
  { token: "{{user}}" },
  { token: "{{time}}" }
];

export const campaignNativeVariableCatalog = [
  { token: "{nome}" },
  { token: "{primeiro_nome}" },
  { token: "{numero}" },
  { token: "{email}" },
  { token: "{saudacao}" },
  { token: "{hora}" },
  { token: "{data}" }
];

export const buildCampaignVariableCatalog = (
  variables = [],
  extraFieldNames = []
) => {
  const customVariables = variables
    .filter(variable => variable?.key)
    .map(variable => ({
      token: `{${variable.key}}`
    }));

  const extraFieldVariables = extraFieldNames
    .filter(Boolean)
    .map(name => ({
      token: `{${name}}`
    }));

  const uniqueTokens = new Set();

  return [
    ...campaignNativeVariableCatalog,
    ...customVariables,
    ...extraFieldVariables
  ].filter(item => {
    if (uniqueTokens.has(item.token)) {
      return false;
    }

    uniqueTokens.add(item.token);
    return true;
  });
};