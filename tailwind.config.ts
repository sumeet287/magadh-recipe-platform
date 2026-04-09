import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Magadh Recipe Brand Colors ===
        brand: {
          50: "#fdf8f0",
          100: "#fbefd9",
          200: "#f6ddb0",
          300: "#f0c579",
          400: "#e8a43f",
          500: "#D4843A", // Primary brand orange-saffron
          600: "#c26b1e",
          700: "#a1521a",
          800: "#83411b",
          900: "#6b3619",
          950: "#3b1a08",
        },
        spice: {
          50: "#fff5f5",
          100: "#ffe0e0",
          200: "#ffc5c5",
          300: "#ff9999",
          400: "#ff5c5c",
          500: "#E53E3E", // Chilli red
          600: "#C53030",
          700: "#9B2C2C",
          800: "#822727",
          900: "#63171B",
        },
        turmeric: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#D4AC0D", // Turmeric gold
          600: "#B7860A",
          700: "#926607",
          800: "#7A4F05",
          900: "#633B04",
        },
        earth: {
          50: "#fdf7f4",
          100: "#f9ede6",
          200: "#f3d8c9",
          300: "#e9bd9f",
          400: "#dc9873",
          500: "#CE7A4F",
          600: "#B85E35",
          700: "#99462A",
          800: "#7D3925",
          900: "#682F22",
          dark: "#2C1810",
        },
        cream: {
          50: "#FFFEF8",
          100: "#FDF8F0", // Main background
          200: "#F9EDD8",
          300: "#F4E0BF",
          400: "#EDD0A0",
        },
        // shadcn/ui compatible color tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        brand: "0 4px 24px -6px rgba(212, 132, 58, 0.35)",
        "brand-lg": "0 12px 40px -8px rgba(212, 132, 58, 0.45)",
        card: "0 2px 16px -4px rgba(44, 24, 16, 0.12)",
        "card-hover": "0 8px 32px -8px rgba(44, 24, 16, 0.20)",
        premium:
          "0 0 0 1px rgba(212, 132, 58, 0.15), 0 8px 32px -8px rgba(212, 132, 58, 0.25)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #D4843A 0%, #C26B1E 50%, #8B3A0F 100%)",
        "hero-gradient":
          "linear-gradient(135deg, #2C1810 0%, #5C2E15 40%, #3B1A08 100%)",
        "cream-gradient":
          "linear-gradient(180deg, #FDF8F0 0%, #F9EDD8 100%)",
        "spice-pattern":
          "radial-gradient(ellipse at 20% 50%, rgba(212, 132, 58, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(229, 62, 62, 0.06) 0%, transparent 60%)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite linear",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        float: "float 3s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [animate],
};

export default config;
