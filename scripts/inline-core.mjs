/**
 * Collapse the single-file build into one self-contained index.html.
 *
 * The one hazard here is `String.prototype.replace` with a *string*
 * replacement: `$&`, `` $` ``, `$'` and `$$` are interpreted as patterns. A
 * minified React bundle contains `$&2` — a variable named `$` bitwise-anded
 * with 2 — which silently became the matched text `</body>` and produced a file
 * that parsed as HTML but died on the first line of JavaScript.
 *
 * Every injection below therefore uses a replacer *function*, which disables
 * pattern interpretation entirely.
 */

export function inlineBundle({ html, js, css, favicon }) {
  let out = html
    .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
    .replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');

  if (favicon) {
    const uri = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;
    out = out.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" href="${uri}">`);
  }

  // Function replacers: the injected source is used verbatim.
  out = out.replace('</head>', () => `<style>${css}</style>\n</head>`);
  out = out.replace('</body>', () => `<script type="module">${js}</script>\n</body>`);
  return out;
}

/**
 * Cheap structural checks on the finished file.
 *
 * A corrupted bundle still looks like valid HTML, so "it built" proves nothing.
 * These assert the properties that actually matter.
 */
export function verifyInlined(out, { js, css }) {
  const problems = [];

  const scriptMatch = out.match(/<script type="module">([\s\S]*?)<\/script>\s*<\/body>/);
  if (!scriptMatch) problems.push('no inline module script found');
  else if (scriptMatch[1] !== js) problems.push('inlined JavaScript does not match the bundle');

  const styleMatch = out.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) problems.push('no inline stylesheet found');
  else if (styleMatch[1] !== css) problems.push('inlined CSS does not match the bundle');

  if (/src="\.?\/?assets\//.test(out) || /href="\.?\/?assets\//.test(out)) {
    problems.push('still references external assets');
  }
  return problems;
}
