/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores principales - Inspirado en carnicería moderna
        primary: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626", // Rojo principal
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        secondary: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569", // Gris azulado
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        accent: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717", // Negro elegante
        },
        // Colores de estado
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        error: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#DBEAFE",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 10px 20px -3px rgba(0, 0, 0, 0.12)",
        button: "0 2px 4px 0 rgba(220, 38, 38, 0.15)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
        "gradient-dark": "linear-gradient(135deg, #171717 0%, #404040 100%)",
      },
    },
  },
  plugins: [],
};
