import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter, Routes, Route, Link, Navigate, useParams, matchPath } from './router';

describe('matchPath', () => {
  it('matches a literal path', () => {
    expect(matchPath('/map', '/map')).toEqual({});
    expect(matchPath('/map', '/parent')).toBeNull();
  });

  it('captures named parameters', () => {
    expect(matchPath('/lesson/:lessonId', '/lesson/w1-rules')).toEqual({ lessonId: 'w1-rules' });
  });

  it('decodes an encoded parameter', () => {
    expect(matchPath('/lesson/:id', '/lesson/a%2Fb')).toEqual({ id: 'a/b' });
  });

  it('does not match across a different segment count', () => {
    expect(matchPath('/lesson/:id', '/lesson')).toBeNull();
    expect(matchPath('/lesson/:id', '/lesson/a/b')).toBeNull();
  });

  it('treats the wildcard as a catch-all', () => {
    expect(matchPath('*', '/anything/at/all')).toEqual({});
  });
});

function Harness() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="*" element={<p>fallback</p>} />
        <Route path="/map" element={<Link to="/lesson/abc">go to lesson</Link>} />
        <Route path="/lesson/:lessonId" element={<Lesson />} />
      </Routes>
    </HashRouter>
  );
}

function Lesson() {
  const { lessonId } = useParams();
  return <p>lesson {lessonId}</p>;
}

describe('HashRouter', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  /**
   * The reason this router exists: react-router builds
   * `new URL(path, window.location.origin)`, and on an opaque origin — a
   * sandboxed iframe, file://, or a Capacitor WebView — origin is the string
   * "null", which throws before React renders. Nothing here reads origin.
   */
  it('renders without ever reading window.location.origin', () => {
    window.location.hash = '#/map';
    render(<Harness />);
    expect(screen.getByText('go to lesson')).toBeInTheDocument();
  });

  it('navigates on a link click and exposes route params', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/map';
    render(<Harness />);

    await user.click(screen.getByText('go to lesson'));
    expect(screen.getByText('lesson abc')).toBeInTheDocument();
  });

  it('prefers an exact route over the wildcard regardless of order', () => {
    window.location.hash = '#/map';
    render(<Harness />);
    expect(screen.queryByText('fallback')).not.toBeInTheDocument();
  });

  it('falls back for an unknown path', () => {
    window.location.hash = '#/nowhere';
    render(<Harness />);
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('treats an empty hash as the root', () => {
    window.location.hash = '';
    render(<Harness />);
    // Root redirects to /map.
    expect(screen.getByText('go to lesson')).toBeInTheDocument();
  });

  it('emits an anchor with a hash href so links stay real links', () => {
    window.location.hash = '#/map';
    render(<Harness />);
    expect(screen.getByText('go to lesson')).toHaveAttribute('href', '#/lesson/abc');
  });
});

describe('restricted documents', () => {
  /**
   * about:srcdoc — which is how the app renders inside a sandboxed preview —
   * throws SecurityError on history.replaceState and can refuse hash writes.
   * Navigation must survive both, because the alternative is a blank screen.
   */
  function withBrokenHistory(run: () => void) {
    const realReplace = window.history.replaceState;
    Object.defineProperty(window.history, 'replaceState', {
      configurable: true,
      value: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
    try {
      run();
    } finally {
      Object.defineProperty(window.history, 'replaceState', {
        configurable: true,
        value: realReplace,
      });
    }
  }

  it('still redirects when history.replaceState throws SecurityError', () => {
    withBrokenHistory(() => {
      window.location.hash = '';
      render(<Harness />);
      // <Navigate to="/map" replace> would otherwise die here.
      expect(screen.getByText('go to lesson')).toBeInTheDocument();
    });
  });

  it('still navigates on click when history is blocked', async () => {
    const user = userEvent.setup();
    withBrokenHistory(() => {
      window.location.hash = '#/map';
      render(<Harness />);
    });
    await user.click(screen.getByText('go to lesson'));
    expect(screen.getByText('lesson abc')).toBeInTheDocument();
  });
});
