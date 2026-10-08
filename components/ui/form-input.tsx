import React, { createContext, useContext, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { metrics, radii, useDesignColors } from '@/constants/design';
import { useRevealFocusedInput } from './keyboard-aware-scroll';
const LabelContext = createContext('');
export function FieldGroup({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  const c = useDesignColors();
  return <LabelContext.Provider value={label}><View style={{ gap: 8 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>{children}{error && <Text accessibilityRole="alert" style={{ color: c.error, fontSize: 14 }}>{error}</Text>}</View></LabelContext.Provider>;
}
export function AppInput(props: TextInputProps) {
  const revealFocusedInput = useRevealFocusedInput();
  const label = useContext(LabelContext); const c = useDesignColors(); const mode = useColorScheme(); const [focused, setFocused] = useState(false);
  const input = <TextInput disableFullscreenUI keyboardAppearance={mode} selectionColor={c.primary} cursorColor={c.primary} {...props} accessibilityLabel={props.accessibilityLabel ?? (label || props.placeholder)} placeholderTextColor={c.muted}
    onFocus={(e) => { setFocused(true); revealFocusedInput(); props.onFocus?.(e); }} onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    style={[{ minHeight: metrics.touch, fontSize: 16, color: c.text, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radii.control, borderWidth: focused ? 2 : 1, borderColor: focused ? c.primary : c.border, textAlignVertical: props.multiline ? 'top' : 'center' }, props.style]} />;
  return input;
}
export function AutoField(props: TextInputProps) {
  const label = useContext(LabelContext);
  return label ? <AppInput {...props} /> : <FieldGroup label={props.accessibilityLabel ?? props.placeholder ?? 'Dato'}><AppInput {...props} /></FieldGroup>;
}
