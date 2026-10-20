import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#0f0f1a', panel: '#1a1a2e', accent: '#7c3aed' },
    },
  },
  plugins: [],
};
export default config;
