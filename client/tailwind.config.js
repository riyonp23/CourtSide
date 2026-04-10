/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#0a0f1a",
          900: "#0f1629",
          800: "#1a2237",
          700: "#243049",
        },
        accent: {
          DEFAULT: "#f59e0b",
          hover: "#fbbf24",
          muted: "#b45309",
        },
      },
      fontFamily: {
        outfit: ["Outfit", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
