module.exports = {
  extends: ["react-app", "react-app/jest", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "warn",
    "no-unused-vars": "warn",
    "no-console": "off",
  },
};
