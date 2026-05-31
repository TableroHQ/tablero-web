/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        terracotta: { DEFAULT: '#C8553D', dark: '#A8432D', light: '#E37A65' },
        amber2: { DEFAULT: '#E4883A', dark: '#C26A1A' },
        cream: { DEFAULT: '#FAFAF8', sub: '#F2EFEB', warm: '#EFEAE2' },
        ink: { DEFAULT: '#2C221E', body: '#5C534D', muted: '#8A817C' },
        kds: { bg: '#1C1917', surface: '#292524', surface2: '#3A332E' },
        ok: { DEFAULT: '#437E55', bg: '#EDF5F0' },
        warn: { DEFAULT: '#E4883A', bg: '#FDF3EB' },
        err: { DEFAULT: '#D14949', bg: '#FCECEC' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        '4xl': '2rem',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        fn: ['Outfit', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
