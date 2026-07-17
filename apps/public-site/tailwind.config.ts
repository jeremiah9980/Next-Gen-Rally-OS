import type { Config } from 'tailwindcss'
import { tailwindPreset } from '@rally/ui/tailwind-preset'

const config: Config = {
  presets: [tailwindPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/site-template/src/**/*.{ts,tsx}',
  ],
}

export default config
