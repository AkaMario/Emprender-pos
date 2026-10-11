import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useBusiness } from './business';
import { BUSINESS_TUTORIALS, type TutorialTarget } from '@/domain/tutorial';
import { hasSeenBusinessTutorial, markBusinessTutorialSeen } from '@/database/tutorial-database';

type TutorialContextValue = {
  index: number | null; steps: typeof BUSINESS_TUTORIALS.restaurant; busy: boolean; error: string; celebrating: boolean;
  start: () => void; move: (delta: number) => void; close: (completed?: boolean) => Promise<void>;
  targets: React.RefObject<Partial<Record<TutorialTarget, View>>>;
};
const TutorialContext = createContext<TutorialContextValue | null>(null);
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useBusiness();
  const [index, setIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState('');
  const targets = useRef<Partial<Record<TutorialTarget, View>>>({});
  const generation = useRef(0);
  const saving = useRef(false);
  const steps = profile ? BUSINESS_TUTORIALS[profile.model] : [];
  const start = useCallback(() => { setError(''); setCelebrating(false); setIndex(0); }, []);
  useEffect(() => {
    const current = ++generation.current;
    setIndex(null); setCelebrating(false); setError(''); setBusy(false); saving.current = false;
    if (!profile || isLoading) return;
    hasSeenBusinessTutorial(profile.model).then((seen) => {
      if (generation.current === current && !seen) setIndex(0);
    }).catch(() => {
      // An optional guide must not block access to the business.
      if (generation.current === current) setIndex(0);
    });
    return () => { generation.current++; };
  }, [profile, isLoading]);
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => { setCelebrating(false); setIndex(null); }, 2200);
    return () => clearTimeout(timer);
  }, [celebrating]);
  const close = useCallback(async (completed = false) => {
    if (celebrating) { setCelebrating(false); setIndex(null); return; }
    if (!profile || saving.current) return;
    const current = generation.current;
    saving.current = true; setBusy(true); setError('');
    try {
      await markBusinessTutorialSeen(profile.model);
      if (generation.current === current) {
        if (completed) setCelebrating(true);
        else setIndex(null);
      }
    } catch {
      if (generation.current === current) setError('No pudimos guardar el tutorial como visto. Intenta finalizarlo nuevamente.');
    } finally {
      if (generation.current === current) { saving.current = false; setBusy(false); }
    }
  }, [profile, celebrating]);
  const move = useCallback((delta: number) => {
    if (!saving.current) setIndex((current) => current === null ? null : Math.max(0, Math.min(steps.length - 1, current + delta)));
  }, [steps.length]);
  const value = useMemo(() => ({ index, steps, busy, error, celebrating, start, move, close, targets }), [index, steps, busy, error, celebrating, start, move, close]);
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}
export function useTutorial() {
  const value = useContext(TutorialContext);
  if (!value) throw new Error('useTutorial requiere TutorialProvider.');
  return value;
}

/** Anchor the introductory controls of each real screen for the guided tour. */
export function TutorialScreen({ id, children }: { id: TutorialTarget; children: React.ReactNode }) {
  const { targets, index } = useTutorial();
  return <View ref={(node) => { if (node) targets.current[id] = node; else delete targets.current[id]; }} collapsable={false}
    accessibilityElementsHidden={index !== null} importantForAccessibility={index !== null ? 'no-hide-descendants' : 'auto'} style={{ flex: 1 }}>{children}</View>;
}
