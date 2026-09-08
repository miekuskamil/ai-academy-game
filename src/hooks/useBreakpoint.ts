import { useEffect, useState } from 'react';

/** 768px is the switch from a thumb-driven handset layout to a pointer layout.
 *  Below it: bottom navigation. Above: a persistent rail. */
export const HANDSET_MAX = 768;

export type Layout = 'handset' | 'desk';

function read(): Layout {
  if (typeof window === 'undefined') return 'handset';
  return window.innerWidth > HANDSET_MAX ? 'desk' : 'handset';
}

export function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>(read);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${HANDSET_MAX + 1}px)`);
    const update = () => setLayout(query.matches ? 'desk' : 'handset');
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return layout;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}
