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
  { token: "{numero}" },
  { token: "{email}" }
];

export const buildCampaignVariableCatalog = (variables = []) => {
  const customVariables = variables
    .filter(variable => variable?.key)
    .map(variable => ({
      token: `{${variable.key}}`
    }));

  const uniqueTokens = new Set();

  return [...campaignNativeVariableCatalog, ...customVariables].filter(item => {
    if (uniqueTokens.has(item.token)) {
      return false;
    }

    uniqueTokens.add(item.token);
    return true;
  });
};