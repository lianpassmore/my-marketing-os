import type { Config } from "tailwindcss";

const config: Config = {
  content:[
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          storm: '#2D6BFF',   // Storm Blue
          indigo: '#1E3A8A',  // Deep Indigo
          glow: '#E8F0FF',    // Soft Glow
        },
        surface: {
          cloud: '#F6F7FB',   // App background
          paper: '#FFFFFF',   // Cards
          mist: '#E6EAF2',    // Borders
        },
        content: {
          ink: '#0F172A',     // Primary text
          slate: '#64748B',   // Secondary text
        }
      },
    },
  },
  plugins:[],
};
export default config;