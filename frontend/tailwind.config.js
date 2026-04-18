/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper family — warm off-whites for backgrounds
        paper: {
          50: '#FBF8F0',
          100: '#F6F1E4',
          200: '#EFE7D3',
          300: '#E4D8BC',
        },
        // Ink — warm dark tones for text
        ink: {
          900: '#231F17',
          800: '#3A3325',
          700: '#4F4734',
          600: '#6B6049',
          500: '#8A7F65',
          400: '#A89D82',
        },
        // Sage — muted greens, primary accent
        sage: {
          100: '#E3E8D8',
          200: '#C8D1B4',
          300: '#A8B68C',
          400: '#85976A',
          500: '#6A7E52',
          600: '#546641',
          700: '#404F33',
        },
        // Terracotta — warning/conflict accent (muted rust)
        terra: {
          300: '#D9A582',
          500: '#B4704A',
          700: '#7E4A2A',
        },
        // Card state accents
        like: '#6A7E52',      // sage-500
        reject: '#B4704A',    // terra-500
        flipped: '#8A7F65',   // ink-500
        neutral: '#C8D1B4',   // sage-200 (very soft)
      },
      fontFamily: {
        // Editorial display — warm humanist serif
        display: ['Fraunces', 'Georgia', 'serif'],
        // Reading body — designed for long text
        body: ['Literata', 'Georgia', 'serif'],
        // UI labels, buttons, numbers
        ui: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        // Tabular numbers
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(35,31,23,0.06), 0 2px 8px rgba(35,31,23,0.04)',
        'card-raised': '0 2px 4px rgba(35,31,23,0.08), 0 8px 24px rgba(35,31,23,0.06)',
        'inset-paper': 'inset 0 1px 2px rgba(35,31,23,0.05)',
      },
      borderRadius: {
        'card': '14px',
      },
      transitionTimingFunction: {
        'paper': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
