import { describe, expect, it } from 'vitest';
import { inlineBundle, verifyInlined } from './inline-core.mjs';

const html = `<!doctype html><html><head><link rel="stylesheet" href="/assets/a.css"></head><body><div id="root"></div><script type="module" src="/assets/a.js"></script></body></html>`;

describe('inlineBundle', () => {
  /**
   * The bug this exists for: `String.replace` with a string replacement treats
   * `$&` as "the matched text". Minified React contains `$&2` — a variable
   * named `$` bitwise-anded with 2 — which silently became `</body>2` and shipped
   * a file that parsed as HTML and died on the first line of JavaScript.
   */
  it('preserves $& in the bundle instead of expanding it', () => {
    const js = 'if(r=r.shared,$&2){go()}';
    const out = inlineBundle({ html, js, css: 'body{color:red}' });
    expect(out).toContain('$&2');
    expect(out).not.toContain('</body>2');
  });

  it.each(['$&', '$`', "$'", '$$', '$1'])('preserves the %s sequence', (token) => {
    const js = `var x="${token}";`;
    const out = inlineBundle({ html, js, css: 'a{}' });
    expect(out).toContain(`var x="${token}";`);
  });

  it('preserves $& in CSS too', () => {
    const css = 'a::after{content:"$&"}';
    const out = inlineBundle({ html, js: 'x()', css });
    expect(out).toContain('content:"$&"');
  });

  it('removes every external asset reference', () => {
    const out = inlineBundle({ html, js: 'x()', css: 'a{}' });
    expect(verifyInlined(out, { js: 'x()', css: 'a{}' })).toEqual([]);
  });

  it('reports corruption rather than writing a broken file', () => {
    const out = inlineBundle({ html, js: 'x()', css: 'a{}' }).replace('x()', 'y()');
    expect(verifyInlined(out, { js: 'x()', css: 'a{}' })).toContain(
      'inlined JavaScript does not match the bundle',
    );
  });
});
