const path = require("path");

module.exports = {
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@radix-ui/primitive/is-development$":
          require.resolve("@radix-ui/primitive/is-development")
      }
    }
  },
  webpack: {
    alias: { "@": path.resolve(__dirname, "src") },
    configure: config => {
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: { fullySpecified: false }
      });
      return config;
    }
  }
};
