import { useEffect } from 'react';

/**
 * Keeps `--vh` in step with the *visual* viewport.
 *
 * An Android soft keyboard eats roughly 45% of the screen and does not resize
 * the layout viewport, so a docked submit bar ends up underneath it. The
 * prompt-writing lessons are the whole point of World 5 and they are text
 * entry, so this is load-bearing rather than polish.
 */
export function useViewportKeyboard(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;

    const apply = () => {
      const height = viewport?.height ?? window.innerHeight;
      root.style.setProperty('--vh', `${height}px`);
      // Offset for anything docked to the bottom while the keyboard is open.
      const inset = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      root.style.setProperty('--kb', `${inset}px`);
      root.dataset.keyboard = inset > 120 ? 'open' : 'closed';
    };

    apply();
    viewport?.addEventListener('resize', apply);
    viewport?.addEventListener('scroll', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      viewport?.removeEventListener('resize', apply);
      viewport?.removeEventListener('scroll', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
}
