import { useContainer } from '../../hooks/useContainer';
import { THEMES } from '../../domain/pipeline/blocks';
import { cn } from '../../lib/cn';

/**
 * Choose the project once, up front.
 *
 * The theme only changes the flavour — the item words and the result page — never
 * which blocks she assembles or what they teach. Kept to a short list so it is a
 * quick, low-stakes decision, changeable later in settings.
 */
export function ThemePicker() {
  const { progress } = useContainer();


  const pick = (id: string) => {
    progress.setBuild({ theme: id });
  };

  return (
    <div className="nrn-enter mx-auto max-w-2xl">
      <header>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">Your build</p>
        <h1 className="mt-1 text-2xl">Pick what you are building</h1>
        <p className="mt-2 max-w-reading text-ink-dim">
          You just unlocked your first pipeline block. Choose a project and every lesson from here
          will build a piece of it. You can change this later.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {THEMES.map((theme, i) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => pick(theme.id)}
            className={cn(
              'nrn-stagger nrn-press rounded-lg border border-line bg-surface p-4 text-left',
              'hover:border-spark',
            )}
            style={{ '--i': i } as React.CSSProperties}
          >
            <h2 className="font-display text-lg text-ink">{theme.name}</h2>
            <p className="mt-1 text-sm text-ink-dim">{theme.brief}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
