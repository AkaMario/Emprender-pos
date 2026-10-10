import { usePathname } from "expo-router";
import React from 'react';
import { Text, View } from 'react-native';
import { ActionPressable as Pressable } from '@/components/ui/action-pressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenScroll } from './screen-scroll';
import { Button, Copy, ErrorText, Heading } from '@/components/business/ui';
import { useDesignColors } from '@/constants/design';

export function PinPad({ title, description, pin, error, busy, onChange, onBack, onContinue }: { title: string; description: string; pin: string; error: string; busy?: boolean; onChange: (pin: string) => void; onBack: () => void; onContinue?: () => void }) {
  const c = useDesignColors(); const pathname = usePathname();
  const keys = ['1','2','3','4','5','6','7','8','9','Limpiar','0','Borrar'];
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}><ScreenScroll contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 480 }}>
    {!pathname.startsWith("/view/settings/") && <Button title="Regresar" secondary disabled={busy} onPress={onBack} />}<Heading>{title}</Heading><Copy>{busy ? 'Validando…' : description}</Copy>
    <View accessible accessibilityLabel={`${pin.length} de 4 dígitos ingresados`} style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', paddingVertical: 16 }}>{[0,1,2,3].map((index) => <View key={index} style={{ flex: 1, maxWidth: 64, minHeight: 56, borderBottomWidth: 2, borderColor: c.primary, justifyContent: 'center', alignItems: 'center' }}><Text importantForAccessibility="no" style={{ fontSize: 28, color: c.text }}>{pin.length > index ? '●' : '○'}</Text></View>)}</View>
    <ErrorText message={error} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{keys.map((key) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={key === 'Borrar' ? 'Borrar último dígito' : key === 'Limpiar' ? 'Limpiar PIN' : key} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { if (key === 'Borrar') onChange(pin.slice(0,-1)); else if (key === 'Limpiar') onChange(''); else if (pin.length < 4) onChange(pin + key); }} style={({ pressed }) => ({ width: '33.333%', minHeight: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 0, backgroundColor: pressed ? c.primaryContainer : c.surface, opacity: busy ? 0.5 : 1 })}><Text style={{ fontSize: key.length > 1 ? 16 : 24, color: c.text, fontWeight: '600' }}>{key}</Text></Pressable>)}</View>
    {onContinue && <Button title="Continuar" loading={busy} disabled={pin.length !== 4} onPress={onContinue} />}
  </ScreenScroll></SafeAreaView>;
}
