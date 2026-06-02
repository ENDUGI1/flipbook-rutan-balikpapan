import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identitas visual Rutan Kelas IIA Balikpapan
        navy: {
          DEFAULT: "#1F3864",
          50: "#eef1f7",
          100: "#d4dcea",
          600: "#1F3864",
          700: "#182c4e",
          800: "#122139",
          900: "#0c1626",
        },
        gold: {
          DEFAULT: "#F4A21E",
          400: "#f7b54a",
          500: "#F4A21E",
          600: "#d6890f",
        },
      },
      fontFamily: {
        // Wired via next/font di layout.tsx (CSS variables)
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,33,57,0.06), 0 8px 24px -12px rgba(18,33,57,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
