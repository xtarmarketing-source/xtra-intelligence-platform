import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#B32026",
          dark: "#8C1A1F",
          tint: "#FBEAEA",
          tint2: "#F6DBDB",
        },
        ink: {
          DEFAULT: "#211C1C",
          soft: "#736A68",
        },
        line: {
          DEFAULT: "#E9E3E2",
          soft: "#F2EEED",
        },
        good: { DEFAULT: "#1E8E5A", soft: "#E7F5EE" },
        warn: { DEFAULT: "#C97A1B", soft: "#FBF0DF" },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "Segoe UI",
          "Noto Sans Thai",
          "Leelawadee UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
