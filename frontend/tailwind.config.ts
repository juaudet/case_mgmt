import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#0d1117',
        panel:    '#161b22',
        elevated: '#21262d',
        subtle:   '#30363d',
        primary:  '#f0f6fc',
        muted:    '#8b949e',
        dim:      '#6e7681',
        'accent-blue':  '#58a6ff',
        'accent-green': '#238636',
        ioc: {
          malicious:  { bg: '#1a0505', border: '#490202' },
          suspicious: { bg: '#1a0e00', border: '#4a2500' },
          clean:      { bg: '#0d1a10', border: '#1a3a20' },
        },
        severity: {
          critical: '#f85149',
          high:     '#f0883e',
          medium:   '#eab308',
          low:      '#3fb950',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        criticalPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(248,81,73,0)', borderColor: '#490202' },
          '50%':       { boxShadow: '0 0 8px 3px rgba(248,81,73,0.35)', borderColor: '#f85149' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(248,81,73,0.4)' },
          '50%':       { transform: 'scale(1.4)', boxShadow: '0 0 0 5px rgba(248,81,73,0)' },
        },
      },
      animation: {
        'critical-pulse': 'criticalPulse 2s ease-in-out infinite',
        'dot-pulse':      'dotPulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
