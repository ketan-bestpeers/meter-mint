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
        background: "#FFFFFF",
        foreground: "#111827",
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
        },
        secondary: {
          DEFAULT: "#10B981",
          hover: "#059669",
        },
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          hover: "#E5E7EB",
        },
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
      },
      borderRadius: {
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        none: "none",
      },
    },
  },
  plugins: [],
};
export default config;
