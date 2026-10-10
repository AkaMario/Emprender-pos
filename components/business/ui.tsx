import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { metrics, radii, spacing, useDesignColors } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScreenScroll } from '@/components/ui/screen-scroll';
import { useRevealFocusedInput } from '@/components/ui/keyboard-aware-scroll';

export function Page({ children }: { children: React.ReactNode }) {
  const c = useDesignColors();
  return <View style={{ flex: 1, backgroundColor: c.background }}><ScreenScroll contentContainerStyle={{ gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl }}>{children}</ScreenScroll></View>;
}
export function Card({ children }: { children: React.ReactNode }) {
  const c = useDesignColors();
  return <View style={{ gap: 12, borderRadius: radii.card, backgroundColor: c.surface, borderWidth: 1, borderColor: c.separator, padding: spacing.md }}>{children}</View>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  const c = useDesignColors();
  return <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700', color: c.text, flexShrink: 1 }}>{children}</Text>;
}
export function Copy({ children }: { children: React.ReactNode }) {
  const c = useDesignColors();
  return <Text style={{ fontSize: 16, lineHeight: 24, color: c.muted, flexShrink: 1 }}>{children}</Text>;
}
export function ErrorText({ message }: { message: string }) {
  const c = useDesignColors();
  return message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.error, fontSize: 14, lineHeight: 21, padding: 12, borderRadius: radii.control, borderWidth: 1, borderColor: c.separator }}> {message}</Text> : null;
}
export { Button } from '@/components/ui/button';
export function Field({ label, error, hint, required, ...props }: React.ComponentProps<typeof TextInput> & { label: string; error?: string; hint?: string; required?: boolean }) {
  const revealFocusedInput = useRevealFocusedInput();
  const c = useDesignColors(); const mode = useColorScheme(); const [focused, setFocused] = useState(false);
  return <View style={{ gap: spacing.sm }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{label}{required ? ' *' : ''}</Text>
    <TextInput disableFullscreenUI keyboardAppearance={mode} selectionColor={c.primary} cursorColor={c.primary} {...props} accessibilityLabel={props.accessibilityLabel ?? label} accessibilityHint={error || hint} placeholderTextColor={c.muted}
      onFocus={(event) => { setFocused(true); revealFocusedInput(); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      style={[{ minHeight: metrics.touch, borderRadius: radii.control, borderWidth: focused || error ? 2 : 1, borderColor: focused ? c.text : c.border, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: c.text, textAlignVertical: props.multiline ? 'top' : 'center', opacity: props.editable === false ? 0.65 : 1 }, props.style]} />
    {error ? <ErrorText message={error} /> : hint ? <Text style={{ color: c.muted, fontSize: 14 }}>{hint}</Text> : null}
  </View>;
}
export function Choices<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  const c = useDesignColors();
  return <View style={{ gap: 8 }}><Copy>{label}</Copy><View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: option.value === value }} onPress={() => onChange(option.value)} style={({ pressed }) => ({ minHeight: metrics.touch, justifyContent: 'center', borderRadius: radii.control, borderWidth: 1, borderColor: option.value === value ? c.primary : c.border, backgroundColor: option.value === value ? c.primary : c.surface, paddingHorizontal: 12, paddingVertical: 12, transform: [{ scale: pressed ? 0.98 : 1 }] })}><Text style={{ fontSize: 16, fontWeight: '600', color: option.value === value ? c.onPrimary : c.text }}>{option.value === value ? '✓ ' : ''}{option.label}</Text></Pressable>)}</View></View>;
}
export function Loading() { const c = useDesignColors(); return <View accessibilityLiveRegion="polite" style={{ flex: 1, gap: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}><ActivityIndicator size="large" color={c.primary} /><Copy>Cargando emprendimiento…</Copy></View>; }
export function errorMessage(cause: unknown) { return cause instanceof Error ? cause.message : 'No se pudo completar la operación.'; }
