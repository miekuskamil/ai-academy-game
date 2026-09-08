import { useRef, useState } from 'react';
import { useContainer } from '../../hooks/useContainer';
import { Button } from '../primitives/Button';

/**
 * Save and load progress.
 *
 * Progress already auto-saves to this device on every change. This panel is for
 * the cases auto-save cannot cover: keeping a backup before clearing browser
 * data, moving to another device, and the sandboxed single-file case where the
 * browser silently refuses to persist at all. Shared by the Map footer and the
 * grown-ups' page so there is exactly one implementation.
 */
export function BackupPanel({ compact = false }: { compact?: boolean }) {
  const { progress } = useContainer();
  const fileInput = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const [backupText, setBackupText] = useState<string | null>(null);

  const save = () => {
    setBackupText(null);
    // A sandboxed document blocks blob downloads. Fall back to showing the
    // backup as selectable text rather than failing silently.
    try {
      const blob = new Blob([progress.export()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `neuron-progress-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNote('Saved. Keep that file somewhere safe.');
    } catch {
      setBackupText(progress.export());
      setNote('Downloads are blocked here — copy the text below and keep it safe.');
    }
  };

  const load = async (file: File) => {
    const ok = progress.import(await file.text());
    setNote(
      ok
        ? 'Progress restored from your file.'
        : 'That file could not be read. Nothing was changed.',
    );
  };

  return (
    <div className={compact ? '' : 'rounded-lg border border-line bg-surface p-5'}>
      {!compact && <h2 className="text-lg">Save or move progress</h2>}
      <p className={compact ? 'text-sm text-ink-dim' : 'mt-2 text-sm text-ink-dim'}>
        Progress saves itself on this device automatically. Use these to keep a backup or move to
        another device.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={save}>Save to a file</Button>
        <Button tone="quiet" onClick={() => fileInput.current?.click()}>
          Load from a file
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void load(file);
            e.target.value = '';
          }}
        />
      </div>

      {note && <p className="mt-3 text-sm text-ink-dim">{note}</p>}

      {backupText && (
        <textarea
          readOnly
          value={backupText}
          onFocus={(e) => e.currentTarget.select()}
          rows={4}
          className="mt-3 w-full resize-y rounded-md border border-line bg-ground-deep p-3 font-mono text-xs text-ink-dim"
        />
      )}
    </div>
  );
}
