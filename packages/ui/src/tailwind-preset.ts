import type { Config } from 'tailwindcss'

export const tailwindPreset: Config = {
  theme: {
    extend: {
      colors: {
        background: '#0a0a1a',
        surface: '#12122a',
        border: '#1e1e3a',
        accent: {
          lime: '#a3e635',
          purple: '#7c3aed',
        },
        text: {
          primary: '#f1f5f9',
          muted: '#64748b',
        },
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(124, 58, 237, 0.45), 0 10px 30px rgba(10, 10, 26, 0.7)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
}
