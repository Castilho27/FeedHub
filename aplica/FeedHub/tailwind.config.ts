import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // New blue palette
        blue: {
          50: "#e9f2fc",
          100: "#d3e5f9",
          200: "#a8cff5",
          300: "#7db9f0",
          400: "#5294e6",
          500: "#3a72c2",
          600: "#1a3e55",
          700: "#091e2c",
          800: "#051521",
          900: "#020a10",
        },
        primary: {
          DEFAULT: "#091e2c",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1a3e55",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#a8cff5",
          foreground: "#e9f2fc",
        },
        // background: {
        //   DEFAULT: "#e9f2fc",
        // },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(9, 30, 44, 0.05), 0 1px 2px rgba(9, 30, 44, 0.1)",
        md: "0 4px 6px rgba(9, 30, 44, 0.05), 0 2px 4px rgba(9, 30, 44, 0.1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
