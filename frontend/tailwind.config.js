/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/components/ui/sign-in.tsx"],
  darkMode: "class",
  // No reset or generic utilities may leak into the existing Material-UI screens.
  corePlugins: { preflight: false },
  important: ".ew-sign-in",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
        },
        border: "hsl(var(--border) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        muted: { foreground: "hsl(var(--muted-foreground) / <alpha-value>)" },
        secondary: "hsl(var(--secondary) / <alpha-value>)"
      }
    }
  },
  plugins: []
};
