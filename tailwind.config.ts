import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta provisória do "Beauty Light" — ajustar depois com identidade
        // visual definitiva. Rosa suave + carvão para contraste, remetendo a
        // cosméticos sem cair no rosa-choque genérico.
        brand: {
          50: "#fdf3f5",
          100: "#fbe6ea",
          200: "#f5c7d1",
          300: "#eda0b1",
          400: "#e2748d",
          500: "#d1506f",
          600: "#b13a58",
          700: "#8f2c46",
          800: "#6d2236",
          900: "#4a1826",
        },
        ink: "#211b1d",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
    },
  },
  plugins: [],
};

export default config;
