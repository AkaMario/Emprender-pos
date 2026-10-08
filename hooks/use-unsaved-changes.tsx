import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Dialog } from '@/components/ui/dialog';
import { Button, Copy } from '@/components/business/ui';

export function useUnsavedChanges(dirty: boolean, busy = false, isSaved?: () => boolean) {
  const navigation = useNavigation(); const [action, setAction] = useState<NavigationAction | null>(null);
  usePreventRemove(dirty || busy, ({ data }) => { if (isSaved?.()) navigation.dispatch(data.action); else if (!busy) setAction(data.action); });
  useEffect(() => {
    if (Platform.OS !== 'web' || (!dirty && !busy)) return;
    const listener = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);
  }, [dirty, busy]);
  return <Dialog visible={Boolean(action)} title="¿Salir sin guardar?" onClose={() => setAction(null)}><Copy>Los cambios todavía no se han guardado.</Copy><Button title="Seguir editando" onPress={() => setAction(null)} /><Button title="Descartar y salir" secondary onPress={() => { if (action) navigation.dispatch(action); setAction(null); }} /></Dialog>;
}
