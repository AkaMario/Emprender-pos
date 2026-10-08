import Ionicons from "@expo/vector-icons/Ionicons";
import React from 'react';
import { Text, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorText } from '@/components/business/ui';
import { AppInput } from '@/components/ui/form-input';
import { ScreenScroll } from '@/components/ui/screen-scroll';
import { metrics, useDesignColors } from '@/constants/design';

export function BrandLogo() {
  const c = useDesignColors();
  return <View accessibilityLabel="Emprender" style={{ alignItems: 'center', gap: 12 }}>
    <View style={{ backgroundColor: c.primaryContainer, borderRadius: 20, width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="storefront-outline" size={36} color={c.primary} /></View>
    <Text style={{ fontSize: 28, fontWeight: '700', color: c.text }}>Emprender</Text>
  </View>;
}
export function FieldLabel({ children }: { children: React.ReactNode }) { const c = useDesignColors(); return <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: c.text }}>{children}</Text>; }
export function FormInput(props: TextInputProps) { return <View style={{ marginBottom: 16 }}><AppInput autoCapitalize="none" autoCorrect={false} {...props} style={props.style} /></View>; }
export function PrimaryButton({ children, disabled, onPress }: { children: React.ReactNode; disabled?: boolean; onPress: () => void }) { return <Button title={String(children)} disabled={disabled} onPress={onPress} />; }
export function AuthShell({ children }: { children: React.ReactNode }) {
  const c = useDesignColors();
  const items = React.Children.toArray(children);
  const fields = items.map((child, index) => {
    if (!React.isValidElement(child) || child.type !== FormInput) return child;
    const previous = items.slice(0, index).reverse().find((item) => React.isValidElement(item) && item.type === FieldLabel);
    const label = React.isValidElement(previous) ? String((previous.props as { children: React.ReactNode }).children) : undefined;
    return React.cloneElement(child as React.ReactElement<TextInputProps>, { accessibilityLabel: label });
  });
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}><ScreenScroll contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, maxWidth: metrics.form, paddingBottom: 32 }}><View style={{ marginBottom: 32 }}><BrandLogo /></View>{fields}</ScreenScroll></SafeAreaView>;
}
export function ErrorMessage({ message }: { message: string }) { return message ? <View style={{ marginBottom: 16 }}><ErrorText message={message} /></View> : null; }
