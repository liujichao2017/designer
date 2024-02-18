/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"
  ],
  // theme: {
  //   container: {
  //     center: true,
  //     padding: "2rem",
  //     screens: {
  //       "2xl": "1400px",
  //     },
  //   },
  //   extend: {
  //     colors: {
  //       border: "hsl(var(--border))",
  //       input: "hsl(var(--input))",
  //       ring: "hsl(var(--ring))",
  //       background: "hsl(var(--background))",
  //       foreground: "hsl(var(--foreground))",
  //       primary: {
  //         DEFAULT: "hsl(var(--primary))",
  //         foreground: "hsl(var(--primary-foreground))",
  //       },
  //       secondary: {
  //         DEFAULT: "hsl(var(--secondary))",
  //         foreground: "hsl(var(--secondary-foreground))",
  //       },
  //       destructive: {
  //         DEFAULT: "hsl(var(--destructive))",
  //         foreground: "hsl(var(--destructive-foreground))",
  //       },
  //       muted: {
  //         DEFAULT: "hsl(var(--muted))",
  //         foreground: "hsl(var(--muted-foreground))",
  //       },
  //       accent: {
  //         DEFAULT: "hsl(var(--accent))",
  //         foreground: "hsl(var(--accent-foreground))",
  //       },
  //       popover: {
  //         DEFAULT: "hsl(var(--popover))",
  //         foreground: "hsl(var(--popover-foreground))",
  //       },
  //       card: {
  //         DEFAULT: "hsl(var(--card))",
  //         foreground: "hsl(var(--card-foreground))",
  //       },
  //     },
  //     // borderRadius: {
  //     //   lg: "var(--radius)",
  //     //   md: "calc(var(--radius) - 2px)",
  //     //   sm: "calc(var(--radius) - 4px)",
  //     // },
  //     keyframes: {
  //       "accordion-down": {
  //         from: { height: 0 },
  //         to: { height: "var(--radix-accordion-content-height)" },
  //       },
  //       "accordion-up": {
  //         from: { height: "var(--radix-accordion-content-height)" },
  //         to: { height: 0 },
  //       },
  //     },
  //     animation: {
  //       "accordion-down": "accordion-down 0.2s ease-out",
  //       "accordion-up": "accordion-up 0.2s ease-out",
  //     },
  //   },
  // },
  plugins: [require("tailwindcss-animate"), require("daisyui")],
  daisyui: {
    themes: [
      "bumblebee",
      "business",
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=bumblebee]"],
          "primary": "#2F4CDD",
          "color-scheme": "light",
          "primary-content": "#efefef",
          "secondary": "#e0a82e",
          "secondary-content": "#fefefe",
          "accent": "#DC8850",
          "neutral": "#dcdcdc",
          "base-100": "#ffffff",
          "base-200": "#f5f7fa",
          "base-300": "#ecf5ff",
        }
      },
      {
        definer: {
          "primary": "#345ca0",
          "secondary": "#3b82f6",
          "accent": "#059669",
          "neutral": "#191a3e",
          "base-100": "#ffffff",
          "base-200": "#f5f7fa",
          "base-300": "#dcdcdc",
          "base-content": "#181818",
          "info": "#cae2e8",
          "success": "#dff2a1",
          "warning": "#f7e488",
          "error": "#f2b6b5",
        },
      }
    ],
  },
}