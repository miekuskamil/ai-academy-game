import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type MouseEvent,
} from 'react';

/**
 * A hash router with no dependencies.
 *
 * Replaces react-router, which constructs `new URL(path, window.location.origin)`
 * internally. On an opaque origin — a sandboxed iframe, a `file://` document, or
 * a Capacitor WebView — `origin` is the literal string "null", which is not a
 * valid base URL, so router construction throws before React renders anything.
 *
 * Everything here works purely from `location.hash`, so the same build runs from
 * an https origin, from a subpath, from disk, and from inside the Android shell.
 */

interface RouterValue {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});

/**
 * Reads the hash, tolerating documents where `location` access is restricted.
 * Returns null when the URL cannot be used as a source of truth.
 */
function readHash(): string | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    return hash.startsWith('/') ? hash : `/${hash}`;
  } catch {
    return null;
  }
}

function normalise(to: string): string {
  return to.startsWith('/') ? to : `/${to}`;
}

export function HashRouter({ children }: { children: ReactNode }) {
  /**
   * In-memory state is authoritative; the URL is a mirror we update on a
   * best-effort basis.
   *
   * A sandboxed document (`about:srcdoc`) throws SecurityError on
   * `history.replaceState` and may refuse hash writes entirely. Treating the
   * URL as the source of truth means one blocked write breaks navigation
   * outright, so instead every URL operation is wrapped and failure is
   * survivable: routing keeps working, only the address bar stops tracking.
   */
  const [path, setPath] = useState(() => readHash() ?? '/');

  useEffect(() => {
    const update = () => {
      const next = readHash();
      if (next) setPath(next);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  const navigate = useCallback<RouterValue['navigate']>((to, options) => {
    const target = normalise(to);
    setPath(target);

    try {
      if (options?.replace) {
        // Avoids stacking a history entry for a redirect.
        window.history.replaceState(null, '', `#${target}`);
      } else {
        window.location.hash = `#${target}`;
      }
    } catch {
      // Sandboxed or restricted document. State above is already correct.
    }
  }, []);

  const value = useMemo<RouterValue>(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('router hooks must be used inside <HashRouter>');
  return value;
}

export function useNavigate() {
  return useRouter().navigate;
}

export function useLocation() {
  return { pathname: useRouter().path };
}

export function useParams(): Record<string, string> {
  return useContext(ParamsContext);
}

/** Matches "/lesson/:lessonId" and "*" against a path. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  if (pattern === '*') return {};
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const segment = patternParts[i]!;
    const value = pathParts[i]!;
    if (segment.startsWith(':')) params[segment.slice(1)] = decodeURIComponent(value);
    else if (segment !== value) return null;
  }
  return params;
}

export interface RouteProps {
  path: string;
  element: ReactNode;
}

/** Declarative only — read by <Routes>, never rendered directly. */
export function Route(_props: RouteProps): null {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  const { path } = useRouter();

  const routes: RouteProps[] = [];
  const walk = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object' && 'props' in node) {
      routes.push((node as { props: RouteProps }).props);
    }
  };
  walk(children);

  // Exact patterns win over the wildcard regardless of declaration order.
  const ordered = [...routes].sort((a, b) => (a.path === '*' ? 1 : b.path === '*' ? -1 : 0));

  for (const route of ordered) {
    const params = matchPath(route.path, path);
    if (params) {
      return <ParamsContext.Provider value={params}>{route.element}</ParamsContext.Provider>;
    }
  }
  return null;
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}

interface LinkProps {
  to: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

export function Link({ to, className, children, 'aria-label': ariaLabel }: LinkProps) {
  const navigate = useNavigate();
  const href = `#${to.startsWith('/') ? to : `/${to}`}`;

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks fall through to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    // Embedding hosts (the Claude preview frame, a Capacitor WebView) attach
    // their own document-level anchor handlers and will try to open the href
    // externally. Stopping propagation keeps the tap inside the app.
    event.stopPropagation();
    navigate(to);
  };

  return (
    <a href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

interface NavLinkProps {
  to: string;
  'aria-label'?: string;
  className?: string | ((state: { isActive: boolean }) => string);
  children: ReactNode | ((state: { isActive: boolean }) => ReactNode);
}

export function NavLink({ to, className, children, 'aria-label': ariaLabel }: NavLinkProps) {
  const { path } = useRouter();
  const isActive = path === to || path.startsWith(`${to}/`);
  const resolved = typeof className === 'function' ? className({ isActive }) : className;
  const content = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link to={to} className={resolved} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
