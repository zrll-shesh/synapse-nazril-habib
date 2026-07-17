import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F1EB",
        "paper-dim": "#EAE7DD",
        "paper-card": "#FBFAF6",
        ink: "#16211D",
        "ink-soft": "#3D473F",
        teal: {
          DEFAULT: "#0F6B5C",
          soft: "#E4EFEC",
          deep: "#0A4B40",
        },
        amber: {
          DEFAULT: "#C88A2E",
          soft: "#F6EBD8",
        },
        coral: {
          DEFAULT: "#B8493F",
          soft: "#F5E3E0",
        },
        line: "#DAD5C8",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "chart-grid":
          "linear-gradient(to right, #DAD5C8 1px, transparent 1px), linear-gradient(to bottom, #DAD5C8 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};
export default config;
