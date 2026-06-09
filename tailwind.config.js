import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

/**
 * Garden Sun — Material Design 3 token set ported from DESIGN.md.
 * Tailwind classes like `bg-primary-container` / `text-on-surface-variant`
 * resolve against these. Keep in sync with DESIGN.md §Color Tokens.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary (Evergreen) ──
        primary: '#00450d',
        'on-primary': '#ffffff',
        'primary-container': '#1b5e20',
        'on-primary-container': '#90d689',
        'primary-fixed': '#acf4a4',
        'primary-fixed-dim': '#91d78a',
        'on-primary-fixed': '#002203',
        'on-primary-fixed-variant': '#0c5216',
        'inverse-primary': '#91d78a',
        'surface-tint': '#2a6b2c',

        // ── Secondary (Solar Gold) ──
        secondary: '#785900',
        'on-secondary': '#ffffff',
        'secondary-container': '#fdc003',
        'on-secondary-container': '#6c5000',
        'secondary-fixed': '#ffdf9e',
        'secondary-fixed-dim': '#fabd00',
        'on-secondary-fixed': '#261a00',
        'on-secondary-fixed-variant': '#5b4300',

        // ── Tertiary (Sprout) ──
        tertiary: '#323e36',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#49554c',
        'on-tertiary-container': '#bcc9be',
        'tertiary-fixed': '#d9e6da',
        'tertiary-fixed-dim': '#bdcabe',
        'on-tertiary-fixed': '#131e17',
        'on-tertiary-fixed-variant': '#3e4a41',

        // ── Surface & neutral ──
        surface: '#f4faff',
        'surface-dim': '#cfdce4',
        'surface-bright': '#f4faff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#e9f6fd',
        'surface-container': '#e3f0f8',
        'surface-container-high': '#ddeaf2',
        'surface-container-highest': '#d7e4ec',
        'surface-variant': '#d7e4ec',
        'on-surface': '#111d23',
        'on-surface-variant': '#41493e',
        'inverse-surface': '#263238',
        'inverse-on-surface': '#e6f3fb',
        background: '#f4faff',
        'on-background': '#111d23',

        // ── Semantic ──
        outline: '#717a6d',
        'outline-variant': '#c0c9bb',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // DESIGN.md note: large floating panels intend 24px, not Tailwind's 16px.
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [forms, containerQueries],
}
