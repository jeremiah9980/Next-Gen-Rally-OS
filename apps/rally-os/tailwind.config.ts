import type { Config } from 'tailwindcss'
import { tailwindPreset } from '@rally/ui/tailwind-preset'

const config: Config = {
  presets: [tailwindPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/config/src/**/*.{ts,tsx}',
  ],
}

export default config
