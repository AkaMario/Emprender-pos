import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { buttonColors, type ButtonVariant } from '@/constants/button-styles';
import { metrics, radii, useDesignColors } from '@/constants/design';

export type ButtonProps = Pick<PressableProps, 'onPress' | 'accessibilityLabel' | 'accessibilityHint' | 'testID'> & {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  icon?: (color: string) => React.ReactNode;
  /** Compatibility with existing consumers. Prefer variant in new code. */
  secondary?: boolean;
  destructive?: boolean;
};

// Pass concrete styles to NativeWind: callback styles can lose their background
// during interop. Keep the label, icon and spinner on the same foreground.
export function Button({ title, onPress, variant, secondary = false, destructive = false, disabled = false, loading = false, selected, icon, ...props }: ButtonProps) {
  const c = useDesignColors(); const [focused, setFocused] = useState(false); const [pressed, setPressed] = useState(false);
  const appearance = variant ?? (destructive ? 'destructive' : secondary ? 'secondary' : 'primary');
  const colors = buttonColors(c, appearance, { pressed, disabled, selected });
  const foreground = colors.foreground;
  return <Pressable {...props} accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading, ...(selected === undefined ? {} : { selected }) }}
    disabled={disabled || loading} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setPressed(false); }}
    onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    style={{ minHeight: metrics.touch, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: radii.control,
        borderWidth: appearance === 'outline' || appearance === 'secondary' || disabled ? 1 : 0, borderColor: colors.border, backgroundColor: colors.background,
        outlineWidth: focused ? 2 : 0, outlineColor: c.primary, outlineStyle: 'solid', outlineOffset: 3, opacity: 1,
        transform: [{ scale: pressed && appearance === 'destructive' ? 0.98 : 1 }] }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      {loading ? <ActivityIndicator accessibilityLabel="Procesando" color={foreground} /> : icon?.(foreground)}
      <Text style={{ fontSize: 16, textAlign: 'center', fontWeight: '700', color: foreground, flexShrink: 1 }}>{selected ? '✓ ' : ''}{title}</Text>
    </View>
  </Pressable>;
}
