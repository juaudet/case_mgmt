import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1A3A5C', light: '#2A5A8C' },
        accent: { DEFAULT: '#E24B4A', muted: '#FCEAEA' },
        surface: { DEFAULT: '#0F1923', card: '#162030', border: '#1E3048' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
    },
  },
  plugins: [],
}

export default config
