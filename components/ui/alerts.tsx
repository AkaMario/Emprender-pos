import React, { useRef, useState, useSyncExternalStore } from 'react';
import { Text, type AlertButton, type AlertOptions } from 'react-native';
import { Dialog } from './dialog';
import { Button } from '@/components/business/ui';
import { useDesignColors } from '@/constants/design';

type Notice = { id: number; title: string; message?: string; buttons: AlertButton[]; options?: AlertOptions };
let notices: Notice[] = []; let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const dismiss = (id: number) => { notices = notices.filter((notice) => notice.id !== id); emit(); };
export const AppAlert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    notices = [...notices, { id: ++nextId, title, message, buttons: buttons?.length ? buttons : [{ text: 'Aceptar' }], options }]; emit();
  },
};
export function AlertHost() {
  const queue = useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => notices, () => notices);
  const notice = queue[0]; const [busy, setBusy] = useState(false); const c = useDesignColors();
  const processing = useRef(false);
  if (!notice) return null;
  const close = () => { if (notice.options?.cancelable === false) return; dismiss(notice.id); notice.buttons.find((button) => button.style === 'cancel')?.onPress?.(); notice.options?.onDismiss?.(); };
  return <Dialog visible title={notice.title} onClose={close} busy={busy}>
    {notice.message && <Text style={{ fontSize: 16, lineHeight: 24, color: c.text }}>{notice.message}</Text>}
    {notice.buttons.map((button, index) => <Button key={index} title={button.text ?? 'Aceptar'} secondary={button.style === 'cancel'} destructive={button.style === 'destructive'} disabled={busy} onPress={() => {
      if (processing.current) return;
      processing.current = true;
      setBusy(true);
      Promise.resolve().then(() => button.onPress?.()).catch((cause: unknown) => { AppAlert.alert("No se pudo completar", cause instanceof Error ? cause.message : "Intenta nuevamente."); }).finally(() => { dismiss(notice.id); processing.current = false; setBusy(false); });
    }} />)}
  </Dialog>;
}
