const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");
const prettierPlugin = require("eslint-plugin-prettier");
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "private/**"]
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.es2021,
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      prettier: prettierPlugin
    },
    settings: {
      "import/resolver": {
        typescript: {}
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "_" }],
      "import/prefer-default-export": "off",
      "import/no-duplicates": "error",
      "import/order": "off",
      "no-console": "off",
      "no-param-reassign": "off",
      "no-restricted-syntax": [
        "error",
        "ForInStatement",
        "ForOfStatement",
        "LabeledStatement",
        "WithStatement"
      ],
      "prettier/prettier": "error",
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never"
        }
      ],
      quotes: [
        "warn",
        "double",
        {
          avoidEscape: true
        }
      ]
    }
  },
  eslintConfigPrettier
];
