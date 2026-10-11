import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { buttonColors } from '@/constants/button-styles';
import { metrics, radii, useDesignColors } from '@/constants/design';

type SelectionOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
  disabled?: boolean;
  role?: 'radio' | 'checkbox';
};

// Keep the background and both text colors together, using concrete styles so
// NativeWind cannot drop a callback background or retain a stale utility color.
export function SelectionOption({ label, selected, onPress, description, disabled = false, role = 'radio' }: SelectionOptionProps) {
  const c = useDesignColors();
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const colors = buttonColors(c, 'secondary', { selected, pressed, disabled });
  return <Pressable accessibilityRole={role} accessibilityLabel={label} accessibilityHint={description}
    accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress}
    onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setPressed(false); }}
    style={{ minHeight: metrics.touch, minWidth: metrics.touch, paddingHorizontal: 16, paddingVertical: 12,
      justifyContent: 'center', borderRadius: radii.control, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.background, outlineWidth: focused ? 2 : 0, outlineColor: c.primary,
      outlineStyle: 'solid', outlineOffset: 3 }}>
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, lineHeight: 21, fontWeight: '600', color: colors.foreground, flexShrink: 1 }}>{selected ? '✓ ' : ''}{label}</Text>
      {description ? <Text style={{ fontSize: 14, lineHeight: 21, color: selected || disabled ? colors.foreground : c.muted }}>{description}</Text> : null}
    </View>
  </Pressable>;
}
