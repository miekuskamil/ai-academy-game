import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from './lib/router';
import { App } from './App';
import { ContainerProvider } from './hooks/useContainer';
import { SANDBOX_CHECKS } from './ui/sandboxes';
import './styles/index.css';

/**
 * HashRouter rather than BrowserRouter: the same build has to work from a
 * Netlify origin, from a subpath, and from `file://` inside a Capacitor
 * WebView, where history routing has no server to fall back on.
 */
const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

createRoot(root).render(
  <StrictMode>
    <ContainerProvider options={{ sandboxChecks: SANDBOX_CHECKS }}>
      <HashRouter>
        <App />
      </HashRouter>
    </ContainerProvider>
  </StrictMode>,
);

/*
 * Register the service worker for offline + installability, but only when served
 * over http(s). The single-file build runs from file:// (and inside WebViews)
 * where service workers are unavailable and unnecessary — the whole app is
 * already inlined there — so we skip registration to avoid a console error.
 */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    // Resolve relative to the page so it works from a subpath deploy too.
    const swUrl = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker.register(swUrl).catch(() => {
      /* offline-first still works from cache; registration failure is non-fatal */
    });
  });
}
