import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Button, Copy, ErrorText, errorMessage } from '@/components/business/ui';
import { useDesignColors } from '@/constants/design';

export function useLoadFeedback(load: () => Promise<unknown>) {
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current; setLoading(true); setError('');
    try { await load(); } catch (cause) { if (request === generation.current) setError(errorMessage(cause)); }
    finally { if (request === generation.current) setLoading(false); }
  }, [load]);
  useFocusEffect(useCallback(() => { void reload(); return () => { generation.current += 1; }; }, [reload]));
  return { loading, error, reload };
}
export function LoadFeedback({ loading, error, reload }: ReturnType<typeof useLoadFeedback>) {
  const c = useDesignColors();
  if (error) return <View style={{ gap: 12 }}><ErrorText message={error} /><Button title="Reintentar" secondary onPress={() => { void reload(); }} /></View>;
  return loading ? <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12 }}><ActivityIndicator color={c.primary} /><Copy>Cargando…</Copy></View> : null;
}
