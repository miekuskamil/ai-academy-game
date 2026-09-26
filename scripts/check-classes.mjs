/**
 * Fails the build when a class used in the source produces no CSS.
 *
 * The Tailwind config maps colours, spacing and radii to design tokens, so a
 * stock class like `h-16`, `rounded-xl` or `bg-spark/10` can silently generate
 * nothing and collapse a layout without any error. This caught 30+ such classes
 * once; it runs after every build so it cannot happen again unnoticed.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist/assets';
const css = fs
  .readdirSync(dist)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(dist, f), 'utf8'))
  .join('\n');

// Single-word utilities that are real Tailwind classes (no hyphen to spot them by).
const WORDS = new Set([
  'flex', 'grid', 'block', 'inline', 'hidden', 'contents', 'relative', 'absolute', 'fixed', 'sticky',
  'static', 'underline', 'italic', 'truncate', 'uppercase', 'lowercase', 'capitalize', 'border',
  'rounded', 'shadow', 'transition', 'grow', 'shrink', 'invisible', 'visible', 'container', 'isolate',
]);
const looksLikeUtility = (t) =>
  /^(?:[a-z0-9[\]&:=_-]+:)*!?-?[a-z][a-z0-9]*(?:-[a-z0-9./[\]%#(),_+*'-]+)*$/.test(t) &&
  (t.includes('-') || WORDS.has(t.split(':').pop().replace(/^!/, ''))) &&
  !/\.[a-z]/i.test(t.replace(/\d\.\d/g, '')); // "check.hit" is JS, "h-1.5" is a class

const escape = (s) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f) && !/\.test\./.test(f)) files.push(p);
  }
})('src');

const dead = new Map();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  // className="..." and every quoted string inside className={cn(...)} / template.
  const blocks = [
    ...[...src.matchAll(/className="([^"]+)"/g)].map((m) => m[1]),
    ...[...src.matchAll(/className=\{([\s\S]*?)\}\s*(?:\n|\/?>|[a-z-]+=)/g)].flatMap((m) =>
      [...m[1].matchAll(/'([^']*)'|`([^`]*)`/g)].map((q) => (q[1] ?? q[2] ?? '').replace(/\$\{[^}]*\}/g, ' ')),
    ),
  ];
  for (const block of blocks) {
    for (const token of block.split(/\s+/)) {
      if (!token || token.startsWith('nrn-') || !looksLikeUtility(token)) continue;
      if (css.includes(`.${escape(token)}`)) continue;
      if (!dead.has(token)) dead.set(token, new Set());
      dead.get(token).add(path.relative('src', file));
    }
  }
}

// App-level classes defined in our own CSS rather than by Tailwind.
const OWN = ['tap-target', 'skip-link', 'field-grid', 'group'];
for (const k of OWN) dead.delete(k);

if (dead.size) {
  console.error(`check-classes: ${dead.size} class(es) produce no CSS:`);
  for (const [cls, where] of dead) console.error(`  ${cls.padEnd(30)} ${[...where].join(', ')}`);
  process.exit(1);
}
console.log('check-classes: every class used in src produces CSS');
