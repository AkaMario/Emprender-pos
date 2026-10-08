import { useRef, useState } from 'react';
import { useUnsavedChanges } from './use-unsaved-changes';

export function useFormProtection(values: unknown, busy = false, ready = true) {
  const serialized = JSON.stringify(values);
  const [baseline, setBaseline] = useState<string | null>(null);
  const saved = useRef<string | null>(null);
  if (ready && baseline === null) setBaseline(serialized);
  const dialog = useUnsavedChanges(ready && baseline !== null && serialized !== baseline, busy, () => saved.current === serialized);
  return { dialog, markSaved: (nextValues?: unknown) => { const next = nextValues === undefined ? serialized : JSON.stringify(nextValues); saved.current = next; setBaseline(next); } };
}
