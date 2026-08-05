import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0B",
        surface: "#151517",
        "surface-2": "#1D1D20",
        border: "#2A2A2E",
        primary: {
          DEFAULT: "#FF4D1C",
          hover: "#FF6A3D",
        },
        accent: {
          DEFAULT: "#C6FF3D",
        },
        gold: "#FFC93D",
        silver: "#C7CDD6",
        bronze: "#E08A4C",
      },
      fontFamily: {
        display: ["var(--bebas-font)", "system-ui", "sans-serif"],
        sans: ["var(--inter-font)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(198, 255, 61, 0.25)",
        card: "0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
