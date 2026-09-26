import type { Config } from 'tailwindcss';

/**
 * A token colour that still supports Tailwind's opacity modifier (`bg-spark/10`).
 * Tailwind cannot fade a bare `var(--c-spark)`, so those classes used to produce
 * no CSS at all. `color-mix` fades the token itself, so hex tokens stay as-is.
 */
const tok = (name: string): string =>
  // Tailwind accepts a function colour at runtime; its TS types only list strings.
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue === '1'
      ? `var(--c-${name})`
      : `color-mix(in srgb, var(--c-${name}) calc(${opacityValue} * 100%), transparent)`) as unknown as string;

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
      ground: tok('ground'),
      'ground-deep': tok('ground-deep'),
      surface: tok('surface'),
      'surface-hi': tok('surface-hi'),
      line: tok('line'),
      'line-soft': tok('line-soft'),
      ink: tok('ink'),
      'ink-dim': tok('ink-dim'),
      'ink-faint': tok('ink-faint'),
      spark: tok('spark'),
      'spark-deep': tok('spark-deep'),
      verified: tok('verified'),
      anomaly: tok('anomaly'),
      data: tok('data'),
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
      // Tailwind's default values for every key the tokens do not own, so
      // h-16, w-40 or gap-1.5 work instead of silently producing no CSS.
      // Note keys 5-8 are the design tokens above, not Tailwind's defaults.
      0.5: '0.125rem',
      1.5: '0.375rem',
      2.5: '0.625rem',
      3.5: '0.875rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      48: '12rem',
      56: '14rem',
      64: '16rem',
    },
    borderRadius: {
      none: '0',
      sm: 'var(--r-sm)',
      md: 'var(--r-md)',
      lg: 'var(--r-lg)',
      xl: 'var(--r-xl)',
      '2xl': 'var(--r-2xl)',
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
