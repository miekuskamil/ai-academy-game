import type { Config } from 'tailwindcss';

/**
 * Tailwind is wired entirely to the CSS custom properties in
 * `src/styles/tokens.css`. No default palette, no default type scale — that is
 * what stops the UI drifting back to a stock template look, and it means a
 * token change propagates everywhere without a rebuild of class names.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ground: 'var(--c-ground)',
      'ground-deep': 'var(--c-ground-deep)',
      surface: 'var(--c-surface)',
      'surface-hi': 'var(--c-surface-hi)',
      line: 'var(--c-line)',
      'line-soft': 'var(--c-line-soft)',
      ink: 'var(--c-ink)',
      'ink-dim': 'var(--c-ink-dim)',
      'ink-faint': 'var(--c-ink-faint)',
      spark: 'var(--c-spark)',
      'spark-deep': 'var(--c-spark-deep)',
      verified: 'var(--c-verified)',
      anomaly: 'var(--c-anomaly)',
      data: 'var(--c-data)',
    },
    spacing: {
      0: '0',
      1: 'var(--s-1)',
      2: 'var(--s-2)',
      3: 'var(--s-3)',
      4: 'var(--s-4)',
      5: 'var(--s-5)',
      6: 'var(--s-6)',
      7: 'var(--s-7)',
      8: 'var(--s-8)',
      px: '1px',
      nav: 'var(--nav-h)',
    },
    borderRadius: {
      none: '0',
      sm: 'var(--r-sm)',
      md: 'var(--r-md)',
      lg: 'var(--r-lg)',
      full: 'var(--r-full)',
    },
    fontFamily: {
      display: 'var(--f-display)',
      body: 'var(--f-body)',
      mono: 'var(--f-mono)',
    },
    fontSize: {
      xs: 'var(--t-xs)',
      sm: 'var(--t-sm)',
      base: 'var(--t-base)',
      lg: 'var(--t-lg)',
      xl: 'var(--t-xl)',
      '2xl': 'var(--t-2xl)',
      '3xl': 'var(--t-3xl)',
    },
    extend: {
      transitionTimingFunction: { ease: 'var(--m-ease)' },
      transitionDuration: {
        fast: 'var(--m-fast)',
        base: 'var(--m-base)',
        slow: 'var(--m-slow)',
      },
      minHeight: { touch: 'var(--touch-min)' },
      minWidth: { touch: 'var(--touch-min)' },
      maxWidth: { reading: '68ch', shell: '1180px' },
      zIndex: { nav: '40', hud: '30', overlay: '50' },
    },
  },
  plugins: [],
} satisfies Config;
