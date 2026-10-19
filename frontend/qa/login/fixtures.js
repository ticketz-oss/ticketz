import React from "react";

export const AuthContext = React.createContext({});

// No persistence, sessions, real credentials, database, or external requests.
let settings = {
  allowSignup: "disabled",
  loginTemplate: "aurora"
};

export const readSettings = () => ({ ...settings });
export const saveSetting = async (key, value) => {
  settings = { ...settings, [key]: value };
};

export default function useSettings() {
  return { getPublicSetting: async key => settings[key] || "" };
}
