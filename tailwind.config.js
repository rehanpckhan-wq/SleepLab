/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        paper: {
          50: '#FAF9F6',
          100: '#F4F2EC',
          200: '#E8E5DA',
          300: '#D5D0C2',
          800: '#2A2926',
          900: '#1A1917',
        },
        academic: {
          navy: '#1B2A4A',
          slate: '#3A4750',
          muted: '#606C74',
          accent: '#2B579A',
          accentHover: '#1E3E6E',
          border: '#D1D5DB',
        }
      }
    },
  },
  plugins: [],
};
