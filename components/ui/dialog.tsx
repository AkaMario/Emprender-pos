import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Modal, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { metrics, radii, useDesignColors } from '@/constants/design';
import { Button } from '@/components/business/ui';
import { KeyboardSafeView } from './keyboard-safe-view';
import { KeyboardAwareScroll } from './keyboard-aware-scroll';

export function Dialog({ visible, title, children, onClose, dirty = false, busy = false }: { visible: boolean; title: string; children: React.ReactNode; onClose: () => void; dirty?: boolean; busy?: boolean }) {
  const c = useDesignColors(); const [discard, setDiscard] = useState(false); const [reduceMotion, setReduceMotion] = useState(true);
  const heading = useRef<Text>(null);
  useEffect(() => { void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion); return () => sub.remove(); }, []);
  const close = () => { if (busy) return; if (dirty) setDiscard(true); else onClose(); };
  return <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={close} onShow={() => { if (Platform.OS === 'web') return; const node = findNodeHandle(heading.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <KeyboardSafeView style={{ justifyContent: 'center', padding: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar diálogo" onPress={close} style={{ backgroundColor: c.scrim, opacity: 0.6, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <View accessibilityViewIsModal onAccessibilityEscape={close} style={{ width: '100%', maxWidth: metrics.form, maxHeight: '90%', alignSelf: 'center', borderRadius: radii.dialog, backgroundColor: c.surface, padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text ref={heading} accessible accessibilityRole="header" style={{ flex: 1, fontSize: 22, fontWeight: '700', color: c.text }}>{discard ? '¿Descartar los cambios?' : title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar diálogo" accessibilityState={{ disabled: busy }} disabled={busy} onPress={close} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={24} color={c.text} /></Pressable></View>
          <KeyboardAwareScroll keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentContainerStyle={{ gap: 16 }}>
            {discard ? <><Text style={{ color: c.muted, fontSize: 16 }}>Los cambios todavía no se han guardado.</Text><Button title="Seguir editando" onPress={() => setDiscard(false)} /><Button title="Descartar cambios" secondary onPress={() => { setDiscard(false); onClose(); }} /></> : children}
          </KeyboardAwareScroll>
        </View>
      </KeyboardSafeView>
    </SafeAreaView>
  </Modal>;
}
