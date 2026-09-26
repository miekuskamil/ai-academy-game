import { useContainer } from '../../hooks/useContainer';
import { THEMES } from '../../domain/pipeline/blocks';
import { cn } from '../../lib/cn';

/**
 * Choose what the finished machine makes.
 *
 * Shown once the picture is complete. The theme only changes the flavour — the
 * item words and the result page — never what the pipeline teaches.
 */
export function ThemePicker() {
  const { progress } = useContainer();


  const pick = (id: string) => {
    progress.setBuild({ theme: id });
  };

  return (
    <section className="nrn-enter">
      <h2 className="text-lg">What should your AI make?</h2>
      <p className="mt-1 max-w-reading text-sm text-ink-dim">
        Your machine is a real AI pipeline. Pick a project and you can run it, one part at a time.
      </p>

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
            <h3 className="font-display text-lg text-ink">{theme.name}</h3>
            <p className="mt-1 text-sm text-ink-dim">{theme.brief}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
