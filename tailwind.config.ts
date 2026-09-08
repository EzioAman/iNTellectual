import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        val: {
          red: "#ff4655",
          dark: "#0f1923",
          black: "#06070a",
          cyan: "#5bf8ff",
          gold: "#fbbf24",
          violet: "#a855f7",
          emerald: "#10b981",
        }
      },
      fontFamily: {
        teko: ["var(--font-teko)", "sans-serif"],
        syncopate: ["var(--font-syncopate)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        jp: ["var(--font-jp)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
