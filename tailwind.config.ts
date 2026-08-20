import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9", 100: "#eceef2", 200: "#d4d8e0", 300: "#aeb5c4",
          400: "#828ba0", 500: "#636d84", 600: "#4d5569", 700: "#3f4657",
          800: "#363b49", 900: "#20232c", 950: "#14151b",
        },
        brand: {
          50: "#eef4ff", 100: "#dfe9ff", 200: "#c6d7fe", 300: "#a3bcfd",
          400: "#7a97fa", 500: "#5570f4", 600: "#3d4fe8", 700: "#333dcd",
          800: "#2d35a5", 900: "#2a3183", 950: "#1b1e52",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(20 21 27 / 0.05)",
        card: "0 1px 3px 0 rgb(20 21 27 / 0.07), 0 1px 2px -1px rgb(20 21 27 / 0.07)",
      },
      borderRadius: { xl2: "1rem" },
    },
  },
  plugins: [],
};
export default config;
