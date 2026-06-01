import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sina: {
          deep:    '#0A1628',
          navy:    '#0F2747',
          mid:     '#2A4E8C',
          sky:     '#1E88E5',
          skySoft: '#E8F1FC',
          ink:     '#111827',
          body:    '#374151',
          muted:   '#6B7280',
          line:    '#E5E7EB',
          lineSoft:'#F0F1F4',
          bg:      '#F7F8FA',
          mint:    '#0E8A6B',
          amber:   '#B45309',
          rose:    '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)','system-ui','sans-serif'],
      },
      letterSpacing: { tight2: '-0.018em' },
    },
  },
  plugins: [],
};
export default config;
