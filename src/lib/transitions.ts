/**
 * View Transitions with a graceful no-op fallback.
 *
 * Using the platform API rather than an animation library keeps the bundle
 * small and means nothing is fetched at runtime — which matters both for the
 * offline WebView build and for the performance budget.
 */
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function withViewTransition(update: () => void): void {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(update);
}
